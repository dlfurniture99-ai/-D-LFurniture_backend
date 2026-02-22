import { randomUUID } from "crypto";
import mongoose, {Schema} from "mongoose";

const uuid = randomUUID();

// Helper function to generate slug
function generateSlug(productName: string): string {
  return productName
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .slice(0, 100); // Limit to 100 characters
}

const productSchema = new Schema({
    productId: {type: String, default: uuid},
    productName: {type: String, required: true},
    productSlug: {type: String, unique: true, lowercase: true, sparse: true},
    productImage: {type: [String], required: true},
    productPrice: {type: String, required: true},
    productDiscount: {type: Number},
    productDescription: {type: String, required: true},
    productReview: {type: Number},
    productType: {type: String, required: true}
}, { timestamps: true });

// Auto-generate slug before saving
productSchema.pre('save', function(next) {
  if (!this.productSlug && this.productName) {
    this.productSlug = generateSlug(this.productName as string);
  }
  next();
});

const productModel = mongoose.model("products", productSchema);
export default productModel;