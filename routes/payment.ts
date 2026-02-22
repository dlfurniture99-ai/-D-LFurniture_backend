import { Router } from 'express';
import PaymentService from '../controllers/paymentController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

/**
 * Checkout routes (for cart checkout)
 */
router.post('/create-order', authMiddleware, (req, res) => PaymentService.checkoutCreateOrder(req, res));
router.post('/verify-payment', authMiddleware, (req, res) => PaymentService.checkoutVerifyPayment(req, res));

/**
 * Cash on Delivery route
 */
router.post('/place-cod-order', authMiddleware, (req, res) => PaymentService.placeCODOrder(req, res));

/**
 * Single booking payment routes
 */
router.post('/booking/create-order', authMiddleware, (req, res) => PaymentService.createOrderHandler(req, res));
router.post('/booking/verify', authMiddleware, (req, res) => PaymentService.verifyPaymentHandler(req, res));

/**
 * Payment status and refund
 */
router.get('/status/:paymentId', authMiddleware, (req, res) => PaymentService.getStatus(req, res));
router.post('/refund', authMiddleware, (req, res) => PaymentService.refund(req, res));

export default router;