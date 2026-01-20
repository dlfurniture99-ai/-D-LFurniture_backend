import { Router } from 'express';
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
} from '../controllers/wishlist.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/get-wishlist', getWishlist);
router.post('/add-wishlist', addToWishlist);
router.delete('/remove-wishlist', removeFromWishlist);

export default router;
