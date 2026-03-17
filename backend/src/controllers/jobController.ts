import { Request, Response } from 'express';
import { Job } from '../models/Job';
import { Service } from '../models/Service';
import { Technician } from '../models/Technician';

export const createJob = async (req: Request & { user?: any }, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const {
      serviceId,
      title,
      description,
      location,
      images,
      budget,
      preferredDate,
      preferredTime,
      urgency
    } = req.body;
    
    // Validate service exists
    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(400).json({ message: 'Invalid service' });
    }
    
    const job = new Job({
      customerId: userId,
      serviceId,
      title,
      description,
      location: {
        type: 'Point',
        coordinates: location.coordinates || [85.3240, 27.7172], // Default to Kathmandu
        address: location.address,
        district: location.district,
        province: location.province
      },
      images: images || [],
      budget,
      preferredDate: preferredDate ? new Date(preferredDate) : undefined,
      preferredTime,
      urgency: urgency || 'medium'
    });
    
    await job.save();
    
    // Notify nearby technicians (this would be implemented with a notification system)
    const nearbyTechnicians = await Technician.find({
      verificationStatus: 'approved',
      'availability.available': true,
      $or: [
        { skills: serviceId },
        { 'pricing.serviceRates.service': serviceId }
      ],
      serviceAreas: { $in: [location.district] }
    });
    
    // TODO: Send notifications to nearby technicians
    
    res.status(201).json(job);
  } catch (error) {
    console.error('Create job error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getCustomerJobs = async (req: Request & { user?: any }, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const { status, page = 1, limit = 10 } = req.query;
    
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;
    
    let query: any = { customerId: userId };
    if (status) {
      query.status = status;
    }
    
    const jobs = await Job.find(query)
      .populate('serviceId', 'name nameNe icon')
      .populate('assignedTechnician', 'userId')
      .populate({
        path: 'assignedTechnician',
        populate: {
          path: 'userId',
          select: 'name profilePhoto'
        }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);
    
    const total = await Job.countDocuments(query);
    
    res.json({
      jobs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get customer jobs error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getTechnicianJobs = async (req: Request & { user?: any }, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    // Get technician profile
    const technician = await Technician.findOne({ userId });
    if (!technician) {
      return res.status(404).json({ message: 'Technician profile not found' });
    }
    
    const { status, page = 1, limit = 10 } = req.query;
    
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;
    
    let query: any = {};
    
    if (status === 'available') {
      // Show available jobs that match technician's skills
      query = {
        status: 'open',
        $or: [
          { serviceId: { $in: technician.skills } },
          { 'serviceId': { $in: technician.skills } }
        ]
      };
    } else {
      // Show assigned jobs
      query = {
        assignedTechnician: technician._id
      };
      if (status) {
        query.status = status;
      }
    }
    
    const jobs = await Job.find(query)
      .populate('serviceId', 'name nameNe icon')
      .populate('customerId', 'name profilePhoto location')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);
    
    const total = await Job.countDocuments(query);
    
    res.json({
      jobs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get technician jobs error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateJobStatus = async (req: Request & { user?: any }, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { status, technicianId } = req.body;
    
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const job = await Job.findById(id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    // Check if user owns the job or is the assigned technician
    const technician = await Technician.findOne({ userId });
    if (job.customerId.toString() !== userId && 
        (!technician || job.assignedTechnician?.toString() !== technician._id.toString())) {
      return res.status(403).json({ message: 'Not authorized to update this job' });
    }
    
    if (status === 'assigned' && technicianId) {
      // Assign job to technician
      job.assignedTechnician = technicianId;
      job.status = 'assigned';
    } else {
      job.status = status;
    }
    
    await job.save();
    
    res.json(job);
  } catch (error) {
    console.error('Update job status error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getJobById = async (req: Request & { user?: any }, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const job = await Job.findById(id)
      .populate('serviceId', 'name nameNe icon')
      .populate('customerId', 'name profilePhoto location')
      .populate('assignedTechnician')
      .populate({
        path: 'assignedTechnician',
        populate: {
          path: 'userId',
          select: 'name profilePhoto phone'
        }
      });
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    // Check if user has access to this job
    const technician = await Technician.findOne({ userId });
    if (job.customerId._id.toString() !== userId && 
        (!technician || job.assignedTechnician?._id.toString() !== technician._id.toString())) {
      return res.status(403).json({ message: 'Not authorized to view this job' });
    }
    
    res.json(job);
  } catch (error) {
    console.error('Get job by ID error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
