import mongoose, { Document, Schema } from 'mongoose';

export interface IMessage extends Document {
  senderId: mongoose.Types.ObjectId;
  receiverId: mongoose.Types.ObjectId;
  jobId?: mongoose.Types.ObjectId;
  content: string;
  type: 'text' | 'image' | 'location';
  imageUrl?: string;
  isRead: boolean;
  createdAt: Date;
}

export interface IChat extends Document {
  participants: {
    user1: mongoose.Types.ObjectId;
    user2: mongoose.Types.ObjectId;
  };
  jobId?: mongoose.Types.ObjectId;
  lastMessage?: IMessage;
  unreadCounts: {
    [userId: string]: number;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>({
  senderId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiverId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  jobId: {
    type: Schema.Types.ObjectId,
    ref: 'Job'
  },
  content: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['text', 'image', 'location'],
    default: 'text'
  },
  imageUrl: {
    type: String
  },
  isRead: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

const chatSchema = new Schema<IChat>({
  participants: {
    user1: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    user2: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  jobId: {
    type: Schema.Types.ObjectId,
    ref: 'Job'
  },
  lastMessage: messageSchema,
  unreadCounts: {
    type: Map,
    of: Number,
    default: {}
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

chatSchema.index({ 'participants.user1': 1, 'participants.user2': 1 }, { unique: true });
chatSchema.index({ 'participants.user1': 1 });
chatSchema.index({ 'participants.user2': 1 });

export const Chat = mongoose.model<IChat>('Chat', chatSchema);
export const Message = mongoose.model<IMessage>('Message', messageSchema);
