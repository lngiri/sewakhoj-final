import { Router } from 'express';
import { 
  getDashboardStats,
  getUsers,
  getTechnicians,
  updateTechnicianStatus,
  getJobs,
  getServices,
  createService,
  updateService,
  deleteService
} from '../controllers/adminController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Dashboard
router.get('/dashboard', authenticate, getDashboardStats);

// User Management
router.get('/users', authenticate, getUsers);

// Technician Management
router.get('/technicians', authenticate, getTechnicians);
router.put('/technicians/:id/status', authenticate, updateTechnicianStatus);

// Job Management
router.get('/jobs', authenticate, getJobs);

// Service Management
router.get('/services', authenticate, getServices);
router.post('/services', authenticate, createService);
router.put('/services/:id', authenticate, updateService);
router.delete('/services/:id', authenticate, deleteService);

export default router;
