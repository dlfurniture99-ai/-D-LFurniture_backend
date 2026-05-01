import { Router } from 'express';
import { customRequirementController } from '../controllers/customRequirementController';

const router = Router();

// Public route to submit a requirement
router.post('/', customRequirementController.submit);

export default router;
