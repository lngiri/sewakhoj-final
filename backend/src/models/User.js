const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  phoneNumber: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: false
  },
  role: {
    type: String,
    enum: ['customer', 'technician', 'admin'],
    default: 'customer'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

module.exports = mongoose.model('User', userSchema);
