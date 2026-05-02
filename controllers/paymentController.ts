import Razorpay from 'razorpay';
import crypto from 'crypto';
import { config } from 'dotenv';
import mongoose from 'mongoose';
import Booking from '../models/bookingModel';
import productModel from '../models/productModel';
import User from '../models/User';
import emailService from '../services/emailService';

// Load environment variables FIRST
config();

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface CartItemInput {
  productId: string;
  quantity: number;
}

interface VerifiedCartItem {
  productId: mongoose.Types.ObjectId;
  productName: string;
  quantity: number;
  price: number;
  image?: string;
}

interface VerifyPaymentBody {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  cartItems: CartItemInput[];
  shippingAddress: {
    name: string;
    email: string;
    phone: string;
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country?: string;
  };
}

// ─────────────────────────────────────────────
// Razorpay singleton
// ─────────────────────────────────────────────
class RazorpayGateway {
  private instance: Razorpay | null = null;
  private readonly keyId: string;
  private readonly keySecret: string;

  constructor() {
    this.keyId = process.env.RAZORPAY_KEY_ID || '';
    this.keySecret = process.env.RAZORPAY_KEY_SECRET || '';

    if (!this.keyId || !this.keySecret) {
      console.warn('⚠️  Razorpay credentials missing – payment operations will fail.');
      return;
    }

    try {
      this.instance = new Razorpay({
        key_id: this.keyId,
        key_secret: this.keySecret,
      });
      console.log('✓ Razorpay gateway initialised |', this.keyId.substring(0, 14) + '...');
    } catch (err: any) {
      console.error('❌ Razorpay init failed:', err.message);
    }
  }

  getInstance(): Razorpay {
    if (!this.instance) throw new Error('Razorpay not initialised – check credentials.');
    return this.instance;
  }

  getKeyId(): string {
    return this.keyId;
  }

  getKeySecret(): string {
    return this.keySecret;
  }
}

const gateway = new RazorpayGateway();

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

/**
 * CRITICAL – Fetch fresh prices from the database.
 * Never trust client-supplied prices.
 */
async function verifyAndPriceItems(cartItems: CartItemInput[]): Promise<{
  items: VerifiedCartItem[];
  totalAmount: number;
}> {
  if (!cartItems || cartItems.length === 0) {
    throw new Error('Cart is empty.');
  }

  const items: VerifiedCartItem[] = [];
  let totalAmount = 0;

  for (const cartItem of cartItems) {
    const { productId, quantity } = cartItem;

    if (!productId || !quantity || quantity < 1) {
      throw new Error(`Invalid cart item: productId=${productId}, quantity=${quantity}`);
    }

    // Fetch from DB – this is the authoritative price source
    const productDoc = await productModel.findById(productId);
    
    if (!productDoc) {
      console.error(`❌ Payment Error: Product not found in DB with ID: ${productId}`);
      throw new Error(`Product not found: ${productId}`);
    }

    // CRITICAL: Convert to plain object to access fields NOT in the schema (like 'name' and 'price')
    const product = productDoc.toObject();

    // Parse price – stored as String or Number
    const priceValue = product.productPrice || (product as any).price || (product as any).finalPrice;
    const nameValue = product.productName || (product as any).name || 'Unknown Product';
    const discountValue = product.productDiscount || (product as any).discountPercentage || 0;

    const unitPrice = parseFloat(String(priceValue).replace(/[^0-9.]/g, ''));
    if (isNaN(unitPrice) || unitPrice <= 0) {
      console.error(`❌ Invalid price detected for product:`, nameValue, '| Raw Price:', priceValue);
      throw new Error(`Invalid price for product: ${nameValue}`);
    }

    // Apply discount if available
    let finalUnitPrice = unitPrice;
    if (discountValue > 0) {
      // If the field is discountPercentage (e.g. 10), we calculate it.
      // If it's already the finalPrice, we use it directly.
      if (priceValue === (product as any).finalPrice) {
        finalUnitPrice = unitPrice;
      } else {
        finalUnitPrice = unitPrice - (unitPrice * discountValue) / 100;
      }
    }

    finalUnitPrice = Math.round(finalUnitPrice * 100) / 100; // 2 dp
    const lineTotal = finalUnitPrice * quantity;
    totalAmount += lineTotal;

    items.push({
      productId: product._id as mongoose.Types.ObjectId,
      productName: nameValue as string,
      quantity,
      price: finalUnitPrice,
      image: (product.productImage as string[])?.[0] || (product as any).image,
    });
  }

  return { items, totalAmount: Math.round(totalAmount * 100) / 100 };
}

