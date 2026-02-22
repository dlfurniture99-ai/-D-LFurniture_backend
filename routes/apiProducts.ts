import { Router } from 'express';
import {
  getAllProducts,
  getProductBySlug,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
} from '../controllers/apiProductController';

const router = Router();

// Get all products
router.get('/', getAllProducts);

// Get product by slug
router.get('/slug/:slug', getProductBySlug);

// Get product by ID
router.get('/:id', getProductById);

// Create product (slug auto-generates via pre-save hook)
router.post('/', createProduct);

// Update product
router.put('/:id', updateProduct);

// Delete product
router.delete('/:id', deleteProduct);

export default router;
