import Razorpay from 'razorpay';
import crypto from 'crypto';
import { config } from 'dotenv';
import Booking from '../models/Booking';
import Product from '../models/Product';
import User from '../models/User';
import emailService from '../services/emailService';

// Load environment variables FIRST
config();

interface PaymentOrder {
  orderId: string;
  amount: number;
  currency: string;
}

interface VerifyPaymentParams {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

class PaymentService {
  private razorpay: Razorpay | null = null;
  private keyId: string;
  private keySecret: string;

  constructor() {
    console.log('🚀 PaymentService instantiated...');
    
    // Get credentials from environment
    this.keyId = process.env.RAZORPAY_KEY_ID || '';
    this.keySecret = process.env.RAZORPAY_KEY_SECRET || '';

    console.log('🔍 Debug - Checking Razorpay credentials:');
    console.log('RAZORPAY_KEY_ID exists:', !!this.keyId);
    console.log('RAZORPAY_KEY_SECRET exists:', !!this.keySecret);

    if (!this.keyId || !this.keySecret) {
      console.warn('⚠️  WARNING: Razorpay credentials not found in environment variables');
      console.warn('Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your .env file');
      return; // Don't throw, allow service to load
    }

    // Initialize Razorpay
    try {
      console.log('✓ Razorpay credentials found');
      console.log('Key ID preview:', this.keyId.substring(0, 10) + '...');
      
      this.razorpay = new Razorpay({
        key_id: this.keyId,
        key_secret: this.keySecret
      });
      
      console.log('✓ Razorpay instance created successfully');
    } catch (error: any) {
      console.error('❌ Failed to initialize Razorpay:', error.message);
      console.warn('⚠️  Continuing without Razorpay - payment operations will fail');
    }
  }

  /**
   * Get Razorpay instance (lazy initialization if needed)
   */
  private getRazorpayInstance(): Razorpay {
    if (!this.razorpay) {
      throw new Error('Razorpay not initialized. Check your credentials.');
    }
    return this.razorpay;
  }

  /**
   * Create a payment order
   */
  async createOrder(amount: number, receipt: string): Promise<PaymentOrder> {
    try {
      console.log(`📝 Creating Razorpay order for booking: ${receipt} amount: ${amount}`);
      
      const options = {
        amount: amount * 100, // Convert to paise
        currency: 'INR',
        receipt,
        payment_capture: 1
      };

      console.log('📤 Sending to Razorpay:', options);

      const instance = this.getRazorpayInstance();
      const order = await instance.orders.create(options);

      console.log('✓ Order created:', order.id);

      return {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency
      };
    } catch (error: any) {
      console.error('❌ Razorpay order creation failed:', error);
      
      // Provide specific error messages
      if (error.statusCode === 401) {
        console.error('⚠️  Authentication failed - Check your Razorpay API keys');
        throw new Error('Invalid Razorpay credentials');
      }
      
      throw new Error(error.error?.description || error.message || 'Failed to create order');
    }
  }

  /**
   * Verify payment signature
   */
  verifyPayment(params: VerifyPaymentParams): boolean {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = params;

      console.log('🔐 Verifying payment signature...');

      // Create signature
      const text = `${razorpay_order_id}|${razorpay_payment_id}`;
      const generated_signature = crypto
        .createHmac('sha256', this.keySecret)
        .update(text)
        .digest('hex');

      const isValid = generated_signature === razorpay_signature;
      
      if (isValid) {
        console.log('✓ Payment signature verified successfully');
      } else {
        console.error('❌ Payment signature verification failed');
      }

      return isValid;
    } catch (error) {
      console.error('❌ Payment verification error:', error);
      return false;
    }
  }

  /**
   * Get payment details
   */
  async getPaymentDetails(paymentId: string) {
    try {
      const instance = this.getRazorpayInstance();
      const payment = await instance.payments.fetch(paymentId);
      return payment;
    } catch (error: any) {
      console.error('❌ Failed to fetch payment details:', error);
      throw new Error(error.error?.description || 'Failed to fetch payment details');
    }
  }

  /**
   * Refund payment
   */
  async refundPayment(paymentId: string, amount: number) {
    try {
      console.log(`💰 Processing refund for payment: ${paymentId}, amount: ${amount}`);
      
      const instance = this.getRazorpayInstance();
      const refund = await instance.payments.refund(paymentId, {
        amount: amount * 100 // Convert to paise
      });

      console.log('✓ Refund processed:', refund.id);

      return {
        refundId: refund.id,
        status: refund.status,
        amount: refund.amount / 100
      };
    } catch (error: any) {
      console.error('❌ Refund failed:', error);
      throw new Error(error.error?.description || 'Failed to process refund');
    }
  }

  /**
   * Get Razorpay Key ID (for frontend)
   */
  getKeyId(): string {
    return this.keyId;
  }

