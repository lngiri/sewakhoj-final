import mongoose, { Document, Schema } from 'mongoose';

export interface IService extends Document {
  name: string;
  nameNe: string;
  icon: string;
  category: string;
  description: string;
  descriptionNe: string;
  isActive: boolean;
  sortOrder: number;
}

const serviceSchema = new Schema<IService>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  nameNe: {
    type: String,
    required: true,
    trim: true
  },
  icon: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  descriptionNe: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  sortOrder: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

export const Service = mongoose.model<IService>('Service', serviceSchema);
