import mongoose, { Schema, Document } from 'mongoose';

export interface IDeliveryBoy extends Document {
  name: string;
  email: string;
  phone: string;
  address: string;
  role: 'deliveryBoy';
  isActive: boolean;
  profileImage: string;
  loginOtp?: string | null;
  loginOtpExpires?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const DeliveryBoySchema = new Schema<IDeliveryBoy>(
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
      enum: ['deliveryBoy'],
      default: 'deliveryBoy'
    },
    isActive: {
      type: Boolean,
      default: true
    },
    profileImage: {
      type: String,
      default: null
    },
    loginOtp: {
      type: String,
      default: null,
      select: false
    },
    loginOtpExpires: {
      type: Date,
      default: null,
      select: false
    }
  },
  { timestamps: true }
);

export default mongoose.model<IDeliveryBoy>('DeliveryBoy', DeliveryBoySchema);
