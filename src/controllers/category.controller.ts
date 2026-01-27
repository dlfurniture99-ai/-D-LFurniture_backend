import { Response } from 'express';
import Category from '../models/Category.model';
import Furniture from '../models/Furniture.model';
import { sendSuccess } from '../utils/response';
import { AppError, asyncHandler } from '../middlewares/error.middleware';
import { HTTP_STATUS } from '../utils/constants';

// Get all categories
export const getAllCategories = asyncHandler(
  async (req, res: Response) => {
    const categories = await Category.find({}).sort({ createdAt: 1 });
    
    // Count products for each category
    const categoriesWithCount = await Promise.all(
      categories.map(async (category) => {
        // Try multiple matching strategies
        let productCount = 0;
        
        // Strategy 1: Exact match with category.name
        productCount = await Furniture.countDocuments({ 
          category: category.name 
        });
        
        // Strategy 2: Case-insensitive match if no results
        if (productCount === 0) {
          productCount = await Furniture.countDocuments({ 
            category: { $regex: `^${category.name}$`, $options: 'i' } 
          });
        }
        
        console.log(`Category: ${category.name}, Product Count: ${productCount}`);
        
        return {
          ...category.toObject(),
          productCount,
        };
      })
    );
    
    res.status(HTTP_STATUS.OK).json(
      sendSuccess(
        'Categories fetched successfully',
        {
          categories: categoriesWithCount,
          total: categoriesWithCount.length,
        }
      )
    );
  }
);

// Get category by ID
export const getCategoryById = asyncHandler(
  async (req, res: Response) => {
    const { id } = req.params;
    const category = await Category.findById(id);
    
    if (!category) {
      throw new AppError('Category not found', HTTP_STATUS.NOT_FOUND);
    }
    
    res.status(HTTP_STATUS.OK).json(sendSuccess('Category fetched successfully', category));
  }
);

// Get category by slug
export const getCategoryBySlug = asyncHandler(
  async (req, res: Response) => {
    const { slug } = req.params;
    const category = await Category.findOne({ slug });
    
    if (!category) {
      throw new AppError('Category not found', HTTP_STATUS.NOT_FOUND);
    }
    
    res.status(HTTP_STATUS.OK).json(sendSuccess('Category fetched successfully', category));
  }
);

// Create category (Admin only)
export const createCategory = asyncHandler(
  async (req, res: Response) => {
    const { name, slug, image, description } = req.body;
    
    // Validate required fields
    if (!name || !slug) {
      throw new AppError('Name and slug are required', HTTP_STATUS.BAD_REQUEST);
    }
    
    // Check if category already exists
    const existingCategory = await Category.findOne({ 
      $or: [{ name }, { slug }] 
    });
    
    if (existingCategory) {
      throw new AppError('Category with this name or slug already exists', HTTP_STATUS.CONFLICT);
    }
    
    const category = await Category.create({
      name,
      slug: slug.toLowerCase(),
      image: image || '',
      description: description || '',
    });
    
    res.status(HTTP_STATUS.CREATED).json(
      sendSuccess('Category created successfully', category)
    );
  }
);

// Update category (Admin only)
export const updateCategory = asyncHandler(
  async (req, res: Response) => {
    const { id } = req.params;
    const { name, slug, image, description } = req.body;
    
    const category = await Category.findById(id);
    
    if (!category) {
      throw new AppError('Category not found', HTTP_STATUS.NOT_FOUND);
    }
    
    // Check if new slug already exists (exclude current category)
    if (slug && slug !== category.slug) {
      const existingCategory = await Category.findOne({ slug });
      if (existingCategory) {
        throw new AppError('A category with this slug already exists', HTTP_STATUS.CONFLICT);
      }
    }
    
    // Update fields
    if (name) category.name = name;
    if (slug) category.slug = slug.toLowerCase();
    if (image) category.image = image;
    if (description !== undefined) category.description = description;
    
    await category.save();
    
    res.status(HTTP_STATUS.OK).json(
      sendSuccess('Category updated successfully', category)
    );
  }
);

// Delete category (Admin only)
export const deleteCategory = asyncHandler(
  async (req, res: Response) => {
    const { id } = req.params;
    
    const category = await Category.findByIdAndDelete(id);
    
    if (!category) {
      throw new AppError('Category not found', HTTP_STATUS.NOT_FOUND);
    }
    
    res.status(HTTP_STATUS.OK).json(
      sendSuccess('Category deleted successfully', category)
    );
  }
);
