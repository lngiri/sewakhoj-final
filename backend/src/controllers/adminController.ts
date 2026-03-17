import { Request, Response } from 'express';
import { User } from '../models/User';
import { Technician } from '../models/Technician';
import { Service } from '../models/Service';
import { Job } from '../models/Job';
import { Review } from '../models/Review';
import { Chat } from '../models/Chat';

// Dashboard Statistics
export const getDashboardStats = async (req: Request & { user?: any }, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    // Check if user is admin
    const user = await User.findById(userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    const [
      totalUsers,
      totalTechnicians,
      totalCustomers,
      totalJobs,
      activeJobs,
      completedJobs,
      totalServices,
      pendingTechnicians,
      totalReviews,
      avgRating
    ] = await Promise.all([
      User.countDocuments(),
      Technician.countDocuments(),
      User.countDocuments({ role: 'customer' }),
      Job.countDocuments(),
      Job.countDocuments({ status: { $in: ['open', 'assigned', 'in_progress'] } }),
      Job.countDocuments({ status: 'completed' }),
      Service.countDocuments(),
      Technician.countDocuments({ verificationStatus: 'pending' }),
      Review.countDocuments(),
      Review.aggregate([{ $group: { _id: null, avgRating: { $avg: '$rating' } } }])
    ]);
    
    // Get recent jobs
    const recentJobs = await Job.find()
      .populate('customerId', 'name')
      .populate('serviceId', 'name')
      .sort({ createdAt: -1 })
      .limit(5);
    
    // Get pending technicians
    const pendingTechs = await Technician.find({ verificationStatus: 'pending' })
      .populate('userId', 'name phone email')
      .sort({ createdAt: -1 })
      .limit(5);
    
    res.json({
      stats: {
        totalUsers,
        totalTechnicians,
        totalCustomers,
        totalJobs,
        activeJobs,
        completedJobs,
        totalServices,
        pendingTechnicians,
        totalReviews,
        avgRating: avgRating[0]?.avgRating?.toFixed(1) || 0
      },
      recentJobs,
      pendingTechnicians: pendingTechs
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// User Management
export const getUsers = async (req: Request & { user?: any }, res: Response) => {
  try {
    const userId = req.user?.id;
    const { page = 1, limit = 10, role, search } = req.query;
    
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    // Check if user is admin
    const user = await User.findById(userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;
    
    let query: any = {};
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);
    
    const total = await User.countDocuments(query);
    
    res.json({
      users,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Technician Management
export const getTechnicians = async (req: Request & { user?: any }, res: Response) => {
  try {
    const userId = req.user?.id;
    const { page = 1, limit = 10, status, search } = req.query;
    
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    // Check if user is admin
    const user = await User.findById(userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;
    
    let query: any = {};
    if (status) query.verificationStatus = status;
    if (search) {
      query = {
        ...query,
        $or: [
          { 'userId.name': { $regex: search, $options: 'i' } },
          { 'userId.phone': { $regex: search, $options: 'i' } },
          { skills: { $in: [new RegExp(search as string, 'i')] } }
        ]
      };
    }
    
    const technicians = await Technician.find(query)
      .populate('userId', 'name phone email profilePhoto')
      .sort({ createdAt: -1 })
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
    console.error('Get technicians error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Approve/Reject Technician
export const updateTechnicianStatus = async (req: Request & { user?: any }, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { status, reason } = req.body;
    
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    // Check if user is admin
    const user = await User.findById(userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    const technician = await Technician.findById(id);
    if (!technician) {
      return res.status(404).json({ message: 'Technician not found' });
    }
    
    technician.verificationStatus = status;
    if (reason) technician.verificationReason = reason;
    await technician.save();
    
    const updatedTechnician = await Technician.findById(id)
      .populate('userId', 'name phone email');
    
    res.json(updatedTechnician);
  } catch (error) {
    console.error('Update technician status error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Job Management
export const getJobs = async (req: Request & { user?: any }, res: Response) => {
  try {
    const userId = req.user?.id;
    const { page = 1, limit = 10, status, search } = req.query;
    
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    // Check if user is admin
    const user = await User.findById(userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;
    
    let query: any = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    const jobs = await Job.find(query)
      .populate('customerId', 'name phone')
      .populate('serviceId', 'name')
      .populate('assignedTechnician')
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
    console.error('Get jobs error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Service Management
export const getServices = async (req: Request & { user?: any }, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    // Check if user is admin
    const user = await User.findById(userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    const services = await Service.find().sort({ sortOrder: 1, name: 1 });
    
    res.json(services);
  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createService = async (req: Request & { user?: any }, res: Response) => {
  try {
    const userId = req.user?.id;
    const { name, nameNe, icon, description, descriptionNe, sortOrder } = req.body;
    
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    // Check if user is admin
    const user = await User.findById(userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    const service = new Service({
      name,
      nameNe,
      icon,
      description,
      descriptionNe,
      sortOrder: sortOrder || 0
    });
    
    await service.save();
    
    res.status(201).json(service);
  } catch (error) {
    console.error('Create service error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateService = async (req: Request & { user?: any }, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { name, nameNe, icon, description, descriptionNe, sortOrder, isActive } = req.body;
    
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    // Check if user is admin
    const user = await User.findById(userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    const service = await Service.findById(id);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }
    
    if (name) service.name = name;
    if (nameNe) service.nameNe = nameNe;
    if (icon) service.icon = icon;
    if (description) service.description = description;
    if (descriptionNe) service.descriptionNe = descriptionNe;
    if (sortOrder !== undefined) service.sortOrder = sortOrder;
    if (isActive !== undefined) service.isActive = isActive;
    
    await service.save();
    
    res.json(service);
  } catch (error) {
    console.error('Update service error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteService = async (req: Request & { user?: any }, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    // Check if user is admin
    const user = await User.findById(userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    const service = await Service.findById(id);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }
    
    await Service.findByIdAndDelete(id);
    
    res.json({ message: 'Service deleted successfully' });
  } catch (error) {
    console.error('Delete service error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
