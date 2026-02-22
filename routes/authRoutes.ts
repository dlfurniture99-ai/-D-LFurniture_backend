import { Router } from "express";
import { userRegisterController, verifyEmailController } from '../components/users/userRegisterController';
import { userLoginController, getCurrentUserController, userLogoutController } from '../components/users/userLoginController';

const router = Router();

/**
 * Authentication Routes
 */

// POST /api/auth/register - User Registration
router.post('/register', userRegisterController);

// POST /api/auth/login - User Login
router.post('/login', userLoginController);

// POST /api/auth/verify-email - Email Verification
router.post('/verify-email', verifyEmailController);

// GET /api/auth/me - Get Current User (Protected)
router.get('/me', getCurrentUserController);

// POST /api/auth/logout - User Logout
router.post('/logout', userLogoutController);

export default router;
