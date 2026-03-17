import { Request, Response } from 'express';
import { Review } from '../models/Review';
import { Technician } from '../models/Technician';
import { Job } from '../models/Job';
import { authenticate } from '../middleware/auth';

export const createReview = async (req: Request & { user?: any }, res: Response) => {
  try {
    const userId = req.user?.id;
    const { technicianId, jobId, rating, comment } = req.body;
    
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    if (!technicianId || !jobId || !rating) {
      return res.status(400).json({ message: 'Technician ID, job ID, and rating are required' });
    }
    
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }
    
    // Check if job exists and belongs to the user
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    if (job.customerId.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to review this job' });
    }
    
    if (job.status !== 'completed') {
      return res.status(400).json({ message: 'Job must be completed to leave a review' });
    }
    
    // Check if technician was assigned to the job
    if (!job.assignedTechnician || job.assignedTechnician.toString() !== technicianId) {
      return res.status(400).json({ message: 'Technician was not assigned to this job' });
    }
    
    // Check if review already exists
    const existingReview = await Review.findOne({ jobId, customerId: userId });
    if (existingReview) {
      return res.status(400).json({ message: 'Review already exists for this job' });
    }
    
    // Create review
    const review = new Review({
      customerId: userId,
      technicianId,
      jobId,
      rating,
      comment: comment || '',
      isVerified: true // Auto-verify since it's tied to a completed job
    });
    
    await review.save();
    
    // Update technician's rating and review count
    const technician = await Technician.findById(technicianId);
    if (technician) {
      const allReviews = await Review.find({ technicianId });
      const totalRating = allReviews.reduce((sum, rev) => sum + rev.rating, 0);
      const averageRating = totalRating / allReviews.length;
      
      technician.rating = Math.round(averageRating * 10) / 10; // Round to 1 decimal
      technician.reviewsCount = allReviews.length;
      await technician.save();
    }
    
    // Mark job as reviewed
    job.reviewed = true;
    await job.save();
    
    const populatedReview = await Review.findById(review._id)
      .populate('customerId', 'name profilePhoto')
      .populate('technicianId', 'userId')
      .populate({
        path: 'technicianId',
        populate: {
          path: 'userId',
          select: 'name profilePhoto'
        }
      });
    
    res.status(201).json(populatedReview);
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getTechnicianReviews = async (req: Request, res: Response) => {
  try {
    const { technicianId } = req.params;
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;
    
    let sortOptions: any = {};
    sortOptions[sortBy as string] = sortOrder === 'desc' ? -1 : 1;
    
    const reviews = await Review.find({ technicianId })
      .populate('customerId', 'name profilePhoto')
      .populate('jobId', 'title')
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum);
    
    const total = await Review.countDocuments({ technicianId });
    
    // Calculate rating distribution
    const ratingDistribution = await Review.aggregate([
      { $match: { technicianId: technicianId } },
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } }
    ]);
    
    const distribution = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0
    };
    
    ratingDistribution.forEach(item => {
      distribution[item._id as keyof typeof distribution] = item.count;
    });
    
    res.json({
      reviews,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      },
      ratingDistribution: distribution
    });
  } catch (error) {
    console.error('Get technician reviews error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getCustomerReviews = async (req: Request & { user?: any }, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const { page = 1, limit = 10 } = req.query;
    
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;
    
    const reviews = await Review.find({ customerId: userId })
      .populate('technicianId', 'userId')
      .populate({
        path: 'technicianId',
        populate: {
          path: 'userId',
          select: 'name profilePhoto'
        }
      })
      .populate('jobId', 'title')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);
    
    const total = await Review.countDocuments({ customerId: userId });
    
    res.json({
      reviews,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get customer reviews error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateReview = async (req: Request & { user?: any }, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { rating, comment } = req.body;
    
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    
    if (review.customerId.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to update this review' });
    }
    
    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }
    
    // Update review
    if (rating) review.rating = rating;
    if (comment !== undefined) review.comment = comment;
    
    await review.save();
    
    // Recalculate technician's rating
    const allReviews = await Review.find({ technicianId: review.technicianId });
    const totalRating = allReviews.reduce((sum, rev) => sum + rev.rating, 0);
    const averageRating = totalRating / allReviews.length;
    
    const technician = await Technician.findById(review.technicianId);
    if (technician) {
      technician.rating = Math.round(averageRating * 10) / 10;
      technician.reviewsCount = allReviews.length;
      await technician.save();
    }
    
    const updatedReview = await Review.findById(review._id)
      .populate('customerId', 'name profilePhoto')
      .populate('technicianId', 'userId')
      .populate({
        path: 'technicianId',
        populate: {
          path: 'userId',
          select: 'name profilePhoto'
        }
      });
    
    res.json(updatedReview);
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteReview = async (req: Request & { user?: any }, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    
    if (review.customerId.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to delete this review' });
    }
    
    const technicianId = review.technicianId;
    await Review.findByIdAndDelete(id);
    
    // Recalculate technician's rating
    const allReviews = await Review.find({ technicianId });
    const totalRating = allReviews.reduce((sum, rev) => sum + rev.rating, 0);
    const averageRating = allReviews.length > 0 ? totalRating / allReviews.length : 0;
    
    const technician = await Technician.findById(technicianId);
    if (technician) {
      technician.rating = Math.round(averageRating * 10) / 10;
      technician.reviewsCount = allReviews.length;
      await technician.save();
    }
    
    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
