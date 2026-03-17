const express = require('express');
const User = require('../models/User');
const Technician = require('../models/Technician');
const Job = require('../models/Job');
const Service = require('../models/Service');

const router = express.Router();

// Get all users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all technicians
router.get('/technicians', async (req, res) => {
  try {
    const technicians = await Technician.find()
      .populate('userId', 'name phoneNumber')
      .sort({ createdAt: -1 });
    res.json(technicians);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all jobs
router.get('/jobs', async (req, res) => {
  try {
    const jobs = await Job.find()
      .populate('customerId', 'name phoneNumber')
      .populate('technicianId', 'userId')
      .sort({ createdAt: -1 });
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all services
router.get('/services', async (req, res) => {
  try {
    const services = await Service.find()
      .populate('technicianId', 'userId')
      .sort({ createdAt: -1 });
    res.json(services);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get platform statistics
router.get('/stats', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalTechnicians = await Technician.countDocuments();
    const totalJobs = await Job.countDocuments();
    const activeJobs = await Job.countDocuments({ status: { $in: ['pending', 'in_progress'] } });
    const completedJobs = await Job.countDocuments({ status: 'completed' });
    
    res.json({
      totalUsers,
      totalTechnicians,
      totalJobs,
      activeJobs,
      completedJobs
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
