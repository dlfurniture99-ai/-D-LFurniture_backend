import { Request, Response } from 'express';
import Booking from '../models/Booking';
import User from '../models/User';
import emailService from '../services/emailService';

// Generate OTP for delivery
export const generateDeliveryOtp = async (req: any, res: Response) => {
  try {
    const { bookingId } = req.params;
    
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Allow OTP generation for shipped, ready_for_delivery, or pending bookings (for COD)
    const allowedStatuses = ['shipped', 'ready_for_delivery', 'pending'];
    if (!allowedStatuses.includes(booking.status)) {
      return res.status(400).json({ 
        success: false, 
        message: `Cannot generate OTP for booking with status: ${booking.status}` 
      });
    }

    // Generate 4-digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    booking.deliveryOtp = otp;
    await booking.save();

    console.log(`OTP generated for booking ${bookingId}: ${otp}`);

    // Send OTP to customer via email
    try {
      const customer = await User.findById(booking.userId);
      if (customer) {
        await emailService.sendDeliveryOTP(customer.email, otp, customer.name);
        console.log(`✓ Delivery OTP email sent to: ${customer.email}`);
      }
    } catch (emailError) {
      console.error('⚠️  Failed to send delivery OTP email:', emailError);
      // Don't fail the request if email fails
    }

    res.json({
      success: true,
      message: 'OTP generated successfully and sent to customer email',
      otpLength: 4
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to generate OTP',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get booking details for delivery (delivery boy endpoint)
export const getBookingForDelivery = async (req: any, res: Response) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId)
      .populate('userId', 'name phone email')
      .populate('productId', 'name price');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Allow delivery for shipped, ready_for_delivery, or pending bookings (for COD)
    const allowedStatuses = ['shipped', 'ready_for_delivery', 'pending'];
    if (!allowedStatuses.includes(booking.status)) {
      return res.status(400).json({ 
        success: false, 
        message: `Booking is not ready for delivery. Current status: ${booking.status}` 
      });
    }

    res.json({
      success: true,
      booking: {
        _id: booking._id,
        bookingId: booking.bookingId,
        customer: booking.userId,
        product: booking.productId,
        quantity: booking.quantity,
        totalPrice: booking.totalPrice,
        shippingAddress: booking.shippingAddress,
        status: booking.status
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch booking',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Verify OTP and confirm delivery
export const confirmDeliveryWithOtp = async (req: any, res: Response) => {
  try {
    const { bookingId } = req.params;
    const { otp, deliveryBoyName, deliveryBoyPhone } = req.body;

    if (!otp || !deliveryBoyName || !deliveryBoyPhone) {
      return res.status(400).json({ 
        success: false, 
        message: 'OTP, delivery boy name and phone are required' 
      });
    }

    const booking = await Booking.findById(bookingId).select('+deliveryOtp');
    
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Allow delivery confirmation for shipped, ready_for_delivery, or pending bookings (for COD)
    const allowedStatuses = ['shipped', 'ready_for_delivery', 'pending'];
    if (!allowedStatuses.includes(booking.status)) {
      return res.status(400).json({ 
        success: false, 
        message: `Cannot deliver booking with status: ${booking.status}` 
      });
    }

    // Verify OTP
    if (!booking.deliveryOtp || booking.deliveryOtp !== otp) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid OTP' 
      });
    }

    // Update booking to delivered
    booking.status = 'delivered';
    booking.otpVerified = true;
    booking.deliveredDate = new Date();
    booking.deliveryBoyName = deliveryBoyName;
    booking.deliveryBoyPhone = deliveryBoyPhone;
    
    // If COD order, mark payment as completed since payment happens at delivery
    if (booking.paymentMethod === 'cod') {
      booking.paymentStatus = 'completed';
      console.log(`✓ COD order ${booking.bookingId} marked as payment completed`);
    }
    
    await booking.save();

    res.json({
      success: true,
      message: 'Delivery confirmed successfully',
      booking: {
        _id: booking._id,
        bookingId: booking.bookingId,
        status: booking.status,
        deliveredDate: booking.deliveredDate
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to confirm delivery',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Delivery boy searches booking by bookingId
export const searchBooking = async (req: any, res: Response) => {
  try {
    const { searchTerm } = req.query;

    if (!searchTerm) {
      return res.status(400).json({ 
        success: false, 
        message: 'Search term is required' 
      });
    }

    const booking = await Booking.findOne({ bookingId: searchTerm })
      .populate('productId', 'name price')
      .populate('userId', 'name phone email address');

    if (!booking) {
      return res.status(404).json({ 
        success: false, 
        message: 'No booking found with this ID' 
      });
    }

    // Allow fetching bookings in pending, processing, or shipped status
    // Only prevent delivery for cancelled or delivered bookings
    const allowedStatuses = ['pending', 'processing', 'shipped', 'ready_for_delivery'];
    if (!allowedStatuses.includes(booking.status)) {
      return res.status(400).json({ 
        success: false, 
        message: `Booking status is ${booking.status}, cannot be delivered` 
      });
    }

    res.json({
      success: true,
      booking: {
        _id: booking._id,
        bookingId: booking.bookingId,
        status: booking.status,
        totalPrice: booking.totalPrice,
        quantity: booking.quantity,
        product: booking.productId,
        customer: booking.userId,
        shippingAddress: booking.shippingAddress
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to search booking',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
