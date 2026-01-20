import { Router } from 'express';
import {
  getAllFurniture,
  getFurnitureById,
  createFurniture,
  updateFurniture,
  deleteFurniture,
} from '../controllers/furniture.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// Public routes
router.get('/all-furniture', getAllFurniture);
router.get('/single-furniture/:id', getFurnitureById);

// Admin routes
router.post('/create-furniture', authMiddleware, createFurniture);
router.put('/update-furniture', authMiddleware, updateFurniture);
router.delete('/delete-furniture', authMiddleware, deleteFurniture);

export default router;
