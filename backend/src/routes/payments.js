const express = require('express');

const router = express.Router();

// Process payment (mock implementation)
router.post('/process', async (req, res) => {
  try {
    const { jobId, amount, paymentMethod } = req.body;
    
    // Mock payment processing
    // In real implementation, integrate with Khalti, eSewa, etc.
    const paymentSuccess = Math.random() > 0.1; // 90% success rate for demo
    
    if (paymentSuccess) {
      res.json({
        success: true,
        message: 'Payment processed successfully',
        transactionId: 'TXN' + Date.now()
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Payment failed'
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get payment history
router.get('/history/:userId', async (req, res) => {
  try {
    // Mock payment history
    const payments = [
      {
        id: 1,
        jobId: '60d5f3f9b1d8b1f8c8e4f3',
        amount: 500,
        status: 'completed',
        date: new Date('2024-01-15'),
        method: 'Khalti'
      },
      {
        id: 2,
        jobId: '60d5f3f9b1d8b1f8c8e4f4',
        amount: 300,
        status: 'completed',
        date: new Date('2024-01-10'),
        method: 'eSewa'
      }
    ];
    
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
