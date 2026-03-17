import { Request, Response } from 'express';
import { Service } from '../models/Service';
import { Technician } from '../models/Technician';
import { User } from '../models/User';

export const getServices = async (req: Request, res: Response) => {
  try {
    const services = await Service.find({ isActive: true }).sort({ sortOrder: 1, name: 1 });
    res.json(services);
  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getServiceById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const service = await Service.findById(id);
    
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }
    
    res.json(service);
  } catch (error) {
    console.error('Get service by ID error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getTechniciansByService = async (req: Request, res: Response) => {
  try {
    const { serviceId } = req.params;
    const { 
      location, 
      rating = 0, 
      page = 1, 
      limit = 10,
      sortBy = 'rating',
      sortOrder = 'desc'
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    let query: any = {
      verificationStatus: 'approved',
      'availability.available': true,
      $or: [
        { skills: serviceId },
        { 'pricing.serviceRates.service': serviceId }
      ]
    };

    if (typeof rating === 'string' && !isNaN(parseFloat(rating))) {
      query.rating = { $gte: parseFloat(rating) };
    }

    let sortOptions: any = {};
    if (sortBy === 'rating') {
      sortOptions.rating = sortOrder === 'desc' ? -1 : 1;
    } else if (sortBy === 'experience') {
      sortOptions.experience = sortOrder === 'desc' ? -1 : 1;
    } else if (sortBy === 'reviewsCount') {
      sortOptions.reviewsCount = sortOrder === 'desc' ? -1 : 1;
    }

    const technicians = await Technician.find(query)
      .populate('userId', 'name profilePhoto location')
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum);

    const total = await Technician.countDocuments(query);

    res.json({
      technicians,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get technicians by service error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const searchTechnicians = async (req: Request, res: Response) => {
  try {
    const { 
      query: searchQuery,
      location,
      rating = 0,
      serviceId,
      page = 1,
      limit = 10,
      sortBy = 'rating',
      sortOrder = 'desc'
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    let query: any = {
      verificationStatus: 'approved',
      'availability.available': true
    };

    if (typeof rating === 'string' && !isNaN(parseFloat(rating))) {
      query.rating = { $gte: parseFloat(rating) };
    }

    if (serviceId) {
      query.$or = [
        { skills: serviceId },
        { 'pricing.serviceRates.service': serviceId }
      ];
    }

    const technicians = await Technician.find(query)
      .populate({
        path: 'userId',
        match: searchQuery ? {
          $or: [
            { name: { $regex: searchQuery, $options: 'i' } }
          ]
        } : {}
      })
      .sort(sortBy === 'rating' ? { rating: -1 } : { experience: -1 })
      .skip(skip)
      .limit(limitNum);

    const filteredTechnicians = technicians.filter(tech => tech.userId);

    const total = await Technician.countDocuments(query);

    res.json({
      technicians: filteredTechnicians,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Search technicians error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
