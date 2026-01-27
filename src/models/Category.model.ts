import mongoose, { Schema, Document } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  slug: string;
  image?: string;
  emoji?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    image: {
      type: String,
      default: '',
    },
    emoji: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

const Category = mongoose.model<ICategory>('Category', categorySchema);

export default Category;
