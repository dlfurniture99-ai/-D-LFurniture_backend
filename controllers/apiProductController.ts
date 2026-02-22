import { Request, Response } from 'express';
import productModel from '../models/productModel';

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

// Get all products
export const getAllProducts = async (req: Request, res: Response) => {
  try {
    const products = await productModel.find({});
    res.json({
      success: true,
      message: 'Top rated products',
      data: products
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
      error: error.message
    });
  }
};

// Get product by slug
export const getProductBySlug = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const product = await productModel.findOne({ productSlug: slug });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      message: 'Product details',
      data: product
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product',
      error: error.message
    });
  }
};

// Get product by ID
export const getProductById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const product = await productModel.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      message: 'Product details',
      data: product
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product',
      error: error.message
    });
  }
};

// Create product
export const createProduct = async (req: Request, res: Response) => {
  try {
    const { productName, productImage, productPrice, productDiscount, productDescription, productReview, productType } = req.body;

    if (!productName || !productImage || !productPrice || !productDescription || !productType) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    const newProduct = new productModel({
      productName,
      productImage,
      productPrice,
      productDiscount,
      productDescription,
      productReview,
      productType
    });

    const saved = await newProduct.save();

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: saved
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to create product',
      error: error.message
    });
  }
};

// Update product
export const updateProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const product = await productModel.findByIdAndUpdate(id, updates, { new: true });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: product
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to update product',
      error: error.message
    });
  }
};

// Delete product
export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const product = await productModel.findByIdAndDelete(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete product',
      error: error.message
    });
  }
};