/** HMAC-SHA256 signature verification – constant-time compare */
function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const payload = `${orderId}|${paymentId}`;
  const expected = crypto
    .createHmac('sha256', gateway.getKeySecret())
    .update(payload)
    .digest('hex');

  // Constant-time comparison prevents timing attacks
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

/** Generate unique booking orderId */
async function generateOrderId(): Promise<string> {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let orderId = '';
  let exists = true;

  while (exists) {
    orderId = 'TWS-';
    for (let i = 0; i < 8; i++) {
      orderId += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const booking = await Booking.findOne({ orderId });
    exists = booking !== null;
  }

  return orderId;
}

// ─────────────────────────────────────────────
// Route Handlers
// ─────────────────────────────────────────────

/**
 * POST /api/payment/create-order
 * 
 * Step 1 of Razorpay flow.
 * Frontend sends cartItems: [{ productId, quantity }].
 * Backend fetches real prices, creates Razorpay order, returns orderId + amount.
 */
async function createRazorpayOrder(req: any, res: any) {
  try {
    const userId = req.userId;
    const { cartItems, shippingAddress } = req.body as {
      cartItems: CartItemInput[];
      shippingAddress: VerifyPaymentBody['shippingAddress'];
    };

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    if (!shippingAddress?.name || !shippingAddress?.email || !shippingAddress?.phone ||
        !shippingAddress?.street || !shippingAddress?.city || !shippingAddress?.state ||
        !shippingAddress?.postalCode) {
      return res.status(400).json({ success: false, message: 'Incomplete shipping address' });
    }

    // ── Server-side price verification ──────────────────────────────────────
    const { items, totalAmount } = await verifyAndPriceItems(cartItems);

    if (totalAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid order amount' });
    }

    const amountInPaise = Math.round(totalAmount * 100); // Razorpay works in paise

    // ── Create Razorpay order ────────────────────────────────────────────────
    const receipt = `rcpt_${userId.toString().slice(-6)}_${Date.now()}`;

    const rzpOrder = await (gateway.getInstance().orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt,
      notes: {
        userId: String(userId),
        itemCount: String(items.length),
        customerName: shippingAddress.name,
        customerEmail: shippingAddress.email,
      },
    }) as any);

  
    return res.status(200).json({
      success: true,
      data: {
        razorpayOrderId: rzpOrder.id,
        amount: amountInPaise,            // in paise
        currency: rzpOrder.currency,
        keyId: gateway.getKeyId(),        // public key for frontend SDK
        serverCalculatedTotal: totalAmount, // for display only
        verifiedItems: items.map(i => ({
          productName: i.productName,
          quantity: i.quantity,
          unitPrice: i.price,
          lineTotal: i.price * i.quantity,
        })),
      },
    });
  } catch (err: any) {
    console.error('❌ createRazorpayOrder error:', err);
    if (err?.statusCode === 401) {
      return res.status(400).json({ success: false, message: 'Invalid Razorpay credentials' });
    }
    return res.status(500).json({ success: false, message: err.message || 'Failed to create payment order' });
  }
}

/**
 * POST /api/payment/verify-and-book
 *
 * Step 2 of Razorpay flow.
 * Backend:
 *   1. Verifies HMAC signature cryptographically
 *   2. Re-fetches prices from DB (second verification)
 *   3. Creates booking record
 *   4. Sends confirmation email
 *
 * Booking is ONLY created after verified payment – never before.
 */
