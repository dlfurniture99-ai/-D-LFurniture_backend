import { Router } from 'express';
import { adminAuthController } from '../controllers/adminAuthController';

const router = Router();

// Admin OTP login
router.post('/request-otp', adminAuthController.requestOTP);
router.post('/verify-otp', adminAuthController.verifyOTP);

export default router;
