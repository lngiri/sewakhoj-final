import { Request, Response } from 'express';
import { Job } from '../models/Job';
import { User } from '../models/User';
import { authenticate } from '../middleware/auth';

// eSewa Payment Integration
export const initiateEsewaPayment = async (req: Request & { user?: any }, res: Response) => {
  try {
    const userId = req.user?.id;
    const { jobId, amount } = req.body;
    
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    if (!jobId || !amount) {
      return res.status(400).json({ message: 'Job ID and amount are required' });
    }
    
    // Get job details
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    if (job.customerId.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to pay for this job' });
    }
    
    // Generate unique transaction ID
    const transactionUuid = `SEWA-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // eSewa payment parameters
    const paymentData = {
      amt: amount,
      psc: 0, // Service charge (0 for now)
      pdc: 0, // Delivery charge (0 for now)
      txAmt: 0, // Tax amount (0 for now)
      tAmt: amount, // Total amount
      pid: jobId, // Product ID
      scd: 'EPAYTEST', // Merchant code (use test for development)
      su: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/esewa/success?transaction_uuid=${transactionUuid}`,
      fu: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/esewa/failed?transaction_uuid=${transactionUuid}`
    };
    
    // Store transaction details (in production, use a proper Payment model)
    const transaction = {
      uuid: transactionUuid,
      jobId,
      userId,
      amount,
      method: 'esewa',
      status: 'pending',
      createdAt: new Date()
    };
    
    // For now, we'll store in job temporarily (in production, use Payment model)
    job.paymentTransaction = transaction;
    await job.save();
    
    // Generate eSewa form data
    const formData = new FormData();
    Object.entries(paymentData).forEach(([key, value]) => {
      formData.append(key, value.toString());
    });
    
    res.json({
      success: true,
      paymentUrl: 'https://rc.esewa.com.np/epay/main',
      formData: Object.fromEntries(formData),
      transactionUuid
    });
    
  } catch (error) {
    console.error('eSewa payment initiation error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Khalti Payment Integration
export const initiateKhaltiPayment = async (req: Request & { user?: any }, res: Response) => {
  try {
    const userId = req.user?.id;
    const { jobId, amount } = req.body;
    
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    if (!jobId || !amount) {
      return res.status(400).json({ message: 'Job ID and amount are required' });
    }
    
    // Get job details
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    if (job.customerId.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to pay for this job' });
    }
    
    // Generate unique transaction ID
    const transactionUuid = `KHALTI-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Khalti payment payload
    const paymentPayload = {
      return_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/khalti/success`,
      website_url: process.env.FRONTEND_URL || 'http://localhost:3000',
      amount: amount * 100, // Khalti expects amount in paisa
      purchase_order_id: jobId,
      purchase_order_name: `Payment for job: ${job.title}`,
      customer_info: {
        name: req.user?.name || 'Customer',
        email: req.user?.email || '',
        phone: req.user?.phone || ''
      }
    };
    
    // Store transaction details
    const transaction = {
      uuid: transactionUuid,
      jobId,
      userId,
      amount,
      method: 'khalti',
      status: 'pending',
      createdAt: new Date()
    };
    
    job.paymentTransaction = transaction;
    await job.save();
    
    // In production, make actual API call to Khalti
    // For now, return the payload for frontend to handle
    res.json({
      success: true,
      payload: paymentPayload,
      transactionUuid,
      // In production, this would be the actual Khalti payment URL
      paymentUrl: 'https://khalti.com/api/v2/epayment/initiate/'
    });
    
  } catch (error) {
    console.error('Khalti payment initiation error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Verify eSewa Payment
export const verifyEsewaPayment = async (req: Request, res: Response) => {
  try {
    const { transaction_uuid, status } = req.query;
    
    if (!transaction_uuid) {
      return res.status(400).json({ message: 'Transaction UUID is required' });
    }
    
    // Find the job with this transaction
    const job = await Job.findOne({ 'paymentTransaction.uuid': transaction_uuid });
    if (!job) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    if (status === 'success' || status === 'Complete') {
      // Update job status to paid
      job.paymentStatus = 'paid';
      job.paymentTransaction.status = 'completed';
      job.paymentTransaction.completedAt = new Date();
      await job.save();
      
      // Update job status if needed
      if (job.status === 'completed') {
        // Job is already completed, just mark as paid
      }
      
      res.json({
        success: true,
        message: 'Payment verified successfully',
        jobId: job._id
      });
    } else {
      // Payment failed
      job.paymentTransaction.status = 'failed';
      await job.save();
      
      res.json({
        success: false,
        message: 'Payment failed',
        jobId: job._id
      });
    }
    
  } catch (error) {
    console.error('eSewa payment verification error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Verify Khalti Payment
export const verifyKhaltiPayment = async (req: Request, res: Response) => {
  try {
    const { pidx, transaction_id, status } = req.body;
    
    if (!pidx || !status) {
      return res.status(400).json({ message: 'Payment details are required' });
    }
    
    // Find the job with this transaction (in production, use proper Payment model)
    const job = await Job.findOne({ 'paymentTransaction.uuid': { $regex: transaction_id } });
    if (!job) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    if (status === 'Completed' || status === 'success') {
      // Update job status to paid
      job.paymentStatus = 'paid';
      job.paymentTransaction.status = 'completed';
      job.paymentTransaction.completedAt = new Date();
      await job.save();
      
      res.json({
        success: true,
        message: 'Payment verified successfully',
        jobId: job._id
      });
    } else {
      // Payment failed
      job.paymentTransaction.status = 'failed';
      await job.save();
      
      res.json({
        success: false,
        message: 'Payment failed',
        jobId: job._id
      });
    }
    
  } catch (error) {
    console.error('Khalti payment verification error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get Payment History
export const getPaymentHistory = async (req: Request & { user?: any }, res: Response) => {
  try {
    const userId = req.user?.id;
    const { page = 1, limit = 10 } = req.query;
    
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;
    
    const jobs = await Job.find({
      customerId: userId,
      paymentTransaction: { $exists: true }
    })
    .populate('serviceId', 'name')
    .populate('assignedTechnician')
    .sort({ 'paymentTransaction.createdAt': -1 })
    .skip(skip)
    .limit(limitNum);
    
    const total = await Job.countDocuments({
      customerId: userId,
      paymentTransaction: { $exists: true }
    });
    
    res.json({
      payments: jobs.map(job => ({
        jobId: job._id,
        jobTitle: job.title,
        serviceName: job.serviceId?.name,
        amount: job.paymentTransaction?.amount,
        method: job.paymentTransaction?.method,
        status: job.paymentTransaction?.status,
        createdAt: job.paymentTransaction?.createdAt,
        completedAt: job.paymentTransaction?.completedAt
      })),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
    
  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Cash Payment Confirmation
export const confirmCashPayment = async (req: Request & { user?: any }, res: Response) => {
  try {
    const userId = req.user?.id;
    const { jobId, amount, confirmedBy } = req.body;
    
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    if (!jobId || !amount) {
      return res.status(400).json({ message: 'Job ID and amount are required' });
    }
    
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    if (job.customerId.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to confirm payment for this job' });
    }
    
    // Create cash payment transaction
    const transaction = {
      uuid: `CASH-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      jobId,
      userId,
      amount,
      method: 'cash',
      status: 'completed',
      confirmedBy: confirmedBy || 'customer',
      createdAt: new Date(),
      completedAt: new Date()
    };
    
    job.paymentTransaction = transaction;
    job.paymentStatus = 'paid';
    await job.save();
    
    res.json({
      success: true,
      message: 'Cash payment confirmed successfully',
      transaction
    });
    
  } catch (error) {
    console.error('Cash payment confirmation error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
