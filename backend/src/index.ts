import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { connectDB } from './config/database';
import { initializeSocket } from './config/socket';
import authRoutes from './routes/auth';
import serviceRoutes from './routes/services';
import technicianRoutes from './routes/technicians';
import jobRoutes from './routes/jobs';
import chatRoutes from './routes/chat';
import reviewRoutes from './routes/reviews';
import adminRoutes from './routes/admin';
import paymentRoutes from './routes/payments';

dotenv.config();

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 5000;

// Database connection
connectDB();

// Initialize Socket.IO
const io = initializeSocket(server);

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/technicians', technicianRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);

// Basic routes
app.get('/', (req, res) => {
  res.json({ message: 'SewaKhoj API Server' });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
