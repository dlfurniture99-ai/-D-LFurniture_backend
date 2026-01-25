import express from 'express';
import { createOrder, verifyPayment, handleWebhook } from '../controllers/payment.controller';

const router = express.Router();

router.post('/order', createOrder);
router.post('/verify', verifyPayment);
router.post('/webhook', handleWebhook);

export default router;