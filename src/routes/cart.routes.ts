import { Router } from 'express';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} from '../controllers/cart.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/getcart', getCart);
router.post('/add-cart', addToCart);
router.put('/update-cart', updateCartItem);
router.delete('/remove-cart', removeFromCart);
router.post('/clear-cart', clearCart);

export default router;
