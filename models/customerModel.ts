import mongoose, { Schema } from "mongoose";

const customerSchema = new Schema(
  {
    customerName: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
    },
    customerEmail: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    customerPhone: {
      type: String,
      unique: true,
      minlength: 10,
    },
    customerPassword: {
      type: String,
      required: true,
      minlength: 6,
    },
    customerAddress: {
      type: String,
      default: "",
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    profileImage: {
      type: String,
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Create compound index for email and phone
customerSchema.index({ customerEmail: 1, customerPhone: 1 });

const customerdb = mongoose.model("Customer", customerSchema);
export default customerdb;