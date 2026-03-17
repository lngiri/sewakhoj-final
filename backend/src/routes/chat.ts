import { Router } from 'express';
import { 
  getChats, 
  getChatById, 
  createChat, 
  sendMessage, 
  markMessagesAsRead 
} from '../controllers/chatController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getChats);
router.post('/', authenticate, createChat);
router.get('/:id', authenticate, getChatById);
router.post('/send', authenticate, sendMessage);
router.put('/:id/read', authenticate, markMessagesAsRead);

export default router;
