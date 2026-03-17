import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { Message } from '../models/Message';
import { Chat } from '../models/Chat';

export const initializeSocket = (server: HTTPServer) => {
  const io = new SocketIOServer(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      methods: ["GET", "POST"]
    }
  });

  // Authentication middleware for Socket.IO
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      socket.userId = decoded.userId;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User ${socket.userId} connected`);

    // Join user to their personal room
    socket.join(socket.userId);

    // Handle joining a chat room
    socket.on('joinChat', async (chatId: string) => {
      try {
        const chat = await Chat.findById(chatId);
        if (!chat) {
          socket.emit('error', 'Chat not found');
          return;
        }

        // Check if user is participant
        if (chat.participants.user1.toString() !== socket.userId && 
            chat.participants.user2.toString() !== socket.userId) {
          socket.emit('error', 'Not authorized to join this chat');
          return;
        }

        socket.join(chatId);
        console.log(`User ${socket.userId} joined chat ${chatId}`);
      } catch (error) {
        socket.emit('error', 'Failed to join chat');
      }
    });

    // Handle sending messages
    socket.on('sendMessage', async (data: { chatId: string; content: string; type?: string }) => {
      try {
        const { chatId, content, type = 'text' } = data;

        const chat = await Chat.findById(chatId);
        if (!chat) {
          socket.emit('error', 'Chat not found');
          return;
        }

        // Check if user is participant
        if (chat.participants.user1.toString() !== socket.userId && 
            chat.participants.user2.toString() !== socket.userId) {
          socket.emit('error', 'Not authorized to send message in this chat');
          return;
        }

        const otherParticipantId = chat.participants.user1.toString() === socket.userId 
          ? chat.participants.user2.toString() 
          : chat.participants.user1.toString();

        const message = new Message({
          senderId: socket.userId,
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

        // Populate message with sender info
        const populatedMessage = await Message.findById(message._id)
          .populate('senderId', 'name profilePhoto');

        // Send message to both participants in the chat
        io.to(chatId).emit('newMessage', populatedMessage);

        // Send unread count update to receiver
        io.to(otherParticipantId).emit('unreadCountUpdate', {
          chatId,
          unreadCount: chat.unreadCounts.get(otherParticipantId) || 0
        });

      } catch (error) {
        socket.emit('error', 'Failed to send message');
      }
    });

    // Handle marking messages as read
    socket.on('markAsRead', async (chatId: string) => {
      try {
        const chat = await Chat.findById(chatId);
        if (!chat) {
          socket.emit('error', 'Chat not found');
          return;
        }

        // Check if user is participant
        if (chat.participants.user1.toString() !== socket.userId && 
            chat.participants.user2.toString() !== socket.userId) {
          socket.emit('error', 'Not authorized to update this chat');
          return;
        }

        // Mark all unread messages for this user as read
        await Message.updateMany(
          { 
            chatId: chat._id,
            receiverId: socket.userId,
            isRead: false
          },
          { isRead: true }
        );

        // Reset unread count for this user
        chat.unreadCounts.set(socket.userId, 0);
        await chat.save();

        // Notify other participant that messages were read
        const otherParticipantId = chat.participants.user1.toString() === socket.userId 
          ? chat.participants.user2.toString() 
          : chat.participants.user1.toString();

        io.to(otherParticipantId).emit('messagesRead', { chatId });

      } catch (error) {
        socket.emit('error', 'Failed to mark messages as read');
      }
    });

    // Handle typing indicators
    socket.on('typing', (data: { chatId: string; isTyping: boolean }) => {
      const { chatId, isTyping } = data;
      
      // Get the other participant in the chat
      Chat.findById(chatId).then(chat => {
        if (chat) {
          const otherParticipantId = chat.participants.user1.toString() === socket.userId 
            ? chat.participants.user2.toString() 
            : chat.participants.user1.toString();
          
          socket.to(otherParticipantId).emit('userTyping', {
            chatId,
            userId: socket.userId,
            isTyping
          });
        }
      });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User ${socket.userId} disconnected`);
    });
  });

  return io;
};

// Extend Socket interface to include userId
declare module 'socket.io' {
  interface Socket {
    userId: string;
  }
}
