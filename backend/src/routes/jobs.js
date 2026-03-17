const express = require('express');
const Job = require('../models/Job');
const User = require('../models/User');

const router = express.Router();

// Get all jobs
router.get('/', async (req, res) => {
  try {
    const jobs = await Job.find()
      .populate('customerId', 'name phoneNumber')
      .populate('technicianId', 'userId')
      .populate({
        path: 'technicianId',
        populate: {
          path: 'userId',
          select: 'name phoneNumber'
        }
      })
      .sort({ createdAt: -1 });
    
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get job by ID
router.get('/:id', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('customerId', 'name phoneNumber')
      .populate('technicianId', 'userId')
      .populate({
        path: 'technicianId',
        populate: {
          path: 'userId',
          select: 'name phoneNumber'
        }
      });
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    res.json(job);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new job
router.post('/', async (req, res) => {
  try {
    const job = new Job(req.body);
    await job.save();
    res.status(201).json(job);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update job status
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const job = await Job.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    res.json(job);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get jobs by customer
router.get('/customer/:customerId', async (req, res) => {
  try {
    const jobs = await Job.find({ customerId: req.params.customerId })
      .populate('customerId', 'name phoneNumber')
      .populate('technicianId', 'userId')
      .sort({ createdAt: -1 });
    
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
