import mongoose, { Document, Schema } from 'mongoose';

export interface IOTP extends Document {
  phone: string;
  otp: string;
  expiresAt: Date;
  isUsed: boolean;
  createdAt: Date;
}

const otpSchema = new Schema<IOTP>({
  phone: {
    type: String,
    required: true,
    index: true
  },
  otp: {
    type: String,
    required: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: '5m' }
  },
  isUsed: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

otpSchema.index({ phone: 1, isUsed: 1 });

export const OTP = mongoose.model<IOTP>('OTP', otpSchema);
