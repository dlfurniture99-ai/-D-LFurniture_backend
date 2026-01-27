import { Response } from 'express';
import Furniture from '../models/Furniture.model';
import { sendSuccess, sendError } from '../utils/response';
import { AppError, asyncHandler } from '../middlewares/error.middleware';
import { HTTP_STATUS } from '../utils/constants';
import {
  createFurnitureSchema,
  updateFurnitureSchema,
  furnitureListSchema,
} from '../validations/furniture.validation';
import { AuthRequest } from '../middlewares/auth.middleware';
import { CloudinaryRequest } from '../middlewares/upload.middleware';

type FurnitureRequest = AuthRequest & CloudinaryRequest;

export const getAllFurniture = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const query = furnitureListSchema.parse(req.query);

    let filter: any = {};

    // Category filter
    if (query.category) {
      filter.category = query.category;
    }

    // Price filter
    if (query.minPrice || query.maxPrice) {
      filter.price = {};
      if (query.minPrice) {
        filter.price.$gte = query.minPrice;
      }
      if (query.maxPrice) {
        filter.price.$lte = query.maxPrice;
      }
    }

    // Search filter
    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { description: { $regex: query.search, $options: 'i' } },
      ];
    }

    // Sorting
    let sort: any = { createdAt: -1 };
    if (query.sortBy === 'price') {
      sort = { price: 1 };
    } else if (query.sortBy === 'rating') {
      sort = { rating: -1 };
    } else if (query.sortBy === 'bestsellers') {
      sort = { isBestSeller: -1, reviews: -1 };
    }

    const skip = (query.page - 1) * query.limit;

    const [furniture, total] = await Promise.all([
      Furniture.find(filter)
        .sort(sort)
        .limit(query.limit)
        .skip(skip),
      Furniture.countDocuments(filter),
    ]);

    res.status(HTTP_STATUS.OK).json(
      sendSuccess('Furniture fetched', {
        furniture,
        pagination: {
          total,
          page: query.page,
          limit: query.limit,
          pages: Math.ceil(total / query.limit),
        },
      })
    );
  }
);

export const getFurnitureById = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    if (!id || typeof id !== 'string') {
      throw new AppError('Furniture ID is required', HTTP_STATUS.BAD_REQUEST);
    }

    const furniture = await Furniture.findById(id);
    if (!furniture) {
      throw new AppError('Furniture not found', HTTP_STATUS.NOT_FOUND);
    }

    res.status(HTTP_STATUS.OK).json(sendSuccess('Furniture fetched', furniture));
  }
);
 


export const createFurniture = asyncHandler(
  async (req: FurnitureRequest, res: Response) => {
    const { name, price, mrp, category, discount, stock, description } = req.body;
    
    console.log('Files received:', req.files);
    console.log('Cloudinary URLs:', req.cloudinaryUrls);
    
    const furnitureData = {
      name,
      price: Number(price) || 0,
      mrp: Number(mrp) || 0,
      category,
      discount: Number(discount) || 0,
      stock: Number(stock) || 0,
      description: description || '',
      images: req.cloudinaryUrls || [],
    };

    console.log('Furniture data to save:', furnitureData);

    const furniture = new Furniture(furnitureData);
    await furniture.save();

    res.status(HTTP_STATUS.CREATED).json(
      sendSuccess('Furniture created', furniture)
    );
  }
);

export const updateFurniture = asyncHandler(
  async (req: FurnitureRequest, res: Response) => {
    const id = req.query.id as string;
    
    if (!id) {
      throw new AppError('Furniture ID is required', HTTP_STATUS.BAD_REQUEST);
    }

    const { name, price, mrp, category, discount, stock, description, existingImages } = req.body;

    // Parse existing images from frontend
    let images: string[] = [];
    if (existingImages) {
      images = Array.isArray(existingImages) ? existingImages : [existingImages];
    }

    // Add new uploaded images
    if (req.cloudinaryUrls && req.cloudinaryUrls.length > 0) {
      images = [...images, ...req.cloudinaryUrls];
    }

    const updateData = {
      name,
      price: Number(price) || 0,
      mrp: Number(mrp) || 0,
      category,
      discount: Number(discount) || 0,
      stock: Number(stock) || 0,
      description: description || '',
      images,
    };

    const furniture = await Furniture.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!furniture) {
      throw new AppError('Furniture not found', HTTP_STATUS.NOT_FOUND);
    }

    res.status(HTTP_STATUS.OK).json(
      sendSuccess('Furniture updated', furniture)
    );
  }
);

export const deleteFurniture = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.body ;

    const furniture = await Furniture.findByIdAndDelete(id);
    if (!furniture) {
      throw new AppError('Furniture not found', HTTP_STATUS.NOT_FOUND);
    }

    res.status(HTTP_STATUS.OK).json(sendSuccess('Furniture deleted'));
  }
);
