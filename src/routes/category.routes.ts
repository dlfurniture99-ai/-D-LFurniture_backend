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
router.get('/public-category', getAllCategories);
router.get('/public-category/:id', getCategoryById);
router.get('/public-category/slug/:slug', getCategoryBySlug);

// Admin routes
router.post('/create-category', authMiddleware, createCategory);
router.put('/edit-category/:id', authMiddleware, updateCategory);
router.delete('/delete-category/:id', authMiddleware, deleteCategory);

export default router;
