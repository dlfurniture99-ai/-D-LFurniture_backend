import { Router } from 'express';
import { favoriteController } from '../controllers/favoriteController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Get user favorites
router.get('/', authMiddleware, favoriteController.getAll);

// Add to favorites
router.post('/add/:productId', authMiddleware, favoriteController.add);

// Remove from favorites
router.post('/remove/:productId', authMiddleware, favoriteController.remove);

// Check if product is favorite
router.get('/check/:productId', authMiddleware, favoriteController.checkIsFavorite);

export default router;
