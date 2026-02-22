import nodemailer from 'nodemailer';
import {config} from 'dotenv';
config();

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}


class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    const mailUser = process.env.MAIL_USER;
    const mailPass = process.env.MAIL_PASS;

    if (!mailPass) {
      console.warn('⚠️  WARNING: MAIL_PASS is not set in .env file. Email sending will fail.');
      console.warn('Please add: MAIL_PASS=your-16-character-app-password');
    }

    const port = parseInt(process.env.MAIL_PORT || '587');
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_SERVICE || 'smtp.gmail.com',
      port: port,
      secure: port === 465, // true for 465 (SSL), false for 587 (TLS)
      auth: {
        user: mailUser,
        pass: mailPass
      }
    });
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    // Skip email in development if credentials not configured
    if (!process.env.MAIL_PASS) {
      console.log(`[EMAIL MOCK] Would send email to: ${options.to}`);
      console.log(`[EMAIL MOCK] Subject: ${options.subject}`);
      return;
    }

    try {
      await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.MAIL_USER,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text
      });
    } catch (error) {
      console.error('Email sending failed:', error);
      throw error;
    }
  }

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #fbbf24 0%, #8b5cf6 100%); padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">Welcome to D&L Furnitech</h1>
        </div>
        <div style="padding: 30px; background-color: #f9f9f9;">
          <p>Hello,</p>
          <p>Thank you for registering with D&L Furnitech. Please verify your email to activate your account.</p>
          <a href="${verificationUrl}" style="display: inline-block; background-color: #fbbf24; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold;">
            Verify Email
          </a>
          <p>Or copy this link: ${verificationUrl}</p>
          <p style="color: #666; font-size: 12px; margin-top: 30px;">This link expires in 24 hours.</p>
        </div>
      </div>
    `;

    await this.sendEmail({
      to: email,
      subject: 'Verify Your Email - D&L Furnitech',
      html
    });
  }

  async sendBookingConfirmation(email: string, bookingDetails: any): Promise<void> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #fbbf24 0%, #8b5cf6 100%); padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">Booking Confirmed</h1>
        </div>
        <div style="padding: 30px; background-color: #f9f9f9;">
          <p>Hello ${bookingDetails.customerName},</p>
          <p>Your booking has been confirmed. Here are your details:</p>
          
          <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3>Booking Details</h3>
            <p><strong>Booking ID:</strong> ${bookingDetails.bookingId}</p>
            <p><strong>Product:</strong> ${bookingDetails.productName}</p>
            <p><strong>Quantity:</strong> ${bookingDetails.quantity}</p>
            <p><strong>Total Price:</strong> ₹${bookingDetails.totalPrice}</p>
            <p><strong>Status:</strong> ${bookingDetails.status}</p>
          </div>

          <p>We'll keep you updated on your order status via email.</p>
        </div>
      </div>
    `;

    await this.sendEmail({
      to: email,
      subject: `Booking Confirmed - ${bookingDetails.bookingId}`,
      html
    });
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #fbbf24 0%, #8b5cf6 100%); padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">Password Reset</h1>
        </div>
        <div style="padding: 30px; background-color: #f9f9f9;">
          <p>We received a request to reset your password.</p>
          <a href="${resetUrl}" style="display: inline-block; background-color: #fbbf24; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold;">
            Reset Password
          </a>
          <p>Or copy this link: ${resetUrl}</p>
          <p style="color: #666; font-size: 12px; margin-top: 30px;">This link expires in 1 hour.</p>
        </div>
      </div>
    `;

    await this.sendEmail({
      to: email,
      subject: 'Password Reset Request - D&L Furnitech',
      html
    });
  }

  async sendOrderStatusUpdate(email: string, bookingDetails: any): Promise<void> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #fbbf24 0%, #8b5cf6 100%); padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">Order Status Update</h1>
        </div>
        <div style="padding: 30px; background-color: #f9f9f9;">
          <p>Hello ${bookingDetails.customerName},</p>
          <p>Your order status has been updated.</p>
          
          <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Booking ID:</strong> ${bookingDetails.bookingId}</p>
            <p><strong>New Status:</strong> <span style="color: #fbbf24; font-weight: bold;">${bookingDetails.status}</span></p>
            ${bookingDetails.trackingNumber ? `<p><strong>Tracking Number:</strong> ${bookingDetails.trackingNumber}</p>` : ''}
          </div>
        </div>
      </div>
    `;

    await this.sendEmail({
      to: email,
      subject: `Order Status Update - ${bookingDetails.bookingId}`,
      html
    });
  }

  async sendOTP(email: string, otp: string): Promise<void> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #fbbf24 0%, #8b5cf6 100%); padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">Admin Login OTP</h1>
        </div>
        <div style="padding: 30px; background-color: #f9f9f9;">
          <p>Hello Admin,</p>
          <p>Your One-Time Password (OTP) for admin login is:</p>
          
          <div style="background: white; padding: 30px; border-radius: 5px; margin: 20px 0; text-align: center;">
            <h2 style="color: #fbbf24; letter-spacing: 5px; font-size: 32px; margin: 0;">${otp}</h2>
          </div>
          
          <p style="color: #666; font-size: 14px;">This OTP is valid for 10 minutes. Do not share this with anyone.</p>
          <p style="color: #666; font-size: 12px; margin-top: 30px;">If you didn't request this, please ignore this email.</p>
        </div>
      </div>
    `;

    await this.sendEmail({
      to: email,
      subject: 'Admin Login OTP - D&L Furnitech',
      html
    });
  }

  async sendCODOrderConfirmation(email: string, customerName: string, orderDetails: any): Promise<void> {
    const bookingDate = new Date(orderDetails.createdAt || new Date());
    const dateStr = bookingDate.toLocaleDateString('en-IN', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    const timeStr = bookingDate.toLocaleTimeString('en-IN', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #fbbf24 0%, #8b5cf6 100%); padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">🎉 Cash on Delivery Order Confirmed</h1>
        </div>
        <div style="padding: 30px; background-color: #f9f9f9;">
          <p>Hello ${customerName},</p>
          <p>Your order has been placed successfully! You can pay with cash when the delivery happens.</p>
          
          <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #fbbf24;">
            <h3 style="color: #333; margin-top: 0;">📋 Order Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 10px 0;"><strong>Order ID:</strong></td>
                <td style="padding: 10px 0; text-align: right; color: #fbbf24; font-weight: bold; font-size: 16px;">${orderDetails.orderId}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 10px 0;"><strong>Booking Date:</strong></td>
                <td style="padding: 10px 0; text-align: right;">${dateStr}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 10px 0;"><strong>Booking Time:</strong></td>
                <td style="padding: 10px 0; text-align: right;">${timeStr}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 10px 0;"><strong>Total Amount:</strong></td>
                <td style="padding: 10px 0; text-align: right; color: #fbbf24; font-weight: bold; font-size: 18px;">₹${orderDetails.total.toLocaleString()}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 10px 0;"><strong>Payment Method:</strong></td>
                <td style="padding: 10px 0; text-align: right;"><span style="background-color: #dcfce7; color: #166534; padding: 4px 8px; border-radius: 4px; font-weight: bold;">COD</span></td>
              </tr>
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 10px 0;"><strong>Phone:</strong></td>
                <td style="padding: 10px 0; text-align: right;">${orderDetails.phone}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0;"><strong>Delivery Address:</strong></td>
                <td style="padding: 10px 0; text-align: right; max-width: 300px;">${orderDetails.address}</td>
              </tr>
            </table>
          </div>

          <div style="background: #fffbeb; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h4 style="margin-top: 0; color: #92400e;">📦 Delivery Instructions:</h4>
            <ul style="color: #78350f; margin: 10px 0; padding-left: 20px;">
              <li>Our team will contact you soon with delivery details</li>
              <li>You can pay with cash at the time of delivery</li>
              <li>Please ensure someone is available to receive the order</li>
              <li>Check the product condition before making payment</li>
            </ul>
          </div>

          <div style="background: white; padding: 15px; border-radius: 5px; margin: 20px 0; border: 1px solid #e5e7eb;">
            <h4 style="margin-top: 0; color: #333;">Items Ordered:</h4>
            ${orderDetails.items.map((item: any) => `
              <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                <span>${item.name} (x${item.quantity})</span>
                <span style="font-weight: bold;">₹${(item.price * item.quantity).toLocaleString()}</span>
              </div>
            `).join('')}
            <div style="display: flex; justify-content: space-between; padding: 8px 0; font-weight: bold; color: #fbbf24;">
              <span>Total:</span>
              <span>₹${orderDetails.total.toLocaleString()}</span>
            </div>
          </div>

          <p style="color: #666; font-size: 12px; margin-top: 30px;">If you have any questions, please contact our support team.</p>
        </div>
      </div>
    `;

    await this.sendEmail({
      to: email,
      subject: `Order Confirmed - Cash on Delivery - ${orderDetails.orderId}`,
      html
    });
  }

  async sendDeliveryBoyVerificationOTP(email: string, otp: string, deliveryBoyName: string): Promise<void> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #fbbf24 0%, #8b5cf6 100%); padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">🚚 Delivery Boy Registration</h1>
        </div>
        <div style="padding: 30px; background-color: #f9f9f9;">
          <p>Hello ${deliveryBoyName},</p>
          <p>Welcome to D&L Furnitech Delivery Network! Your account has been created by the admin.</p>
          
          <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #fbbf24;">
            <p><strong>Please verify your email to complete your registration.</strong></p>
            <p>Your Email Verification OTP is:</p>
            
            <div style="background: #fef3c7; padding: 20px; border-radius: 5px; margin: 20px 0; text-align: center;">
              <h2 style="color: #d97706; letter-spacing: 5px; font-size: 36px; margin: 0; font-family: monospace;">${otp}</h2>
            </div>

            <p style="color: #666; font-size: 14px;">
              <strong>Steps to activate your account:</strong>
            </p>
            <ol style="color: #666; font-size: 14px;">
              <li>Go to <a href="${process.env.FRONTEND_URL}/delivery-verify-email" style="color: #fbbf24; text-decoration: none;">Email Verification Page</a></li>
              <li>Enter your email address</li>
              <li>Enter the OTP: <strong>${otp}</strong></li>
              <li>Click verify</li>
              <li>You can then login with your credentials</li>
            </ol>
          </div>

          <div style="background: #eff6ff; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="color: #1e40af; margin: 10px 0;">
              <strong>Login Details:</strong>
            </p>
            <p style="color: #1e40af; margin: 5px 0;">Email: <strong>${email}</strong></p>
            <p style="color: #1e40af; margin: 5px 0;">Password: Check your registration confirmation</p>
          </div>

          <p style="color: #d97706; font-weight: bold; font-size: 14px;">
            ⏱️ This OTP is valid for 10 minutes only.
          </p>

          <p style="color: #666; font-size: 14px;">
            Once verified, you can login at: <a href="${process.env.FRONTEND_URL}/delivery-login" style="color: #fbbf24; text-decoration: none;">Delivery Portal</a>
          </p>

          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            If you didn't register for this account, please contact the admin immediately.
          </p>
        </div>
      </div>
    `;

    await this.sendEmail({
      to: email,
      subject: 'Verify Your Email - Delivery Boy Account - D&L Furnitech',
      html
    });
  }

  async sendDeliveryBoyLoginOTP(email: string, otp: string): Promise<void> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #fbbf24 0%, #8b5cf6 100%); padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">🚚 Delivery Boy Login OTP</h1>
        </div>
        <div style="padding: 30px; background-color: #f9f9f9;">
          <p>Hello Delivery Partner,</p>
          <p>Your One-Time Password (OTP) for login is:</p>
          
          <div style="background: #fef3c7; padding: 20px; border-radius: 5px; margin: 20px 0; text-align: center;">
            <h2 style="color: #d97706; letter-spacing: 5px; font-size: 36px; margin: 0; font-family: monospace;">${otp}</h2>
          </div>

          <p style="color: #666; font-size: 14px;">
            Enter this OTP on the Delivery Portal to login.
          </p>

          <p style="color: #d97706; font-weight: bold; font-size: 14px;">
            ⏱️ This OTP is valid for 10 minutes only.
          </p>

          <p style="color: #666; font-size: 14px;">
            <a href="${process.env.FRONTEND_URL}/delivery-login" style="color: #fbbf24; text-decoration: none;">Go to Delivery Portal</a>
          </p>

          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            If you didn't request this OTP, please ignore this email.
          </p>
        </div>
      </div>
    `;

    await this.sendEmail({
      to: email,
      subject: 'Delivery Boy Login OTP - D&L Furnitech',
      html
    });
  }

  async sendDeliveryOTP(customerEmail: string, otp: string, customerName: string): Promise<void> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #fbbf24 0%, #8b5cf6 100%); padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">🚚 Delivery OTP</h1>
        </div>
        <div style="padding: 30px; background-color: #f9f9f9;">
          <p>Hello ${customerName},</p>
          <p>Your delivery is on the way! Please provide this OTP to the delivery person to confirm the delivery.</p>
          
          <div style="background: #fef3c7; padding: 30px; border-radius: 5px; margin: 20px 0; text-align: center;">
            <h2 style="color: #d97706; letter-spacing: 5px; font-size: 48px; margin: 0; font-family: monospace;">${otp}</h2>
          </div>

          <p style="color: #666; font-size: 14px; text-align: center;">
            <strong>Share this 4-digit OTP with the delivery person</strong>
          </p>

          <div style="background: #eff6ff; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="color: #1e40af; margin: 10px 0;">
              <strong>Delivery Instructions:</strong>
            </p>
            <ul style="color: #1e40af; margin: 10px 0; padding-left: 20px;">
              <li>Verify the product before accepting</li>
              <li>Share this OTP with the delivery person</li>
              <li>Make payment if you selected Cash on Delivery</li>
              <li>Keep your receipt for reference</li>
            </ul>
          </div>

          <p style="color: #d97706; font-weight: bold; font-size: 14px;">
            ⏱️ This OTP is valid for 30 minutes only.
          </p>

          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            If you have any questions, please contact our support team.
          </p>
        </div>
      </div>
    `;

    await this.sendEmail({
      to: customerEmail,
      subject: 'Your Delivery OTP - D&L Furnitech',
      html
    });
  }

  async sendCODOrderNotificationToAdmin(adminEmail: string, orderDetails: any): Promise<void> {
    const bookingDate = new Date(orderDetails.createdAt || new Date());
    const dateStr = bookingDate.toLocaleDateString('en-IN', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    const timeStr = bookingDate.toLocaleTimeString('en-IN', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #fbbf24 0%, #8b5cf6 100%); padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">📨 New COD Order Received</h1>
        </div>
        <div style="padding: 30px; background-color: #f9f9f9;">
          <p>Hello Admin,</p>
          <p>A new Cash on Delivery order has been placed. Please review and process it.</p>
          
          <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #fbbf24;">
            <h3 style="color: #333; margin-top: 0;">📋 Order Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 10px 0;"><strong>Order ID:</strong></td>
                <td style="padding: 10px 0; text-align: right; color: #fbbf24; font-weight: bold; font-size: 16px;">${orderDetails.orderId}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 10px 0;"><strong>Booking Date:</strong></td>
                <td style="padding: 10px 0; text-align: right;">${dateStr}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 10px 0;"><strong>Booking Time:</strong></td>
                <td style="padding: 10px 0; text-align: right;">${timeStr}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 10px 0;"><strong>Total Amount:</strong></td>
                <td style="padding: 10px 0; text-align: right; color: #fbbf24; font-weight: bold; font-size: 18px;">₹${orderDetails.total.toLocaleString()}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 10px 0;"><strong>Payment Method:</strong></td>
                <td style="padding: 10px 0; text-align: right;"><span style="background-color: #dcfce7; color: #166534; padding: 4px 8px; border-radius: 4px; font-weight: bold;">COD</span></td>
              </tr>
            </table>
          </div>

          <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border: 1px solid #e5e7eb;">
            <h3 style="color: #333; margin-top: 0;">👤 Customer Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 10px 0;"><strong>Customer Name:</strong></td>
                <td style="padding: 10px 0; text-align: right;">${orderDetails.customerName}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 10px 0;"><strong>Email:</strong></td>
                <td style="padding: 10px 0; text-align: right;">${orderDetails.customerEmail}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 10px 0;"><strong>Phone:</strong></td>
                <td style="padding: 10px 0; text-align: right;">${orderDetails.phone}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0;"><strong>Delivery Address:</strong></td>
                <td style="padding: 10px 0; text-align: right;">${orderDetails.address}</td>
              </tr>
            </table>
          </div>

          <div style="background: white; padding: 15px; border-radius: 5px; margin: 20px 0; border: 1px solid #e5e7eb;">
            <h4 style="margin-top: 0; color: #333;">Items Ordered:</h4>
            ${orderDetails.items.map((item: any) => `
              <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                <div>
                  <div style="font-weight: bold;">${item.name}</div>
                  <div style="font-size: 12px; color: #666;">Qty: ${item.quantity}</div>
                </div>
                <span style="font-weight: bold;">₹${(item.price * item.quantity).toLocaleString()}</span>
              </div>
            `).join('')}
            <div style="display: flex; justify-content: space-between; padding: 8px 0; font-weight: bold; color: #fbbf24;">
              <span>Total:</span>
              <span>₹${orderDetails.total.toLocaleString()}</span>
            </div>
          </div>

          <div style="background: #fef3c7; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h4 style="margin-top: 0; color: #92400e;">⚠️ Action Required:</h4>
            <ul style="color: #78350f; margin: 10px 0; padding-left: 20px;">
              <li>Verify inventory and stock availability</li>
              <li>Confirm delivery address with customer if needed</li>
              <li>Arrange delivery and logistics</li>
              <li>Update customer with tracking details</li>
            </ul>
          </div>
        </div>
      </div>
    `;

    await this.sendEmail({
      to: adminEmail,
      subject: `New COD Order - ${orderDetails.orderId}`,
      html
    });
  }
}

export default new EmailService();
