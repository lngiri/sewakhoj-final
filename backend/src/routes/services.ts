import { Router } from 'express';
import { 
  getServices, 
  getServiceById, 
  getTechniciansByService, 
  searchTechnicians 
} from '../controllers/serviceController';

const router = Router();

router.get('/', getServices);
router.get('/:id', getServiceById);
router.get('/:id/technicians', getTechniciansByService);
router.get('/search/technicians', searchTechnicians);

export default router;
