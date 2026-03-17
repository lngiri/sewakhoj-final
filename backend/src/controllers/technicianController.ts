import { Request, Response } from 'express';
import { Technician } from '../models/Technician';
import { User } from '../models/User';
import { Review } from '../models/Review';
import { authenticate } from '../middleware/auth';

export const getTechnicianProfile = async (req: Request & { user?: any }, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const technician = await Technician.findOne({ userId })
      .populate('userId', 'name phone profilePhoto location');
    
    if (!technician) {
      return res.status(404).json({ message: 'Technician profile not found' });
    }
    
    res.json(technician);
  } catch (error) {
    console.error('Get technician profile error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getTechnicianById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const technician = await Technician.findById(id)
      .populate('userId', 'name phone profilePhoto location');
    
    if (!technician) {
      return res.status(404).json({ message: 'Technician not found' });
    }
    
    res.json(technician);
  } catch (error) {
    console.error('Get technician by ID error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getTechnicianReviews = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const reviews = await Review.find({ technicianId: id })
      .populate('customerId', 'name profilePhoto')
      .sort({ createdAt: -1 });
    
    res.json(reviews);
  } catch (error) {
    console.error('Get technician reviews error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateTechnicianProfile = async (req: Request & { user?: any }, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const technician = await Technician.findOne({ userId });
    
    if (!technician) {
      return res.status(404).json({ message: 'Technician profile not found' });
    }
    
    const {
      skills,
      experience,
      serviceAreas,
      availability,
      pricing,
      portfolio
    } = req.body;
    
    if (skills) technician.skills = skills;
    if (experience !== undefined) technician.experience = experience;
    if (serviceAreas) technician.serviceAreas = serviceAreas;
    if (availability) technician.availability = { ...technician.availability, ...availability };
    if (pricing) technician.pricing = { ...technician.pricing, ...pricing };
    if (portfolio) technician.portfolio = portfolio;
    
    await technician.save();
    
    res.json(technician);
  } catch (error) {
    console.error('Update technician profile error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const registerTechnician = async (req: Request & { user?: any }, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const existingTechnician = await Technician.findOne({ userId });
    if (existingTechnician) {
      return res.status(400).json({ message: 'Technician profile already exists' });
    }
    
    const {
      skills,
      experience,
      serviceAreas,
      availability,
      pricing,
      idDocument
    } = req.body;
    
    const technician = new Technician({
      userId,
      skills,
      experience,
      serviceAreas,
      availability: availability || {
        available: true,
        workingHours: { start: '09:00', end: '18:00' },
        daysOff: []
      },
      pricing,
      idDocument,
      verificationStatus: 'pending'
    });
    
    await technician.save();
    
    // Update user role to technician
    await User.findByIdAndUpdate(userId, { role: 'technician' });
    
    res.status(201).json(technician);
  } catch (error) {
    console.error('Register technician error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
