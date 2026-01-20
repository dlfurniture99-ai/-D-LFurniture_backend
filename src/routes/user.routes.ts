import { Router } from 'express';
import { 
  getUserProfile, 
  getUserOrders, 
  getUserWishlist, 
  getUserDashboard 
} from '../controllers/user.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/profile', getUserProfile);
router.get('/orders', getUserOrders);
router.get('/wishlist', getUserWishlist);
router.get('/dashboard', getUserDashboard);

export default router;