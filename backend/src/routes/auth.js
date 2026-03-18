const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const OTP = require('../models/OTP');
const twilio = require('twilio');

const router = express.Router();

// Initialize Twilio
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Send OTP
router.post('/send-otp', async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Save OTP to database
    await OTP.create({
      phoneNumber,
      code: otp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    });
    
    // Send OTP via SMS
    await twilioClient.messages.create({
      body: `Your SewaKhoj OTP is: ${otp}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber
    });
    
    res.json({ success: true, message: 'OTP sent successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Verify OTP and login
router.post('/verify-otp', async (req, res) => {
  try {
    const { phoneNumber, otp } = req.body;
    
    // Find valid OTP
    const validOTP = await OTP.findOne({
      phoneNumber,
      code: otp,
      isUsed: false,
      expiresAt: { $gt: new Date() }
    });
    
    if (!validOTP) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }
    
    // Mark OTP as used
    await OTP.findByIdAndUpdate(validOTP._id, { isUsed: true });
    
    // Find or create user
    let user = await User.findOne({ phoneNumber });
    if (!user) {
      user = await User.create({
        phoneNumber,
        isVerified: true
      });
    } else {
      user.isVerified = true;
      await user.save();
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        phoneNumber: user.phoneNumber,
        role: user.role,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Check if phone number exists
router.post('/check-phone', async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    
    // Validate phone number format (Nepal: +977 98XXXXXXXX)
    const phoneRegex = /^\+977\s?98\d{8}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid phone number format. Use: +977 98XXXXXXXX' 
      });
    }
    
    // Check if user exists
    const user = await User.findOne({ phoneNumber });
    
    res.json({
      success: true,
      exists: !!user,
      phoneNumber
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Register new user (without OTP)
router.post('/register', async (req, res) => {
  try {
    const { phoneNumber, name, role = 'customer' } = req.body;
    
    // Validate phone number format
    const phoneRegex = /^\+977\s?98\d{8}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid phone number format. Use: +977 98XXXXXXXX' 
      });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ phoneNumber });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'Phone number already registered. Please login.' 
      });
    }
    
    // Create new user
    const user = await User.create({
      phoneNumber,
      name,
      role,
      isVerified: true
    });
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        phoneNumber: user.phoneNumber,
        role: user.role,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Direct login (without OTP)
router.post('/login', async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    
    // Validate phone number format
    const phoneRegex = /^\+977\s?98\d{8}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid phone number format. Use: +977 98XXXXXXXX' 
      });
    }
    
    // Find user
    const user = await User.findOne({ phoneNumber });
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found. Please register first.' 
      });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        phoneNumber: user.phoneNumber,
        role: user.role,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
