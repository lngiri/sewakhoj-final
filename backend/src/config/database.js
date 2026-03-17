const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sewakhoj');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection error:', error);
    console.log('Trying local MongoDB...');
    try {
      const localConn = await mongoose.connect('mongodb://localhost:27017/sewakhoj');
      console.log(`Local MongoDB Connected: ${localConn.connection.host}`);
    } catch (localError) {
      console.error('Local MongoDB also failed:', localError);
      process.exit(1);
    }
  }
};

module.exports = { connectDB };
