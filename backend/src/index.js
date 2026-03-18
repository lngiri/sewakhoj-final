const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { createServer } = require('http');
const { connectDB } = require('./config/database');
const { initializeSocket } = require('./config/socket');
const authRoutes = require('./routes/auth');
const serviceRoutes = require('./routes/services');
const technicianRoutes = require('./routes/technicians');
const jobRoutes = require('./routes/jobs');
const chatRoutes = require('./routes/chat');
const reviewRoutes = require('./routes/reviews');
const adminRoutes = require('./routes/admin');
const paymentRoutes = require('./routes/payments');

dotenv.config();

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 5000;

// Database connection
connectDB();

// Initialize Socket.IO
const io = initializeSocket(server);

// Middleware
const allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:3000",
  "https://sewakhoj-frontend-only-dpxn.vercel.app",
  "https://sewakhoj.com",
  "http://localhost:3000"
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
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

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'SewaKhoj API Server' });
});

// Start server
server.listen(PORT, () => {
  console.log(`SewaKhoj API Server Running on Port ${PORT}`);
});