  /**
   * Checkout: Create order (handler for Express)
   */
  async checkoutCreateOrder(req: any, res: any) {
    try {
      const { amount, receipt } = req.body;
      const order = await this.createOrder(amount, receipt);
      res.json({ success: true, data: order });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  /**
   * Checkout: Verify payment (handler for Express)
   */
  async checkoutVerifyPayment(req: any, res: any) {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
      const isValid = this.verifyPayment({ razorpay_order_id, razorpay_payment_id, razorpay_signature });
      res.json({ success: true, data: { verified: isValid } });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  /**
   * Booking: Create order wrapper
   */
  async createOrderHandler(req: any, res: any) {
    try {
      const { amount, receipt } = req.body;
      const order = await this.createOrder(amount, receipt);
      res.json({ success: true, data: order });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  /**
   * Booking: Verify payment wrapper
   */
  async verifyPaymentHandler(req: any, res: any) {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
      const isValid = this.verifyPayment({ razorpay_order_id, razorpay_payment_id, razorpay_signature });
      res.json({ success: true, data: { verified: isValid } });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  /**
   * Get payment status
   */
  async getStatus(req: any, res: any) {
    try {
      const { paymentId } = req.params;
      const payment = await this.getPaymentDetails(paymentId);
      res.json({ success: true, data: payment });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  /**
   * Refund payment
   */
  async refund(req: any, res: any) {
    try {
      const { paymentId, amount } = req.body;
      const result = await this.refundPayment(paymentId, amount);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  /**
   * Generate unique booking ID - Format: BK-XXXX (4 alphanumeric chars)
   */
  private async generateBookingId(): Promise<string> {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let id: string;
    let exists = true;
    
    while (exists) {
      id = 'BK-';
      for (let i = 0; i < 4; i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      
      const booking = await Booking.findOne({ bookingId: id });
      exists = booking !== null;
    }
    
    return id;
  }

  /**
   * Place Cash on Delivery Order
   */
  async placeCODOrder(req: any, res: any) {
    try {
      const { cartItems, shippingAddress, phone, firstName, lastName } = req.body;
      const userId = req.userId;

      console.log('📦 Processing COD Order:', {
        userId,
        itemCount: cartItems?.length || 0,
        total: cartItems?.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0) || 0
      });

      // Validate cart items
      if (!cartItems || cartItems.length === 0) {
        return res.status(400).json({ success: false, message: 'Cart is empty' });
      }

      // Calculate total
      const total = cartItems.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);

      // Create individual bookings for each item in cart
      const bookings: any[] = [];
      
      for (const item of cartItems) {
        try {
          const bookingId = await this.generateBookingId();
          const booking = new Booking({
            bookingId,
            userId,
            productId: item.productId,
            quantity: item.quantity,
            totalPrice: item.price * item.quantity,
            status: 'ready_for_delivery',
            paymentStatus: 'pending',
            paymentMethod: 'cod',
            shippingAddress: {
              street: shippingAddress || '',
              city: '',
              state: '',
              zipCode: '',
              country: 'India'
            }
          });

          const savedBooking = await booking.save();
          bookings.push(savedBooking);
          console.log('✓ Booking created:', savedBooking.bookingId);
        } catch (bookingError) {
          console.error('⚠️ Error creating booking for item:', item.productId, bookingError);
        }
      }

      // Get admin email from env
      const adminEmail = process.env.ADMIN_EMAIL || process.env.MAIL_USER;
      
      // Get customer email from database
      let customerEmail = '';
      try {
        const user = await User.findById(userId);
        customerEmail = user?.email || '';
      } catch (userError) {
        console.error('⚠️ Error fetching user email:', userError);
      }

      // Get first booking's ID as main order ID
      const mainBookingId = bookings[0]?.bookingId || `BK-ERROR`;

      // Prepare order details for email
      const orderDetails = {
        orderId: mainBookingId,
        customerName: `${firstName} ${lastName}`,
        customerEmail,
        phone,
        address: shippingAddress,
        total,
        items: cartItems,
        createdAt: new Date()
      };

      // Send confirmation email to customer
      if (customerEmail) {
        try {
          await emailService.sendCODOrderConfirmation(
            customerEmail,
            `${firstName} ${lastName}`,
            orderDetails
          );
          console.log('✓ Customer confirmation email sent to:', customerEmail);
        } catch (emailError) {
          console.error('⚠️  Failed to send customer email:', emailError);
        }
      }

      // Send notification email to admin
      if (adminEmail) {
        try {
          await emailService.sendCODOrderNotificationToAdmin(adminEmail, orderDetails);
          console.log('✓ Admin notification email sent to:', adminEmail);
        } catch (emailError) {
          console.error('⚠️  Failed to send admin email:', emailError);
        }
      }

      res.json({
        success: true,
        message: 'Order placed successfully!',
        data: {
          bookingId: mainBookingId,
          orderId: mainBookingId,
          total,
          status: 'pending',
          itemCount: cartItems.length
        }
      });

    } catch (error: any) {
      console.error('❌ COD Order Error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to place COD order'
      });
    }
  }
}

// Export a single instance
export default new PaymentService();
