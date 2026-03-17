import mongoose, { Document, Schema } from 'mongoose';

export interface IJob extends Document {
  customerId: mongoose.Types.ObjectId;
  serviceId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  location: {
    type: string;
    coordinates: [number, number];
    address: string;
    district: string;
    province: string;
  };
  images: string[];
  budget?: {
    min?: number;
    max?: number;
    type: 'hourly' | 'fixed';
  };
  preferredDate?: Date;
  preferredTime?: string;
  urgency: 'low' | 'medium' | 'high';
  status: 'open' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  assignedTechnician?: mongoose.Types.ObjectId;
  technicianProposal?: {
    technicianId: mongoose.Types.ObjectId;
    proposedPrice: number;
    estimatedDuration: string;
    message: string;
    proposedAt: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

const jobSchema = new Schema<IJob>({
  customerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  serviceId: {
    type: Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true,
      index: '2dsphere'
    },
    address: {
      type: String,
      required: true
    },
    district: {
      type: String,
      required: true
    },
    province: {
      type: String,
      required: true
    }
  },
  images: [{
    type: String
  }],
  budget: {
    min: {
      type: Number,
      min: 0
    },
    max: {
      type: Number,
      min: 0
    },
    type: {
      type: String,
      enum: ['hourly', 'fixed']
    }
  },
  preferredDate: {
    type: Date
  },
  preferredTime: {
    type: String
  },
  urgency: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['open', 'assigned', 'in_progress', 'completed', 'cancelled'],
    default: 'open'
  },
  reviewed: {
    type: Boolean,
    default: false
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentTransaction: {
    uuid: String,
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    amount: Number,
    method: {
      type: String,
      enum: ['esewa', 'khalti', 'cash', 'khalti_qr']
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'cancelled'],
      default: 'pending'
    },
    confirmedBy: String,
    createdAt: {
      type: Date,
      default: Date.now
    },
    completedAt: Date
  },
  assignedTechnician: {
    type: Schema.Types.ObjectId,
    ref: 'Technician'
  },
  technicianProposal: {
    technicianId: {
      type: Schema.Types.ObjectId,
      ref: 'Technician'
    },
    proposedPrice: {
      type: Number,
      required: true
    },
    estimatedDuration: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    proposedAt: {
      type: Date,
      default: Date.now
    }
  }
}, {
  timestamps: true
});

export const Job = mongoose.model<IJob>('Job', jobSchema);
