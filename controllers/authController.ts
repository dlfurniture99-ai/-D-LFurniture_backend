import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User';
import DeliveryBoy from '../models/DeliveryBoy';
import emailService from '../services/emailService';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const authController = {
  /**
   * Register a new user
   */
  async register(req: Request, res: Response): Promise<void> {
    try {
      const { name, email, password, phone, address } = req.body;

      // Validation
      if (!name || !email || !password || !phone) {
        res.status(400).json({ success: false, message: 'Missing required fields' });
        return;
      }

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        res.status(400).json({ success: false, message: 'Email already registered' });
        return;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create new user
      const newUser = new User({
        name,
        email,
        password: hashedPassword,
        phone,
        address: address || ''
      });

      await newUser.save();

      // Generate JWT token
      const token = jwt.sign(
        { userId: newUser._id, role: newUser.role },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' }
      );

      // Send verification email (non-blocking)
      const verificationToken = jwt.sign(
        { userId: newUser._id },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );

      // Send email asynchronously without blocking registration
      emailService.sendVerificationEmail(email, verificationToken).catch(err => {
        console.error('Failed to send verification email:', err?.message || err);
        // Don't fail registration if email fails
      });

      // Set HTTP-only cookie with JWT token (Production-ready)
      res.cookie('authToken', token, {
        httpOnly: true,
        secure: true, // Always use HTTPS in production (Vercel enforces this)
        sameSite: 'none', // Required for cross-domain cookies
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        domain: process.env.COOKIE_DOMAIN || undefined
      });

      res.status(201).json({
        success: true,
        message: 'User registered successfully. Check email for verification.',
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ success: false, message: 'Registration failed' });
    }
  },

  /**
   * Login with email and password
   */
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      // Validation
      if (!email || !password) {
        res.status(400).json({ success: false, message: 'Email and password required' });
        return;
      }

      // Find user and select password field
      const user = await User.findOne({ email }).select('+password');
      if (!user) {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
        return;
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
        return;
      }

      // Check if customer email is verified (optional verification check)
      // if (user.role === 'customer' && !user.isVerified) {
      //   res.status(403).json({
      //     success: false,
      //     message: 'Your email has not been verified yet. Please check your email for the verification OTP.',
      //     needsEmailVerification: true
      //   });
      //   return;
      // }

      // Generate JWT token
      const token = jwt.sign(
        { userId: user._id, role: user.role },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' }
      );

      // Set HTTP-only cookie with JWT token (Production-ready)
      res.cookie('authToken', token, {
        httpOnly: true,
        secure: true, // Always use HTTPS in production (Vercel enforces this)
        sameSite: 'none', // Required for cross-domain cookies
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        domain: process.env.COOKIE_DOMAIN || undefined
      });

      res.status(200).json({
        success: true,
        message: 'Login successful',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ success: false, message: 'Login failed' });
    }
  },

  /**
   * Google OAuth login/register
   */
  async googleAuth(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.body;

      // Validate token
      if (!token) {
        res.status(400).json({ success: false, message: 'Token required' });
        return;
      }

      // Check if Google Client ID is configured
      if (!process.env.GOOGLE_CLIENT_ID) {
        console.error('GOOGLE_CLIENT_ID is not set');
        res.status(500).json({ success: false, message: 'Server configuration error' });
        return;
      }

      // Verify Google token
      const ticket = await googleClient.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      if (!payload) {
        res.status(401).json({ success: false, message: 'Invalid token' });
        return;
      }

      const { email, name } = payload;

      if (!email) {
        res.status(401).json({ success: false, message: 'Email not found in token' });
        return;
      }

      // Check if user exists
      let user = await User.findOne({ email });

      if (!user) {
        // Create new user if doesn't exist
        const randomPassword = await bcrypt.hash(payload.sub || 'google-user', 10);
        user = new User({
          name: name || email.split('@')[0],
          email,
          password: randomPassword,
          phone: '',
          address: '',
          googleId: payload.sub,
          isVerified: true,
        });
        await user.save();
      } else if (!user.googleId) {
        // Link Google account to existing user
        user.googleId = payload.sub;
        user.isVerified = true;
        await user.save();
      }

      // Generate JWT token
      const jwtToken = jwt.sign(
        { userId: user._id, role: user.role },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' }
      );

      // Set HTTP-only cookie with JWT token
      res.cookie('authToken', jwtToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      res.status(200).json({
        success: true,
        message: 'Google login successful',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    } catch (error: any) {
      console.error('Google login error:', error?.message || error);
      res.status(500).json({ success: false, message: error?.message || 'Google login failed' });
    }
  },

  /**
   * Get current authenticated user
   */
  async getMe(req: any, res: Response): Promise<void> {
    try {
      const user = await User.findById(req.userId).populate('bookings').populate('savedProducts');

      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      res.status(200).json({
        success: true,
        user
      });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch user' });
    }
  },

  /**
    * Verify email with token
    */
  async verifyEmail(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.body;

      if (!token) {
        res.status(400).json({ success: false, message: 'Verification token required' });
        return;
      }

      // Verify token
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      
      // Find user and mark as verified
      const user = await User.findById(decoded.userId);
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      user.isVerified = true;
      await user.save();

      res.status(200).json({
        success: true,
        message: 'Email verified successfully'
      });
    } catch (error: any) {
      console.error('Email verification error:', error);
      res.status(400).json({ success: false, message: 'Invalid or expired verification token' });
    }
  },

  /**
    * Logout user
    */
  async logout(req: Request, res: Response): Promise<void> {
    try {
      // Clear the authentication cookie (Production-ready)
      res.clearCookie('authToken', {
        httpOnly: true,
        secure: true, // Always use HTTPS in production (Vercel enforces this)
        sameSite: 'none', // Must match the cookie settings
        domain: process.env.COOKIE_DOMAIN || undefined
      });

      res.status(200).json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ success: false, message: 'Logout failed' });
    }
  },



  /**
   * Delivery Boy: Request OTP for Login
   */
  async deliveryBoyRequestOtp(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;

      // Validation
      if (!email) {
        res.status(400).json({ success: false, message: 'Email is required' });
        return;
      }

      // Find delivery boy
      const deliveryBoy = await DeliveryBoy.findOne({ email });
      
      if (!deliveryBoy) {
        res.status(404).json({ success: false, message: 'Delivery boy not found' });
        return;
      }

      if (!deliveryBoy.isActive) {
        res.status(403).json({
          success: false,
          message: 'Your account has been suspended. Contact admin.'
        });
        return;
      }

      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      deliveryBoy.loginOtp = otp;
      deliveryBoy.loginOtpExpires = otpExpiry;
      await deliveryBoy.save();

      // Send OTP email
      try {
        await emailService.sendDeliveryBoyLoginOTP(email, otp);
        console.log(`✓ Login OTP sent to ${email}`);
      } catch (emailError) {
        console.error('Failed to send OTP email:', emailError);
      }

      res.status(200).json({
        success: true,
        message: 'OTP sent to your email'
      });
    } catch (error) {
      console.error('Delivery boy request OTP error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send OTP',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },

  /**
   * Delivery Boy: Verify OTP and Login
   */
  async deliveryBoyVerifyOtp(req: Request, res: Response): Promise<void> {
    try {
      const { email, otp } = req.body;

      // Validation
      if (!email || !otp) {
        res.status(400).json({ success: false, message: 'Email and OTP are required' });
        return;
      }

      // Find delivery boy with OTP fields
      const deliveryBoy = await DeliveryBoy.findOne({ email }).select('+loginOtp +loginOtpExpires');
      
      if (!deliveryBoy) {
        res.status(404).json({ success: false, message: 'Delivery boy not found' });
        return;
      }

      if (!deliveryBoy.isActive) {
        res.status(403).json({
          success: false,
          message: 'Your account has been suspended. Contact admin.'
        });
        return;
      }

      // Check if OTP exists
      if (!deliveryBoy.loginOtp) {
        res.status(400).json({ success: false, message: 'No OTP found. Request a new one.' });
        return;
      }

      // Check OTP expiry
      if (!deliveryBoy.loginOtpExpires || new Date() > deliveryBoy.loginOtpExpires) {
        res.status(400).json({ success: false, message: 'OTP has expired. Request a new one.' });
        return;
      }

      // Verify OTP
      if (deliveryBoy.loginOtp !== otp) {
        res.status(400).json({ success: false, message: 'Invalid OTP' });
        return;
      }

      // Clear OTP after successful verification
      deliveryBoy.loginOtp = null;
      deliveryBoy.loginOtpExpires = null;
      await deliveryBoy.save();

      // Generate JWT token
      const token = jwt.sign(
        { userId: deliveryBoy._id, role: deliveryBoy.role },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' }
      );

      // Set HTTP-only cookie
      res.cookie('authToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      res.status(200).json({
        success: true,
        message: 'Login successful',
        user: {
          _id: deliveryBoy._id,
          name: deliveryBoy.name,
          email: deliveryBoy.email,
          phone: deliveryBoy.phone,
          role: deliveryBoy.role
        },
        token
      });
    } catch (error) {
      console.error('Delivery boy verify OTP error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to verify OTP',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },



  /**
   * Register a new delivery boy (Admin only)
   */
  async registerDeliveryBoy(req: Request, res: Response): Promise<void> {
    try {
      const { name, email, phone } = req.body;

      // Validation
      if (!name || !email || !phone) {
        res.status(400).json({ success: false, message: 'Missing required fields' });
        return;
      }

      // Check if delivery boy already exists
      const existingDeliveryBoy = await DeliveryBoy.findOne({ email });
      if (existingDeliveryBoy) {
        res.status(400).json({ success: false, message: 'Email already registered' });
        return;
      }

      // Create new delivery boy
      const newDeliveryBoy = new DeliveryBoy({
        name,
        email,
        phone,
        address: ''
      });

      await newDeliveryBoy.save();

      res.status(201).json({
        success: true,
        message: 'Delivery boy registered successfully.',
        data: {
          id: newDeliveryBoy._id,
          name: newDeliveryBoy.name,
          email: newDeliveryBoy.email,
          phone: newDeliveryBoy.phone,
          role: newDeliveryBoy.role
        }
      });
    } catch (error) {
      console.error('Delivery boy registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to register delivery boy',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  };
