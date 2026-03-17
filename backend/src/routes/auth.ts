import { Router } from 'express';
import { sendOTPController, verifyOTPController, refreshTokenController } from '../controllers/authController';

const router = Router();

router.post('/send-otp', sendOTPController);
router.post('/verify-otp', verifyOTPController);
router.post('/refresh-token', refreshTokenController);

export default router;
