import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  phone: string;
  address: string;
  role: 'customer';
  isVerified: boolean;
  isActive: boolean;
  profileImage: string;
  googleId?: string;
  otp?: string | null;
  otpExpires?: Date | null;
  bookings: mongoose.Types.ObjectId[];
  savedProducts: mongoose.Types.ObjectId[];
  favorites: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
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
      required: false,
      select: false
    },
    phone: {
      type: String,
      required: false,
      trim: true,
      default: ''
    },
    address: {
      type: String,
      default: ''
    },
    role: {
      type: String,
      enum: ['customer'],
      default: 'customer'
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
    },
    otp: {
      type: String,
      default: null,
      select: false
    },
    otpExpires: {
      type: Date,
      default: null,
      select: false
    },
    bookings: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking'
    }],
    savedProducts: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    }],
    favorites: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    }]
  },
  { timestamps: true }
);

export default mongoose.model<IUser>('User', UserSchema);
