import { Router } from 'express';
import { 
  createJob, 
  getCustomerJobs, 
  getTechnicianJobs, 
  updateJobStatus, 
  getJobById 
} from '../controllers/jobController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/', authenticate, createJob);
router.get('/customer', authenticate, getCustomerJobs);
router.get('/technician', authenticate, getTechnicianJobs);
router.get('/:id', authenticate, getJobById);
router.put('/:id/status', authenticate, updateJobStatus);

export default router;
