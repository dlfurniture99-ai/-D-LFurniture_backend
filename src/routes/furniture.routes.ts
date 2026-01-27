import { Router } from 'express';
import {
  getAllFurniture,
  getFurnitureById,
  createFurniture, 
  updateFurniture,
  deleteFurniture,
} from '../controllers/furniture.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { upload, uploadToCloudinary } from '../middlewares/upload.middleware';
const router = Router();

// Public routes
router.get('/all-furniture', getAllFurniture);
router.get('/single-furniture/:id', getFurnitureById);

// Admin routes (max 5 images)
router.post('/create-furniture', authMiddleware, upload.array('images', 5), uploadToCloudinary, createFurniture);
router.put('/update-furniture', authMiddleware, upload.array('images', 5), uploadToCloudinary, updateFurniture);
router.delete('/delete-furniture', authMiddleware, deleteFurniture);

export default router;
