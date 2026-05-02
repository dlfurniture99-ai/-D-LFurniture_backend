import { Router } from 'express';
import { blogController } from '../controllers/blogController';
import { authMiddleware, adminMiddleware } from '../middleware/auth';

const router = Router();

// Public routes
router.get('/', blogController.getAll);
router.get('/:slug', blogController.getBySlug);

// Admin only routes
router.post('/', authMiddleware, adminMiddleware, blogController.create);
router.put('/:id', authMiddleware, adminMiddleware, blogController.update);
router.delete('/:id', authMiddleware, adminMiddleware, blogController.delete);

export default router;
