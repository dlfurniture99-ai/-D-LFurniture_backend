import { Router } from 'express';
import { signup, adminSignup, login, adminLogin, getCurrentUser } from '../controllers/auth.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.post('/signup', signup);
router.post('/admin-signup', adminSignup);
router.post('/login', login);
router.post('/admin-login', adminLogin);
router.get('/me', authMiddleware, getCurrentUser);

export default router;
