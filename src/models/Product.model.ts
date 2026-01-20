import mongoose, { Document, Schema } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  price: number;
  mrp: number;
  rating: number;
  reviews: number;
  images: string[];
  category: string;
  description?: string;
  stock: number;
  isBestSeller?: boolean;
  discount: number;
  emiText?: string;
  badge?: string;
}

const productSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: [true, 'Please add a product name'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Please add a price'],
      min: [0, 'Price must be a positive number'],
    },
    mrp: {
      type: Number,
      required: [true, 'Please add MRP'],
      min: [0, 'MRP must be a positive number'],
      validate: {
        validator: function (this: IProduct, value: number) {
          return value >= this.price;
        },
        message: 'MRP must be greater than or equal to selling price',
      },
    },
    rating: {
      type: Number,
      default: 0,
      min: [0, 'Rating must be at least 0'],
      max: [5, 'Rating cannot be more than 5'],
    },
    reviews: {
      type: Number,
      default: 0,
      min: [0, 'Reviews count cannot be negative'],
    },
    images: [
      {
        type: String,
        required: [true, 'Please add at least one image URL'],
      },
    ],
    category: {
      type: String,
      required: [true, 'Please add a category'],
      enum: {
        values: [
          'sofas',
          'beds',
          'dining-sets',
          'storage',
          'office',
          'decor',
        ],
        message: 'Please select a valid category',
      },
    },
    description: {
      type: String,
      trim: true,
    },
    stock: {
      type: Number,
      required: [true, 'Please add stock quantity'],
      min: [0, 'Stock cannot be negative'],
      default: 0,
    },
    isBestSeller: {
      type: Boolean,
      default: false,
    },
    discount: {
      type: Number,
      default: 0,
      min: [0, 'Discount cannot be negative'],
      max: [100, 'Discount cannot be more than 100%'],
    },
    emiText: String,
    badge: String,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Calculate discount percentage before saving
productSchema.pre('save', function (next) {
  if (this.isModified('price') || this.isModified('mrp')) {
    this.discount = Math.round(((this.mrp - this.price) / this.mrp) * 100);
  }
  next();
});

// Create a text index for search
productSchema.index({ name: 'text', description: 'text' });

const Product = mongoose.model<IProduct>('Product', productSchema);

export default Product;
