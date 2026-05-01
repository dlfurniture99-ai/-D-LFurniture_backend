import mongoose, { Schema, Document } from 'mongoose';

export interface ICustomRequirement extends Document {
  name: string;
  email: string;
  phone: string;
  city: string;
  message: string;
  inquiryType: 'custom_design' | 'support_issue' | 'budget_help' | 'general_query';
  budgetMin?: number;
  budgetMax?: number;
  categories?: string[];
  desiredStyle?: string;
  desiredProduct?: string;
  woodType?: string;
  color?: string;
  size?: string;
  requiredFeatures?: string[];
  status: 'new' | 'in_progress' | 'resolved' | 'closed';
  adminNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CustomRequirementSchema = new Schema<ICustomRequirement>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true
    },
    email: {
      type: String,
      lowercase: true,
      trim: true
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true
    },
    city: {
      type: String,
      trim: true
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true
    },
    inquiryType: {
      type: String,
      enum: ['custom_design', 'support_issue', 'budget_help', 'general_query'],
      default: 'general_query'
    },
    budgetMin: {
      type: Number,
      default: 0
    },
    budgetMax: {
      type: Number
    },
    categories: [{
      type: String
    }],
    desiredStyle: {
      type: String,
      trim: true
    },
    desiredProduct: {
      type: String,
      trim: true
    },
    woodType: {
      type: String,
      trim: true
    },
    color: {
      type: String,
      trim: true
    },
    size: {
      type: String,
      trim: true
    },
    requiredFeatures: [{
      type: String
    }],
    status: {
      type: String,
      enum: ['new', 'in_progress', 'resolved', 'closed'],
      default: 'new'
    },
    adminNotes: {
      type: String,
      trim: true,
      default: ''
    }
  },
  { timestamps: true }
);

// Index for faster searching
CustomRequirementSchema.index({ name: 'text', email: 'text', phone: 'text', message: 'text' });

export default mongoose.model<ICustomRequirement>('CustomRequirement', CustomRequirementSchema);