async function verifyAndBook(req: any, res: any) {
  try {
    const userId = req.userId;
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      cartItems,
      shippingAddress,
    } = req.body as VerifyPaymentBody;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // ── 1. Input validation ──────────────────────────────────────────────────
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing Razorpay payment parameters',
      });
    }

    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    if (!shippingAddress?.name || !shippingAddress?.email || !shippingAddress?.phone ||
        !shippingAddress?.street || !shippingAddress?.city || !shippingAddress?.state ||
        !shippingAddress?.postalCode) {
      return res.status(400).json({ success: false, message: 'Incomplete shipping address' });
    }

    // ── 2. Cryptographic signature verification ──────────────────────────────
    let isSignatureValid = false;
    try {
      isSignatureValid = verifyRazorpaySignature(
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
      );
    } catch {
      // Buffer length mismatch → tampered signature
      isSignatureValid = false;
    }

    if (!isSignatureValid) {
      console.warn(`⚠️  Signature verification FAILED for order: ${razorpay_order_id}`);
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed. Possible tampering detected.',
      });
    }

    
    // ── 3. Second server-side price recalculation ────────────────────────────
    //      Even after signature check, re-verify prices from DB to protect
    //      against any edge-case where signature matches but prices were wrong.
    const { items, totalAmount } = await verifyAndPriceItems(cartItems);

    // ── 4. Fetch Razorpay order to cross-check amount ────────────────────────
    const rzpOrder = await (gateway.getInstance().orders.fetch(razorpay_order_id) as any);
    const rzpAmountInRupees = Number(rzpOrder.amount) / 100;
    const tolerance = 0.01; // 1 paise tolerance for floating point

    if (Math.abs(rzpAmountInRupees - totalAmount) > tolerance) {
      console.warn(
        `⚠️  Amount mismatch! Razorpay: ₹${rzpAmountInRupees} | DB-calculated: ₹${totalAmount}`
      );
      return res.status(400).json({
        success: false,
        message: 'Payment amount mismatch. Order rejected for security.',
      });
    }

    // ── 5. Prevent duplicate bookings for same payment ───────────────────────
    const existingBooking = await Booking.findOne({ transactionId: razorpay_payment_id });
    if (existingBooking) {
      return res.status(409).json({
        success: false,
        message: 'Order already processed for this payment',
      });
    }

    // ── 6. Get user info for email ───────────────────────────────────────────
    const user = await User.findById(userId);
    const customerEmail = user?.email || shippingAddress.email;

    // ── 7. Create booking ────────────────────────────────────────────────────
    const firstOrderId = await generateOrderId();

    const booking = new Booking({
      userId,
      orderId: firstOrderId,
      items,
      totalAmount,
      discountAmount: 0,
      finalAmount: totalAmount,
      deliveryAddress: {
        name: shippingAddress.name,
        email: shippingAddress.email,
        phone: shippingAddress.phone,
        street: shippingAddress.street,
        city: shippingAddress.city,
        state: shippingAddress.state,
        postalCode: shippingAddress.postalCode,
        country: shippingAddress.country || 'India',
      },
      paymentMethod: 'online',
      paymentStatus: 'completed',
      bookingStatus: 'confirmed',
      transactionId: razorpay_payment_id,
    });

    await booking.save();
    
    // ── 8. Send confirmation emails (non-blocking) ───────────────────────────
    const orderDetails = {
      orderId: firstOrderId,
      customerName: shippingAddress.name,
      customerEmail,
      phone: shippingAddress.phone,
      address: `${shippingAddress.street}, ${shippingAddress.city}, ${shippingAddress.state} – ${shippingAddress.postalCode}`,
      total: totalAmount,
      paymentId: razorpay_payment_id,
      items: items.map(i => ({
        name: i.productName,
        quantity: i.quantity,
        price: i.price,
      })),
      createdAt: new Date(),
    };

    const adminEmail = process.env.ADMIN_EMAIL || process.env.MAIL_USER;

    Promise.all([
      customerEmail
        ? emailService.sendOnlinePaymentConfirmation(customerEmail, shippingAddress.name, orderDetails)
            .catch(e => console.error('⚠️  Customer email failed:', e))
        : Promise.resolve(),
      adminEmail
        ? emailService.sendOnlinePaymentNotificationToAdmin(adminEmail, orderDetails)
            .catch(e => console.error('⚠️  Admin email failed:', e))
        : Promise.resolve(),
    ]);

    return res.status(200).json({
      success: true,
      message: 'Payment verified and order placed successfully!',
      data: {
        orderId: firstOrderId,
        bookingId: firstOrderId,
        transactionId: razorpay_payment_id,
        totalAmount,
        status: 'confirmed',
        itemCount: items.length,
      },
    });
  } catch (err: any) {
    console.error('❌ verifyAndBook error:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Payment verification failed',
    });
  }
}

