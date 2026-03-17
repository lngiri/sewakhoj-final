const express = require('express');
const Review = require('../models/Review');
const Technician = require('../models/Technician');

const router = express.Router();

// Get all reviews for a technician
router.get('/technician/:technicianId', async (req, res) => {
  try {
    const reviews = await Review.find({ technicianId: req.params.technicianId })
      .populate('customerId', 'name phoneNumber')
      .sort({ createdAt: -1 });
    
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new review
router.post('/', async (req, res) => {
  try {
    const review = new Review(req.body);
    await review.save();
    
    // Update technician rating
    const technicianReviews = await Review.find({ technicianId: review.technicianId });
    const totalReviews = technicianReviews.length;
    const averageRating = technicianReviews.reduce((sum, rev) => sum + rev.rating, 0) / totalReviews;
    
    await Technician.findByIdAndUpdate(review.technicianId, {
      rating: averageRating,
      totalReviews
    });
    
    res.status(201).json(review);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get average rating for technician
router.get('/rating/:technicianId', async (req, res) => {
  try {
    const technician = await Technician.findById(req.params.technicianId);
    
    if (!technician) {
      return res.status(404).json({ message: 'Technician not found' });
    }
    
    res.json({
      rating: technician.rating,
      totalReviews: technician.totalReviews
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
