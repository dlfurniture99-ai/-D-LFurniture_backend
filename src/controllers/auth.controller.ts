import { Response } from 'express';
import User from '../models/User.model';
import { generateToken } from '../utils/jwt';
import { sendSuccess, sendError } from '../utils/response';
import { AppError, asyncHandler } from '../middlewares/error.middleware';
import { HTTP_STATUS, ROLE } from '../utils/constants';
import { signupSchema, loginSchema } from '../validations/auth.validation';
import { AuthRequest } from '../middlewares/auth.middleware';

export const signup = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const body = signupSchema.parse(req.body);
    console.log('Signup body:', body);
    // Check if user exists
    const existingUser = await User.findOne({ email: body.email });
    if (existingUser) {
      throw new AppError('User already exists', HTTP_STATUS.CONFLICT);
    }

    // Create user
    const user = new User({
      email: body.email,
      password: body.password,
      firstName: body.firstName,
      lastName: body.lastName,
      role: ROLE.BUYER,
    });

    await user.save();

    // Generate token
    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    res.status(HTTP_STATUS.CREATED).json(
      sendSuccess('User registered successfully', { token, user })
    );
  }
);

// Admin signup endpoint
export const adminSignup = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { email, password, firstName, lastName, adminSecret } = req.body;

    // Validate admin secret key
    const ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY || 'admin-secret-key-change-in-production';
    if (!adminSecret || adminSecret !== ADMIN_SECRET_KEY) {
      throw new AppError('Invalid admin secret key', HTTP_STATUS.UNAUTHORIZED);
    }

    // Validate required fields
    if (!email || !password || !firstName || !lastName) {
      throw new AppError('Email, password, firstName, and lastName are required', HTTP_STATUS.BAD_REQUEST);
    }

    // Check if admin exists
    const existingAdmin = await User.findOne({ email });
    if (existingAdmin) {
      throw new AppError('Admin already exists', HTTP_STATUS.CONFLICT);
    }

    // Create admin user
    const admin = new User({
      email,
      password,
      firstName,
      lastName,
      role: ROLE.ADMIN,
    });

    await admin.save();

    // Generate token
    const token = generateToken({
      userId: admin._id.toString(),
      email: admin.email,
      role: admin.role,
    });

    res.status(HTTP_STATUS.CREATED).json(
      sendSuccess('Admin registered successfully', { token, user: admin })
    );
  }
);

export const login = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const body = loginSchema.parse(req.body);

    // Find user
    const user = await User.findOne({ email: body.email });
    if (!user) {
      throw new AppError('Invalid credentials', HTTP_STATUS.UNAUTHORIZED);
    }

    // Check password
    const isPasswordValid = await user.comparePassword(body.password);
    if (!isPasswordValid) {
      throw new AppError('Invalid credentials', HTTP_STATUS.UNAUTHORIZED);
    }

    // Generate token
    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    res.status(HTTP_STATUS.OK).json(
      sendSuccess('Login successful', { token, user })
    );
  }
);

// Admin login endpoint
export const adminLogin = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const body = loginSchema.parse(req.body);

    // Find user
    const user = await User.findOne({ email: body.email });
    if (!user) {
      throw new AppError('Invalid credentials', HTTP_STATUS.UNAUTHORIZED);
    }

    // Check if user is admin
    if (user.role !== ROLE.ADMIN) {
      throw new AppError('Access denied. Admin privileges required', HTTP_STATUS.FORBIDDEN);
    }

    // Check password
    const isPasswordValid = await user.comparePassword(body.password);
    if (!isPasswordValid) {
      throw new AppError('Invalid credentials', HTTP_STATUS.UNAUTHORIZED);
    }

    // Generate token
    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    res.status(HTTP_STATUS.OK).json(
      sendSuccess('Admin login successful', { token, user })
    );
  }
);

export const getCurrentUser = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const user = await User.findById(req.user?.userId);
    if (!user) {
      throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
    }

    res.status(HTTP_STATUS.OK).json(sendSuccess('User fetched', user));
  }
);
