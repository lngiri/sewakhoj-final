const express = require('express');
const Technician = require('../models/Technician');
const User = require('../models/User');

const router = express.Router();

// Get all technicians
router.get('/', async (req, res) => {
  try {
    const technicians = await Technician.find({ isAvailable: true })
      .populate('userId', 'name phoneNumber')
      .populate({
        path: 'userId',
        select: 'name phoneNumber'
      });
    
    res.json(technicians);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get technician by ID
router.get('/:id', async (req, res) => {
  try {
    const technician = await Technician.findById(req.params.id)
      .populate('userId', 'name phoneNumber');
    
    if (!technician) {
      return res.status(404).json({ message: 'Technician not found' });
    }
    
    res.json(technician);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create technician profile
router.post('/', async (req, res) => {
  try {
    const technician = new Technician(req.body);
    await technician.save();
    res.status(201).json(technician);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update technician profile
router.put('/:id', async (req, res) => {
  try {
    const technician = await Technician.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    
    if (!technician) {
      return res.status(404).json({ message: 'Technician not found' });
    }
    
    res.json(technician);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get technicians by category
router.get('/category/:category', async (req, res) => {
  try {
    const technicians = await Technician.find({ 
      skills: { $in: [req.params.category] },
      isAvailable: true 
    })
      .populate('userId', 'name phoneNumber');
    
    res.json(technicians);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
