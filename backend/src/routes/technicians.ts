import { Router } from 'express';
import { 
  getTechnicianProfile,
  getTechnicianById, 
  getTechnicianReviews, 
  updateTechnicianProfile, 
  registerTechnician 
} from '../controllers/technicianController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/profile', authenticate, getTechnicianProfile);
router.get('/:id', getTechnicianById);
router.get('/:id/reviews', getTechnicianReviews);
router.post('/register', authenticate, registerTechnician);
router.put('/profile', authenticate, updateTechnicianProfile);

export default router;
