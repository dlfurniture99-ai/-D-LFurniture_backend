import mongoose, { Schema, Document } from 'mongoose';

export interface IAdmin extends Document {
  name: string;
  email: string;
  password: string;
  phone: string;
  address: string;
  role: 'admin' | 'superadmin';
  isVerified: boolean;
  isActive: boolean;
  profileImage: string;
  googleId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AdminSchema = new Schema<IAdmin>(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      match: /^[\w\.-]+@[\w\.-]+\.\w+$/
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    address: {
      type: String,
      default: ''
    },
    role: {
      type: String,
      enum: ['admin', 'superadmin'],
      default: 'admin'
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    isActive: {
      type: Boolean,
      default: true
    },
    profileImage: {
      type: String,
      default: null
    },
    googleId: {
      type: String,
      default: null,
      sparse: true
    }
  },
  { timestamps: true }
);

export default mongoose.model<IAdmin>('Admin', AdminSchema);
