import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import Admin from '../models/Admin';
import emailService from '../services/emailService';

/**
 * Generate a 6-digit OTP
 */
const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const adminAuthController = {
  /**
   * Request admin login via OTP
   * Admin email must be in ADMIN_EMAIL env variable
   */
  async requestOTP(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;

      if (!email) {
        res.status(400).json({ success: false, message: 'Email required' });
        return;
      }

      // Check if email matches admin email in .env
      const adminEmail = process.env.ADMIN_EMAIL;
      if (!adminEmail) {
        console.error('ADMIN_EMAIL not set in .env');
        res.status(500).json({ success: false, message: 'Server configuration error' });
        return;
      }

      if (email.toLowerCase() !== adminEmail.toLowerCase()) {
        res.status(403).json({ success: false, message: 'Not authorized as admin' });
        return;
      }

      // Find or create admin user
       let admin = await Admin.findOne({ email: adminEmail });

       if (!admin) {
         admin = new Admin({
           name: 'Admin',
           email: adminEmail,
           password: 'passwordless-admin',
           role: 'admin',
           isVerified: true
         });
       } else {
         // Ensure admin user always has admin role
         admin.role = 'admin';
         admin.isVerified = true;
       }

      // Generate OTP
      const otp = generateOTP();
      const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Save OTP to admin
      admin.otp = otp;
      admin.otpExpires = otpExpires;
      await admin.save();

      // Send OTP via email
      try {
        await emailService.sendOTP(adminEmail, otp);
        res.status(200).json({
          success: true,
          message: 'OTP sent to admin email'
        });
      } catch (emailError) {
        console.error('Failed to send OTP email:', emailError);
        res.status(500).json({ success: false, message: 'Failed to send OTP' });
      }
    } catch (error) {
      console.error('Request OTP error:', error);
      res.status(500).json({ success: false, message: 'Failed to request OTP' });
    }
  },

  /**
   * Verify OTP and login
   */
  async verifyOTP(req: Request, res: Response): Promise<void> {
    try {
      const { email, otp } = req.body;

      if (!email || !otp) {
        res.status(400).json({ success: false, message: 'Email and OTP required' });
        return;
      }

      // Check admin email
      const adminEmail = process.env.ADMIN_EMAIL;
      if (email.toLowerCase() !== adminEmail?.toLowerCase()) {
        res.status(403).json({ success: false, message: 'Not authorized as admin' });
        return;
      }

      // Find admin
      const admin = await Admin.findOne({ email: adminEmail }).select('+otp +otpExpires');
      if (!admin) {
        res.status(401).json({ success: false, message: 'Admin user not found' });
        return;
      }

      // Verify OTP
      if (!admin.otp || admin.otp !== otp) {
        res.status(401).json({ success: false, message: 'Invalid OTP' });
        return;
      }

      // Check OTP expiration
      if (!admin.otpExpires || new Date() > admin.otpExpires) {
        res.status(401).json({ success: false, message: 'OTP expired' });
        return;
      }

      // Clear OTP and ensure admin role
      admin.otp = null;
      admin.otpExpires = null;
      admin.role = 'admin';
      admin.isVerified = true;
      await admin.save();

      // Generate JWT token
      const token = jwt.sign(
        { userId: admin._id, role: admin.role },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' }
      );

      // Set HTTP-only cookie with JWT token
      res.cookie('authToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      res.status(200).json({
        success: true,
        message: 'Admin login successful',
        user: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          role: admin.role
        }
      });
    } catch (error) {
      console.error('Verify OTP error:', error);
      res.status(500).json({ success: false, message: 'OTP verification failed' });
    }
  }
};
