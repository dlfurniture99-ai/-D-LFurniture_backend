import mongoose, { Schema, Document } from 'mongoose';

export interface IFurniture extends Document {
  name: string;
  price: number;
  mrp: number;
  category: string;
  description?: string;
  image?: string;
  images?: string[];
  discount?: number;
  rating?: number;
  reviews?: number;
  badge?: string;
  isBestSeller?: boolean;
  emiText?: string;
  stock?: number;
  createdAt: Date;
  updatedAt: Date;
}

const furnitureSchema = new Schema<IFurniture>(
  {
    name: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    mrp: {
      type: Number,
      required: true,
    },
    category: {
      type: String,
      required: true,
      index: true,
    },
    description: {
      type: String,
    },
    image: {
      type: String,
    },
    images: [
      {
        type: String,
      },
    ],
    discount: {
      type: Number,
      default: 0,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviews: {
      type: Number,
      default: 0,
    },
    badge: {
      type: String,
    },
    isBestSeller: {
      type: Boolean,
      default: false,
    },
    emiText: {
      type: String,
    },
    stock: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Index for search
furnitureSchema.index({ name: 'text', description: 'text' });
// Index for filtering
furnitureSchema.index({ category: 1, price: 1 });

const Furniture = mongoose.model<IFurniture>('Furniture', furnitureSchema);

export default Furniture;
