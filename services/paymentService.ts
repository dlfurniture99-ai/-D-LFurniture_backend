import crypto from 'crypto';

let Razorpay: any = null;
try {
  Razorpay = require('razorpay');
} catch (err) {
  console.warn('Razorpay not available');
}

interface RazorpayOrder {
  amount: number;
  currency: string;
  receipt: string;
  payment_capture: number;
}

interface PaymentVerification {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

class PaymentService {
  private razorpay: any = null;
  private initialized = false;

  private initializeRazorpay() {
    if (this.initialized) return;
    this.initialized = true;

    console.log('🔍 Debug - Checking Razorpay credentials:');
    console.log('RAZORPAY_KEY_ID exists:', !!process.env.RAZORPAY_KEY_ID);
    console.log('RAZORPAY_KEY_SECRET exists:', !!process.env.RAZORPAY_KEY_SECRET);

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.warn('⚠️  Razorpay credentials not configured. Payments disabled.');
      console.warn('Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env');
      return;
    }

    console.log('✓ Razorpay credentials found');
    console.log('Key ID preview:', process.env.RAZORPAY_KEY_ID?.substring(0, 10) + '...');

    if (!Razorpay) {
      throw new Error('Razorpay module not available');
    }

    try {
      this.razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET
      });
      console.log('✓ Razorpay instance created successfully');
    } catch (error) {
      console.error('✗ Failed to create Razorpay instance:', error);
      throw error;
    }
  }

  private checkCredentials() {
    this.initializeRazorpay();
    if (!this.razorpay) {
      throw new Error('Razorpay credentials not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env');
    }
  }

  async createOrder(amount: number, bookingId: string) {
    try {
      console.log('📝 Creating Razorpay order for booking:', bookingId, 'amount:', amount);
      this.checkCredentials();
      
      const options: RazorpayOrder = {
        amount: Math.round(amount * 100), // Convert to paise
        currency: 'INR',
        receipt: bookingId,
        payment_capture: 1 // Auto capture
      };

      console.log('📤 Sending to Razorpay:', options);
      const order = await this.razorpay.orders.create(options);
      console.log('✓ Order created:', order.id);
      
      return {
        success: true,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency
      };
    } catch (error) {
      console.error('✗ Error creating order:', error);
      console.error('Razorpay Order Creation Error:', error);
      throw error;
    }
  }

  verifyPayment(details: PaymentVerification): boolean {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = details;

      const secret = process.env.RAZORPAY_KEY_SECRET || '';
      const body = razorpay_order_id + '|' + razorpay_payment_id;

      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(body)
        .digest('hex');

      return expectedSignature === razorpay_signature;
    } catch (error) {
      console.error('Payment Verification Error:', error);
      return false;
    }
  }

  async getPaymentDetails(paymentId: string) {
    try {
      this.checkCredentials();
      const payment = await this.razorpay.payments.fetch(paymentId);
      return payment;
    } catch (error) {
      console.error('Fetch Payment Error:', error);
      throw error;
    }
  }

  async refundPayment(paymentId: string, amount?: number) {
    try {
      this.checkCredentials();
      
      const options: any = {};
      if (amount) {
        options.amount = Math.round(amount * 100); // Convert to paise
      }

      const refund = await this.razorpay.payments.refund(paymentId, options);
      return {
        success: true,
        refundId: refund.id,
        status: refund.status
      };
    } catch (error) {
      console.error('Refund Error:', error);
      throw error;
    }
  }
}

const paymentService = new PaymentService();
// Initialize Razorpay on service creation
console.log('🚀 PaymentService instantiated, initializing Razorpay...');
paymentService['initializeRazorpay']?.call(paymentService);

export default paymentService;
