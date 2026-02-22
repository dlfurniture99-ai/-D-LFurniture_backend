import { Request, Response } from 'express';
import Booking from '../models/Booking';
import Product from '../models/Product';
import User from '../models/User';
import emailService from '../services/emailService';

/**
 * Generate unique booking ID - Format: BK-XXXXX (6 alphanumeric chars)
 */
async function generateBookingId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id: string;
  let exists = true;
  
  // Keep generating until we find a unique ID
  while (exists) {
    id = 'BK-';
    for (let i = 0; i < 6; i++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    // Check if this ID already exists
    const booking = await Booking.findOne({ bookingId: id });
    exists = booking !== null;
  }
  
  return id!;
}

export const bookingController = {
  /**
   * Create a new booking
   */
  async create(req: any, res: Response): Promise<void> {
    try {
      const { productId, quantity, shippingAddress } = req.body;
      const userId = req.userId;

      // Find product
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }

      // Check stock availability
      if (product.stock < quantity) {
        return res.status(400).json({ success: false, message: 'Insufficient stock' });
      }

      // Calculate total price
      const totalPrice = product.price * quantity;
      const bookingId = await generateBookingId();

      // Create booking
       const booking = new Booking({
         bookingId,
         userId,
         productId,
         quantity,
         totalPrice,
         paymentMethod: 'card',
         shippingAddress
       });

      await booking.save();

      // Update product stock
      product.stock -= quantity;
      await product.save();

      // Add booking to user
      await User.findByIdAndUpdate(userId, {
        $push: { bookings: booking._id }
      });

      // Send confirmation email
      const user = await User.findById(userId);
      if (user) {
        await emailService.sendBookingConfirmation(user.email, {
          customerName: user.name,
          bookingId,
          productName: product.name,
          quantity,
          totalPrice,
          status: 'pending'
        });
      }

      res.status(201).json({
        success: true,
        message: 'Booking created successfully',
        booking
      });
    } catch (error) {
      console.error('Booking creation error:', error);
      res.status(500).json({ success: false, message: 'Failed to create booking' });
    }
  },

  /**
   * Get all user bookings
   */
  async getUserBookings(req: any, res: Response): Promise<void> {
    try {
      const bookings = await Booking.find({ userId: req.userId })
        .populate('productId')
        .sort({ createdAt: -1 });

      res.json({ success: true, bookings });
    } catch (error) {
      console.error('Get bookings error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch bookings' });
    }
  },

  /**
   * Get single booking details
   */
  async getById(req: any, res: Response): Promise<void> {
    try {
      const booking = await Booking.findById(req.params.id)
        .populate('productId')
        .populate('userId');

      if (!booking) {
        return res.status(404).json({ success: false, message: 'Booking not found' });
      }

      // Check authorization
      if (booking.userId._id.toString() !== req.userId && req.userRole !== 'admin') {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
      }

      res.json({ success: true, booking });
    } catch (error) {
      console.error('Get booking error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch booking' });
    }
  },

  /**
   * Get all bookings (admin only)
   */
  async getAllAdmin(req: Request, res: Response): Promise<void> {
    try {
      const { status, page = 1, limit = 10 } = req.query;
      const filter: any = {};

      if (status) filter.status = status;

      const skip = (Number(page) - 1) * Number(limit);

      const bookings = await Booking.find(filter)
        .populate('userId')
        .populate('productId')
        .skip(skip)
        .limit(Number(limit))
        .sort({ createdAt: -1 });

      const total = await Booking.countDocuments(filter);

      res.json({
        success: true,
        bookings,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      console.error('Get all bookings error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch bookings' });
    }
  },

  /**
   * Update booking status (admin only)
   */
  async updateStatus(req: any, res: Response): Promise<void> {
    try {
      const { status, paymentStatus } = req.body;
      const booking = await Booking.findByIdAndUpdate(
        req.params.id,
        { status, paymentStatus },
        { new: true }
      ).populate('userId').populate('productId');

      if (!booking) {
        return res.status(404).json({ success: false, message: 'Booking not found' });
      }

      // Send status update email
      const user = await User.findById(booking.userId);
      if (user) {
        await emailService.sendOrderStatusUpdate(user.email, {
          customerName: user.name,
          bookingId: booking.bookingId,
          status: status || booking.status
        });
      }

      res.json({ success: true, booking });
    } catch (error) {
      console.error('Update booking error:', error);
      res.status(500).json({ success: false, message: 'Failed to update booking' });
    }
  },

  /**
   * Cancel booking (admin only)
   */
  async cancel(req: Request, res: Response): Promise<void> {
    try {
      const booking = await Booking.findByIdAndUpdate(
        req.params.id,
        { status: 'cancelled' },
        { new: true }
      ).populate('productId');

      if (!booking) {
        return res.status(404).json({ success: false, message: 'Booking not found' });
      }

      // Refund stock
      const product = await Product.findById(booking.productId);
      if (product) {
        product.stock += booking.quantity;
        await product.save();
      }

      res.json({ success: true, message: 'Booking cancelled', booking });
    } catch (error) {
      console.error('Cancel booking error:', error);
      res.status(500).json({ success: false, message: 'Failed to cancel booking' });
    }
  },

  /**
   * Get booking by bookingId (for public/delivery boys)
   */
  async getByBookingId(req: Request, res: Response): Promise<void> {
    try {
      const { bookingId } = req.query;

      if (!bookingId) {
        return res.status(400).json({ success: false, message: 'Booking ID required' });
      }

      const booking = await Booking.findOne({ bookingId: bookingId })
        .populate('productId')
        .populate('userId');

      if (!booking) {
        return res.status(404).json({ success: false, message: 'Booking not found' });
      }

      res.json({ success: true, booking });
    } catch (error) {
      console.error('Get booking by ID error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch booking' });
    }
  }
  };