/**
 * POST /api/payment/place-cod-order
 *
 * COD flow – server recalculates prices from DB before saving.
 */
async function placeCODOrder(req: any, res: any) {
  try {
    const userId = req.userId;
    const { cartItems, shippingAddress } = req.body as {
      cartItems: CartItemInput[];
      shippingAddress: VerifyPaymentBody['shippingAddress'];
    };

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    if (!shippingAddress?.name || !shippingAddress?.email || !shippingAddress?.phone ||
        !shippingAddress?.street || !shippingAddress?.city || !shippingAddress?.state ||
        !shippingAddress?.postalCode) {
      return res.status(400).json({ success: false, message: 'Incomplete shipping address' });
    }

    // Server-side price verification
    const { items, totalAmount } = await verifyAndPriceItems(cartItems);

    const firstOrderId = await generateOrderId();

    const booking = new Booking({
      userId,
      orderId: firstOrderId,
      items,
      totalAmount,
      discountAmount: 0,
      finalAmount: totalAmount,
      deliveryAddress: {
        name: shippingAddress.name,
        email: shippingAddress.email,
        phone: shippingAddress.phone,
        street: shippingAddress.street,
        city: shippingAddress.city,
        state: shippingAddress.state,
        postalCode: shippingAddress.postalCode,
        country: shippingAddress.country || 'India',
      },
      paymentMethod: 'cod',
      paymentStatus: 'pending',
      bookingStatus: 'pending',
    });

    await booking.save();
    
    const user = await User.findById(userId);
    const customerEmail = user?.email || shippingAddress.email;
    const adminEmail = process.env.ADMIN_EMAIL || process.env.MAIL_USER;

    const orderDetails = {
      orderId: firstOrderId,
      customerName: shippingAddress.name,
      customerEmail,
      phone: shippingAddress.phone,
      address: `${shippingAddress.street}, ${shippingAddress.city}, ${shippingAddress.state} – ${shippingAddress.postalCode}`,
      total: totalAmount,
      items: items.map(i => ({
        name: i.productName,
        quantity: i.quantity,
        price: i.price,
      })),
      createdAt: new Date(),
    };

    Promise.all([
      customerEmail
        ? emailService.sendCODOrderConfirmation(customerEmail, shippingAddress.name, orderDetails)
            .catch(e => console.error('⚠️  Customer email failed:', e))
        : Promise.resolve(),
      adminEmail
        ? emailService.sendCODOrderNotificationToAdmin(adminEmail, orderDetails)
            .catch(e => console.error('⚠️  Admin email failed:', e))
        : Promise.resolve(),
    ]);

    return res.status(200).json({
      success: true,
      message: 'COD order placed successfully!',
      data: {
        orderId: firstOrderId,
        bookingId: firstOrderId,
        totalAmount,
        status: 'pending',
        itemCount: items.length,
      },
    });
  } catch (err: any) {
    console.error('❌ placeCODOrder error:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to place COD order',
    });
  }
}

/**
 * GET /api/payment/status/:paymentId
 */
async function getPaymentStatus(req: any, res: any) {
  try {
    const { paymentId } = req.params;
    const payment = await gateway.getInstance().payments.fetch(paymentId);
    return res.status(200).json({ success: true, data: payment });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

/**
 * POST /api/payment/refund  (admin only)
 */
async function refundPayment(req: any, res: any) {
  try {
    const { paymentId, amount } = req.body;
    if (!paymentId) {
      return res.status(400).json({ success: false, message: 'paymentId is required' });
    }
    const refund = await gateway.getInstance().payments.refund(paymentId, {
      amount: amount ? Math.round(amount * 100) : undefined,
    });
    return res.status(200).json({
      success: true,
      data: {
        refundId: refund.id,
        status: refund.status,
        amount: (refund.amount || 0) / 100,
      },
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

// ─────────────────────────────────────────────
// Export handlers (bound-safe)
// ─────────────────────────────────────────────
export {
  createRazorpayOrder,
  verifyAndBook,
  placeCODOrder,
  getPaymentStatus,
  refundPayment,
};
