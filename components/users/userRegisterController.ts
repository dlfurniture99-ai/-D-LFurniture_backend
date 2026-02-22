import customerdb from '../../models/customerModel';
import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

/**
 * User Registration Controller
 * Handles user registration with validation, password hashing, and JWT token generation
 */

interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  address?: string;
}

export const userRegisterController = async (req: Request, res: Response): Promise<any> => {
  try {
    const { name, email, password, confirmPassword, phone, address }: RegisterRequest = req.body;

    // ============================================================
    // VALIDATION
    // ============================================================

    // Check if all required fields are provided
    if (!name || !email || !password || !confirmPassword || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, email, password, confirmPassword, phone',
      });
    }

    // Validate name
    if (name.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Name must be at least 3 characters long',
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address',
      });
    }

    // Validate phone
    if (phone.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Phone number must be at least 10 digits',
      });
    }

    // Validate password strength
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
      });
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match',
      });
    }

    // ============================================================
    // CHECK IF USER ALREADY EXISTS
    // ============================================================

    const existingUser = await customerdb.findOne({
      $or: [
        { customerEmail: email },
        { customerPhone: phone }
      ]
    });

    if (existingUser) {
      if (existingUser.customerEmail === email) {
        return res.status(409).json({
          success: false,
          message: 'Email already registered. Please login or use a different email',
        });
      }
      if (existingUser.customerPhone === phone) {
        return res.status(409).json({
          success: false,
          message: 'Phone number already registered',
        });
      }
    }

    // ============================================================
    // HASH PASSWORD
    // ============================================================

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // ============================================================
    // CREATE NEW USER
    // ============================================================

    const newCustomer = new customerdb({
      customerName: name.trim(),
      customerEmail: email.toLowerCase(),
      customerPassword: hashedPassword,
      customerPhone: phone.trim(),
      customerAddress: address?.trim() || '',
      createdAt: new Date(),
    });

    const savedCustomer = await newCustomer.save();

    // ============================================================
    // GENERATE JWT TOKEN
    // ============================================================

    const token = jwt.sign(
      {
        id: savedCustomer._id,
        email: savedCustomer.customerEmail,
        name: savedCustomer.customerName,
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    // ============================================================
    // PREPARE RESPONSE
    // ============================================================

    const userResponse = {
      id: savedCustomer._id,
      name: savedCustomer.customerName,
      email: savedCustomer.customerEmail,
      phone: savedCustomer.customerPhone,
      address: savedCustomer.customerAddress,
      createdAt: savedCustomer.createdAt,
    };

    res.status(201).json({
      success: true,
      message: 'Registration successful! Welcome to D&L Furnitech',
      data: {
        user: userResponse,
        token: token,
      },
    });

  } catch (error: any) {
    console.error('Registration Error:', error);

    // Handle specific MongoDB errors
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Email or phone already exists',
      });
    }

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error: ' + error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error during registration. Please try again later',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Optional: Email verification (requires nodemailer setup)
 */
export const verifyEmailController = async (req: Request, res: Response): Promise<any> => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Verification token required',
      });
    }

    const decoded: any = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your-secret-key'
    );

    const customer = await customerdb.findByIdAndUpdate(
      decoded.id,
      { isEmailVerified: true },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Email verified successfully',
      data: customer,
    });

  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: 'Invalid or expired verification token',
      error: error.message,
    });
  }
};
