import { Request, Response } from 'express';
import { Chat, Message } from '../models/Chat';
import { authenticate } from '../middleware/auth';

export const getChats = async (req: Request & { user?: any }, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const chats = await Chat.find({
      $or: [
        { 'participants.user1': userId },
        { 'participants.user2': userId }
      ]
    })
    .populate('participants.user1', 'name profilePhoto')
    .populate('participants.user2', 'name profilePhoto')
    .populate('lastMessage.senderId', 'name')
    .populate('jobId', 'title')
    .sort({ updatedAt: -1 });
    
    res.json(chats);
  } catch (error) {
    console.error('Get chats error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getChatById = async (req: Request & { user?: any }, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const chat = await Chat.findById(id)
      .populate('participants.user1', 'name profilePhoto')
      .populate('participants.user2', 'name profilePhoto')
      .populate({
        path: 'messages',
        populate: {
          path: 'senderId',
          select: 'name profilePhoto'
        }
      })
      .populate('jobId', 'title');
    
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    
    // Check if user is participant
    if (chat.participants.user1._id.toString() !== userId && 
        chat.participants.user2._id.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to view this chat' });
    }
    
    res.json(chat);
  } catch (error) {
    console.error('Get chat by ID error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createChat = async (req: Request & { user?: any }, res: Response) => {
  try {
    const userId = req.user?.id;
    const { participantId, jobId } = req.body;
    
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    if (!participantId) {
      return res.status(400).json({ message: 'Participant ID is required' });
    }
    
    // Check if chat already exists
    const existingChat = await Chat.findOne({
      $or: [
        { 'participants.user1': userId, 'participants.user2': participantId },
        { 'participants.user1': participantId, 'participants.user2': userId }
      ]
    });
    
    if (existingChat) {
      return res.json(existingChat);
    }
    
    const chat = new Chat({
      participants: {
        user1: userId,
        user2: participantId
      },
      jobId: jobId || undefined,
      unreadCounts: {
        [userId]: 0,
        [participantId]: 0
      }
    });
    
    await chat.save();
    
    const populatedChat = await Chat.findById(chat._id)
      .populate('participants.user1', 'name profilePhoto')
      .populate('participants.user2', 'name profilePhoto')
      .populate('jobId', 'title');
    
    res.status(201).json(populatedChat);
  } catch (error) {
    console.error('Create chat error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const sendMessage = async (req: Request & { user?: any }, res: Response) => {
  try {
    const userId = req.user?.id;
    const { chatId, content, type = 'text' } = req.body;
    
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    if (!chatId || !content) {
      return res.status(400).json({ message: 'Chat ID and content are required' });
    }
    
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    
    // Check if user is participant
    if (chat.participants.user1.toString() !== userId && 
        chat.participants.user2.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to send message in this chat' });
    }
    
    const otherParticipantId = chat.participants.user1.toString() === userId 
      ? chat.participants.user2.toString() 
      : chat.participants.user1.toString();
    
    const message = new Message({
      senderId: userId,
      receiverId: otherParticipantId,
      chatId: chat._id,
      content,
      type,
      isRead: false
    });
    
    await message.save();
    
    // Update chat's last message and unread count
    chat.lastMessage = message;
    chat.unreadCounts.set(otherParticipantId, (chat.unreadCounts.get(otherParticipantId) || 0) + 1);
    await chat.save();
    
    const populatedMessage = await Message.findById(message._id)
      .populate('senderId', 'name profilePhoto');
    
    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const markMessagesAsRead = async (req: Request & { user?: any }, res: Response) => {
  try {
    const userId = req.user?.id;
    const { chatId } = req.params;
    
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    
    // Check if user is participant
    if (chat.participants.user1.toString() !== userId && 
        chat.participants.user2.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to update this chat' });
    }
    
    // Mark all unread messages for this user as read
    await Message.updateMany(
      { 
        chatId: chat._id,
        receiverId: userId,
        isRead: false
      },
      { isRead: true }
    );
    
    // Reset unread count for this user
    chat.unreadCounts.set(userId, 0);
    await chat.save();
    
    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Mark messages as read error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
