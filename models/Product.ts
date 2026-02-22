import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  slug: string;
  description: string;
  category: string;
  price: number;
  discountPercentage?: number;
  finalPrice?: number;
  image: string;
  images: string[];
  stock: number;
  isVisible: boolean;
  rating: number;
  reviews: Array<{
    userId: mongoose.Types.ObjectId;
    userName: string;
    rating: number;
    comment: string;
    createdAt: Date;
  }>;
  specifications: Array<{
    key: string;
    value: string;
  }>;
  brand?: string;
  sku?: string;
  weight?: string;
  dimensions?: string;
  material?: string;
  warranty?: string;
  returnPolicy?: string;
  colors?: string[];
  finishes?: string[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: mongoose.Types.ObjectId;
}

const ProductSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true
    },
    description: {
      type: String,
      required: true,
      maxlength: 5000
    },
    category: {
      type: String,
      required: true,
      enum: [
        'Sofas & Couches',
        'Chairs & Stools',
        'Beds & Mattresses',
        'Desks & Tables',
        'Storage & Cabinets',
        'Shelving & Units',
        'Outdoor Furniture',
        'Bedroom Furniture',
        'Dining Furniture',
        'Office Furniture'
      ]
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    discountPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    finalPrice: {
      type: Number,
      default: 0,
      min: 0
    },
    image: {
      type: String,
      default: ''
    },
    images: [{
      type: String
    }],
    stock: {
      type: Number,
      required: true,
      default: 0,
      min: 0
    },
    isVisible: {
      type: Boolean,
      default: true
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    reviews: [{
      userId: mongoose.Schema.Types.ObjectId,
      userName: String,
      rating: { type: Number, min: 1, max: 5 },
      comment: String,
      createdAt: { type: Date, default: Date.now }
    }],
    specifications: [{
      key: String,
      value: String
    }],
    brand: {
      type: String,
      default: ''
    },
    sku: {
      type: String,
      default: ''
    },
    weight: {
      type: String,
      default: ''
    },
    dimensions: {
      type: String,
      default: ''
    },
    material: {
      type: String,
      default: ''
    },
    warranty: {
      type: String,
      default: ''
    },
    returnPolicy: {
      type: String,
      default: '30 days'
    },
    colors: [{
      type: String
    }],
    finishes: [{
      type: String
    }],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  { timestamps: true }
);

export default mongoose.model<IProduct>('Product', ProductSchema);
