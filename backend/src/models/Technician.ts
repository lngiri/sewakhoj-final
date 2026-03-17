import mongoose, { Document, Schema } from 'mongoose';
import { IUser } from './User';

export interface ITechnician extends Document {
  userId: mongoose.Types.ObjectId;
  skills: string[];
  experience: number;
  serviceAreas: string[];
  verificationStatus: 'pending' | 'approved' | 'rejected';
  rating: number;
  reviewsCount: number;
  portfolio: string[];
  idDocument?: string;
  availability: {
    available: boolean;
    workingHours: {
      start: string;
      end: string;
    };
    daysOff: string[];
  };
  pricing: {
    hourlyRate?: number;
    serviceRates: {
      service: string;
      price: number;
      unit: 'hour' | 'job';
    }[];
  };
}

const technicianSchema = new Schema<ITechnician>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  skills: [{
    type: String,
    required: true
  }],
  experience: {
    type: Number,
    required: true,
    min: 0
  },
  serviceAreas: [{
    type: String,
    required: true
  }],
  verificationStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  reviewsCount: {
    type: Number,
    default: 0,
    min: 0
  },
  portfolio: [{
    type: String
  }],
  idDocument: {
    type: String
  },
  availability: {
    available: {
      type: Boolean,
      default: true
    },
    workingHours: {
      start: {
        type: String,
        default: '09:00'
      },
      end: {
        type: String,
        default: '18:00'
      }
    },
    daysOff: [{
      type: String
    }]
  },
  pricing: {
    hourlyRate: {
      type: Number,
      min: 0
    },
    serviceRates: [{
      service: {
        type: String,
        required: true
      },
      price: {
        type: Number,
        required: true,
        min: 0
      },
      unit: {
        type: String,
        enum: ['hour', 'job'],
        required: true
      }
    }]
  }
}, {
  timestamps: true
});

export const Technician = mongoose.model<ITechnician>('Technician', technicianSchema);
