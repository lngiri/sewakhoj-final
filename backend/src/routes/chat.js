const express = require('express');
const Chat = require('../models/Chat');
const Message = require('../models/Message');

const router = express.Router();

// Get all chats for a user
router.get('/:userId', async (req, res) => {
  try {
    const chats = await Chat.find({
      participants: req.params.userId
    })
      .populate('participants', 'name phoneNumber')
      .sort({ lastMessageTime: -1 });
    
    res.json(chats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get messages for a chat
router.get('/messages/:chatId', async (req, res) => {
  try {
    const messages = await Message.find({ chatId: req.params.chatId })
      .populate('senderId', 'name phoneNumber')
      .sort({ timestamp: 1 });
    
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new chat
router.post('/', async (req, res) => {
  try {
    const chat = new Chat(req.body);
    await chat.save();
    res.status(201).json(chat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
