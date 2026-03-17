import { Router } from 'express';
import { 
  createReview, 
  getTechnicianReviews, 
  getCustomerReviews, 
  updateReview, 
  deleteReview 
} from '../controllers/reviewController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/', authenticate, createReview);
router.get('/technician/:technicianId', getTechnicianReviews);
router.get('/customer', authenticate, getCustomerReviews);
router.put('/:id', authenticate, updateReview);
router.delete('/:id', authenticate, deleteReview);

export default router;
