import { Router } from 'express';
import { authController } from '../controllers/authController';
import { authMiddleware, adminMiddleware } from '../middleware/auth';

const router = Router();

// Auth routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/google', authController.googleAuth);
router.post('/verify-email', authController.verifyEmail);
router.get('/me', authMiddleware, authController.getMe);
router.post('/logout', authController.logout);

// Admin: Register delivery boy
router.post('/register-delivery-boy', authMiddleware, adminMiddleware, authController.registerDeliveryBoy);

// Delivery Boy: Request OTP
router.post('/delivery-boy/request-otp', authController.deliveryBoyRequestOtp);

// Delivery Boy: Verify OTP and Login
router.post('/delivery-boy/verify-otp', authController.deliveryBoyVerifyOtp);

export default router;
