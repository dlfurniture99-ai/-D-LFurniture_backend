import { Router } from 'express';
import { adminController } from '../controllers/adminController';
import { customRequirementController } from '../controllers/customRequirementController';
import { authMiddleware, adminMiddleware } from '../middleware/auth';

const router = Router();

// All admin routes require authentication and admin role
router.use(authMiddleware, adminMiddleware);

// Customer management
router.get('/customers', adminController.getAllCustomers);

// Delivery boy management
router.get('/delivery-boys', adminController.getAllDeliveryBoys);
router.get('/delivery-boys/:id', adminController.getDeliveryBoyById);
router.delete('/delivery-boys/:id', adminController.deleteDeliveryBoy);
router.patch('/delivery-boys/:id/deactivate', adminController.deactivateDeliveryBoy);
router.patch('/delivery-boys/:id/activate', adminController.activateDeliveryBoy);

// Custom Requirements management
router.get('/custom-requirements', customRequirementController.getAll);
router.patch('/custom-requirements/:id/status', customRequirementController.updateStatus);

export default router;
