import mongoose, { Schema, Document } from 'mongoose';

export interface IFurniture extends Document {
  name: string;
  price: number;
  mrp: number;
  category: string;
  description: string;
  images: string[];
  discount: number;
  stock: number;
  createdAt: Date;
  updatedAt: Date;
}

const furnitureSchema = new Schema<IFurniture>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    mrp: {
      type: Number,
      required: true,
      min: 0,
    },
    category: {
      type: String,
      required: true,
      index: true,
    },
    description: {
      type: String,
      default: '',
    },
    images: [
      {
        type: String,
      },
    ],
    discount: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    stock: {
      type: Number,
      default: 0,
      min: 0,
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
