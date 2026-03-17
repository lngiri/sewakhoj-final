import mongoose, { Document, Schema } from 'mongoose';

export interface IReview extends Document {
  customerId: mongoose.Types.ObjectId;
  technicianId: mongoose.Types.ObjectId;
  jobId: mongoose.Types.ObjectId;
  rating: number;
  comment: string;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>({
  customerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  technicianId: {
    type: Schema.Types.ObjectId,
    ref: 'Technician',
    required: true
  },
  jobId: {
    type: Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    required: true,
    trim: true
  },
  isVerified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

reviewSchema.index({ customerId: 1, technicianId: 1 }, { unique: true });
reviewSchema.index({ technicianId: 1, rating: 1 });

export const Review = mongoose.model<IReview>('Review', reviewSchema);
