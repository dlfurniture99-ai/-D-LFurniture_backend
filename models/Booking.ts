import mongoose, { Schema, Document } from 'mongoose';

export interface IBooking extends Document {
  bookingId: string;
  userId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  quantity: number;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentMethod: 'cod' | 'upi' | 'card' | 'netbanking' | 'wallet';
  deliveryDate: Date;
  deliveredDate?: Date;
  notes: string;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  deliveryOtp?: string;
  otpVerified: boolean;
  deliveryBoyId?: mongoose.Types.ObjectId;
  deliveryBoyName?: string;
  deliveryBoyPhone?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema = new Schema<IBooking>(
  {
    bookingId: {
      type: String,
      unique: true,
      required: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
      default: 'pending'
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending'
    },
    paymentMethod: {
      type: String,
      enum: ['cod', 'upi', 'card', 'netbanking', 'wallet'],
      default: 'cod'
    },
    deliveryDate: Date,
    deliveredDate: Date,
    notes: String,
    shippingAddress: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    },
    deliveryOtp: {
      type: String,
      select: false
    },
    otpVerified: {
      type: Boolean,
      default: false
    },
    deliveryBoyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    deliveryBoyName: String,
    deliveryBoyPhone: String
  },
  { timestamps: true }
);

export default mongoose.model<IBooking>('Booking', BookingSchema);
