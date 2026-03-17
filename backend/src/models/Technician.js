const mongoose = require('mongoose');

const technicianSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  skills: [{
    type: String,
    required: true
  }],
  experience: {
    type: Number,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Technician', technicianSchema);
