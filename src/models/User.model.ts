import mongoose, { Schema, Document, HydratedDocument } from 'mongoose';
import bcryptjs from 'bcryptjs';
import { ROLE } from '../utils/constants';

export interface IUser extends Document {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'buyer';
  createdAt: Date;
  updatedAt: Date;
  comparePassword(password: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['admin', 'buyer'] as const,
      default: 'buyer',
    },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function (this: HydratedDocument<IUser>, next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcryptjs.genSalt(10);
    this.password = await bcryptjs.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (
  this: HydratedDocument<IUser>,
  password: string
): Promise<boolean> {
  return bcryptjs.compare(password, this.password);
};

const User = mongoose.model<IUser>('User', userSchema);

export default User;

