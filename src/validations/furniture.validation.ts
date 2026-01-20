import { z } from 'zod';

export const createFurnitureSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  price: z.number().positive('Price must be positive'),
  mrp: z.number().positive('MRP must be positive'),
  category: z.string().min(1, 'Category is required'),
  description: z.string().optional(),
  image: z.string().optional(),
  images: z.array(z.string()).optional(),
  discount: z.number().min(0).max(100).optional(),
  rating: z.number().min(0).max(5).optional(),
  reviews: z.number().min(0).optional(),
  badge: z.string().optional(),
  isBestSeller: z.boolean().optional(),
  emiText: z.string().optional(),
  stock: z.number().min(0).optional(),
});

export const updateFurnitureSchema = createFurnitureSchema.partial();

export const furnitureListSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  category: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  search: z.string().optional(),
  sortBy: z.enum(['price', 'rating', 'newest', 'bestsellers']).optional(),
});

export type CreateFurnitureRequest = z.infer<typeof createFurnitureSchema>;
export type UpdateFurnitureRequest = z.infer<typeof updateFurnitureSchema>;
export type FurnitureListQuery = z.infer<typeof furnitureListSchema>;
