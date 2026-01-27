import { Router } from 'express';
import {
  getAllCategories,
  getCategoryById,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/category.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// Public routes
router.get('/', getAllCategories);
router.get('/:id', getCategoryById);
router.get('/slug/:slug', getCategoryBySlug);
 
// Admin routes
router.post('/create-category', authMiddleware, createCategory);
router.put('/edit-category/:id', authMiddleware, updateCategory);
router.delete('/delete-category/:id', authMiddleware, deleteCategory);

export default router;
