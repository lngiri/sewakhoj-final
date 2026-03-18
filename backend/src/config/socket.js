const { Server: SocketIOServer } = require('socket.io');
const jwt = require('jsonwebtoken');
const Message = require('../models/Message');
const Chat = require('../models/Chat');

const initializeSocket = (server) => {
  const allowedOrigins = [
    process.env.FRONTEND_URL || "http://localhost:3000",
    "https://sewakhoj-frontend-only-dpxn.vercel.app",
    "https://sewakhoj.com",
    "http://localhost:3000"
  ];

  const io = new SocketIOServer(server, {
    cors: {
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  // Authentication middleware for Socket.IO
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      next();
    } catch (error) {
      return next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userId}`);

    // Join user to their personal room
    socket.join(socket.userId);

    // Handle joining chat rooms
    socket.on('joinChat', async (chatId) => {
      try {
        socket.join(chatId);
        console.log(`User ${socket.userId} joined chat ${chatId}`);
      } catch (error) {
        console.error('Error joining chat:', error);
      }
    });

    // Handle sending messages
    socket.on('sendMessage', async (data) => {
      try {
        const { chatId, content } = data;

        // Create new message
        const message = new Message({
          chatId,
          senderId: socket.userId,
          content,
          timestamp: new Date()
        });

        await message.save();

        // Update last message in chat
        await Chat.findByIdAndUpdate(chatId, {
          lastMessage: content,
          lastMessageTime: new Date()
        });

        // Send message to chat room
        io.to(chatId).emit('newMessage', {
          _id: message._id,
          chatId,
          senderId: socket.userId,
          content,
          timestamp: message.timestamp
        });

      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', 'Failed to send message');
      }
    });

    // Handle typing indicators
    socket.on('typing', (data) => {
      const { chatId, isTyping } = data;
      socket.to(chatId).emit('userTyping', {
        userId: socket.userId,
        isTyping
      });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userId}`);
    });
  });

  return io;
};

module.exports = { initializeSocket };
