import { Router } from 'express';
import { bookingController } from '../controllers/bookingController';
import { authMiddleware, adminMiddleware } from '../middleware/auth';

const router = Router();

// Create booking
router.post('/', authMiddleware, bookingController.create);

// Get user bookings
router.get('/', authMiddleware, bookingController.getUserBookings);

// Get booking by bookingId (public - for delivery boys and order confirmation)
router.get('/by-id', bookingController.getByBookingId);

// Get booking details by MongoDB ID
router.get('/:id', authMiddleware, bookingController.getById);

// Admin: Get all bookings
router.get('/admin/all', authMiddleware, adminMiddleware, bookingController.getAllAdmin);

// Admin: Update booking status
router.patch('/:id/status', authMiddleware, adminMiddleware, bookingController.updateStatus);

// Admin: Cancel booking
router.patch('/:id/cancel', authMiddleware, adminMiddleware, bookingController.cancel);

export default router;
