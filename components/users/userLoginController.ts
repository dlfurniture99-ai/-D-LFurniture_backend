import customerdb from '../../models/customerModel';
import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

/**
 * User Login Controller
 * Handles user authentication with email/password
 */

interface LoginRequest {
  email: string;
  password: string;
}

export const userLoginController = async (req: Request, res: Response): Promise<any> => {
  try {
    const { email, password }: LoginRequest = req.body;

    // ============================================================
    // VALIDATION
    // ============================================================

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
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

    // ============================================================
    // CHECK IF USER EXISTS
    // ============================================================

    const customer = await customerdb.findOne({
      customerEmail: email.toLowerCase(),
    });

    if (!customer) {
      return res.status(401).json({
        success: false,
        message: 'User Not Found!',
      });
    }

    // ============================================================
    // VERIFY PASSWORD
    // ============================================================

    const isPasswordValid = await bcrypt.compare(password, customer.customerPassword);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // ============================================================
    // GENERATE JWT TOKEN
    // ============================================================

    const token = jwt.sign(
      {
        id: customer._id,
        email: customer.customerEmail,
        name: customer.customerName,
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    // ============================================================
    // PREPARE RESPONSE
    // ============================================================

    const userResponse = {
      id: customer._id,
      name: customer.customerName,
      email: customer.customerEmail,
      phone: customer.customerPhone,
      address: customer.customerAddress,
      profileImage: customer.profileImage,
      isEmailVerified: customer.isEmailVerified,
    };

    res.status(200).json({
      success: true,
      message: 'Login successful! Welcome to D&L Furnitech',
      data: {
        user: userResponse,
        token: token,
      },
    });

  } catch (error: any) {
    console.error('Login Error:', error);

    res.status(500).json({
      success: false,
      message: 'Server error during login. Please try again later',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Get Current User (Protected Route)
 */
export const getCurrentUserController = async (req: Request, res: Response): Promise<any> => {
  try {
    const customerId = (req as any).customerId;

    if (!customerId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized. Please login first',
      });
    }

    const customer = await customerdb.findById(customerId).select('-customerPassword');

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'User fetched successfully',
      data: customer,
    });

  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * Logout Controller (Frontend handles token removal)
 */
export const userLogoutController = async (req: Request, res: Response): Promise<any> => {
  try {
    // Token is typically removed from localStorage on frontend
    // This is just for confirmation response
    
    res.status(200).json({
      success: true,
      message: 'Logout successful',
    });

  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Server error during logout',
      error: error.message,
    });
  }
};
