import { Router } from 'express';
import { 
  initiateEsewaPayment,
  initiateKhaltiPayment,
  verifyEsewaPayment,
  verifyKhaltiPayment,
  getPaymentHistory,
  confirmCashPayment
} from '../controllers/paymentController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Initiate Payment
router.post('/esewa/initiate', authenticate, initiateEsewaPayment);
router.post('/khalti/initiate', authenticate, initiateKhaltiPayment);
router.post('/cash/confirm', authenticate, confirmCashPayment);

// Verify Payment
router.get('/esewa/verify', verifyEsewaPayment);
router.post('/khalti/verify', verifyKhaltiPayment);

// Payment History
router.get('/history', authenticate, getPaymentHistory);

export default router;
