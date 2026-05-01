import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import Admin from '../models/Admin';
import emailService from '../services/emailService';

const buildAuthCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: (isProduction ? 'none' : 'lax') as 'none' | 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    domain: isProduction ? process.env.COOKIE_DOMAIN || undefined : undefined,
  };
};

/**
 * Generate a 6-digit OTP
 */
const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const adminAuthController = {
  /**
   * Request admin login via OTP
   * Only emails with role: 'admin' in DB are allowed
   */
  async requestOTP(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;

      if (!email) {
        res.status(400).json({ success: false, message: 'Email required' });
        return;
      }

      // Find admin directly from DB by the entered email
      const admin = await Admin.findOne({
        email: email.toLowerCase(),
        role: 'admin'
      });

      if (!admin) {
        // Don't reveal whether email exists or not (security best practice)
        res.status(403).json({ success: false, message: 'Not authorized as admin' });
        return;
      }

      // Generate OTP
      const otp = generateOTP();
      const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Save OTP to admin
      admin.otp = otp;
      admin.otpExpires = otpExpires;
      admin.isVerified = true;
      await admin.save();

      // Send OTP to the email that exists in DB
      try {
        await emailService.sendOTP(admin.email, otp);
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

      // Find admin from DB by entered email
      const admin = await Admin.findOne({
        email: email.toLowerCase(),
        role: 'admin'
      }).select('+otp +otpExpires');

      if (!admin) {
        res.status(403).json({ success: false, message: 'Not authorized as admin' });
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

      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        throw new Error('JWT_SECRET is not configured');
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: admin._id, role: admin.role },
        jwtSecret,
        { expiresIn: '7d' }
      );

      // Set HTTP-only cookie with JWT token
      res.cookie('authToken', token, buildAuthCookieOptions());

      res.status(200).json({
        success: true,
        message: 'Admin login successful',
        user: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          role: admin.role
        },
        token
      });

    } catch (error) {
      console.error('Verify OTP error:', error);
      res.status(500).json({ success: false, message: 'OTP verification failed' });
    }
  }
};
