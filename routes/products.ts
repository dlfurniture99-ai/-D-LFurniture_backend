import { Router } from 'express';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleProductVisibility,
  addProductReview
} from '../controllers/productController';

const router = Router();

// Admin: Get all products (including hidden)
router.get('/admin/all', authMiddleware, adminMiddleware, getAllProducts);

// Get all visible products
router.get('/', getAllProducts);

// Get product details by ID
router.get('/:id', getProductById);

// Admin: Create product
router.post('/', authMiddleware, adminMiddleware, createProduct);

// Admin: Update product
router.put('/:id', authMiddleware, adminMiddleware, updateProduct);

// Admin: Delete product
router.delete('/:id', authMiddleware, adminMiddleware, deleteProduct);

// Admin: Toggle product visibility
router.patch('/:id/visibility', authMiddleware, adminMiddleware, toggleProductVisibility);

// Add review
router.post('/:id/reviews', authMiddleware, addProductReview);

export default router;
