import { Router } from 'express';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import {
  createRazorpayOrder,
  verifyAndBook,
  placeCODOrder,
  getPaymentStatus,
  refundPayment,
} from '../controllers/paymentController';

const router = Router();

/**
 * ─── Razorpay Online Payment Flow ───────────────────────────────────────────
 *
 * Step 1 – Frontend sends productIds + quantities → backend fetches DB prices
 *           and creates a Razorpay order with the server-calculated amount.
 *
 * Step 2 – After user completes payment in Razorpay widget, frontend sends
 *           payment IDs + signature → backend verifies signature HMAC-SHA256,
 *           re-checks prices, then creates the booking.
 */
router.post('/create-order',   authMiddleware, createRazorpayOrder);
router.post('/verify-and-book', authMiddleware, verifyAndBook);

/**
 * ─── Cash on Delivery Flow ──────────────────────────────────────────────────
 *
 * Backend still verifies prices from DB before creating the booking.
 */
router.post('/place-cod-order', authMiddleware, placeCODOrder);

/**
 * ─── Payment Utilities ──────────────────────────────────────────────────────
 */
router.get('/status/:paymentId', authMiddleware, getPaymentStatus);

/** Refund – admin only */
router.post('/refund', authMiddleware, adminMiddleware, refundPayment);

export default router;