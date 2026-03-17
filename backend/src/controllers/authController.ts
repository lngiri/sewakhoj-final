import { Request, Response } from 'express';
import { User } from '../models/User';
import { OTP } from '../models/OTP';
import { generateOTP, sendOTP, verifyPhoneFormat } from '../utils/otp';
import { generateToken, verifyToken } from '../utils/jwt';

export const sendOTPController = async (req: Request, res: Response) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    if (!verifyPhoneFormat(phone)) {
      return res.status(400).json({ message: 'Invalid Nepal phone number format' });
    }

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await OTP.deleteMany({ phone, isUsed: false });
    
    await OTP.create({
      phone,
      otp,
      expiresAt,
      isUsed: false
    });

    const otpSent = await sendOTP(phone, otp);
    
    if (!otpSent) {
      return res.status(500).json({ message: 'Failed to send OTP' });
    }

    res.json({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const verifyOTPController = async (req: Request, res: Response) => {
  try {
    const { phone, otp, name, role } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ message: 'Phone and OTP are required' });
    }

    const otpRecord = await OTP.findOne({
      phone,
      otp,
      isUsed: false,
      expiresAt: { $gt: new Date() }
    });

    if (!otpRecord) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    await OTP.findByIdAndUpdate(otpRecord._id, { isUsed: true });

    let user = await User.findOne({ phone });

    if (!user) {
      if (!name) {
        return res.status(400).json({ message: 'Name is required for new users' });
      }

      user = new User({
        name,
        phone,
        role: role || 'customer',
        location: {
          type: 'Point',
          coordinates: [85.3240, 27.7172], // Default: Kathmandu
          address: '',
          district: '',
          province: ''
        },
        isVerified: true
      });
      await user.save();
    }

    const token = generateToken({
      userId: user._id.toString(),
      phone: user.phone,
      role: user.role
    });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        profilePhoto: user.profilePhoto,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const refreshTokenController = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    const newToken = generateToken({
      userId: user._id.toString(),
      phone: user.phone,
      role: user.role
    });

    res.json({
      token: newToken,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        profilePhoto: user.profilePhoto,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
