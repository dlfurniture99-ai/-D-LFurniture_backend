import { Router } from 'express';
import { authMiddleware, deliveryBoyMiddleware } from '../middleware/auth';
import {
  generateDeliveryOtp,
  getBookingForDelivery,
  confirmDeliveryWithOtp,
  searchBooking
} from '../controllers/deliveryController';

const router = Router();

// All delivery routes require authentication and deliveryBoy role
router.use(authMiddleware, deliveryBoyMiddleware);

// Search booking by ID
router.get('/search', searchBooking);

// Get booking details for delivery
router.get('/:bookingId', getBookingForDelivery);

// Generate OTP for delivery
router.post('/:bookingId/generate-otp', generateDeliveryOtp);

// Confirm delivery with OTP
router.post('/:bookingId/confirm', confirmDeliveryWithOtp);

export default router;
