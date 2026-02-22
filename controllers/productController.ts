import { Request, Response } from 'express';
import Product from '../models/Product';
import { uploadImageFromDataUrl, uploadMultipleImagesFromDataUrls } from '../services/cloudinaryService';

// Get all visible products (public endpoint)
export const getAllProducts = async (req: Request, res: Response) => {
  try {
    const { category, search, page = 1, limit = 10 } = req.query;

    // Check if this is an admin request by looking at the URL
    const isAdmin = req.path?.includes('/admin/all');
    const filter: any = isAdmin ? {} : { isVisible: true };
    
    if (category) filter.category = category;
    if (search) filter.name = { $regex: search, $options: 'i' };

    const skip = (Number(page) - 1) * Number(limit);

    const products = await Product.find(filter)
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    const total = await Product.countDocuments(filter);

    res.json({
      success: true,
      products,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch products' });
  }
};

// Get product details
export const getProductById = async (req: Request, res: Response) => {
  try {
     const product = await Product.findById(req.params.id);
    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }
    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch product' });
  }
};

// Admin: Create product
export const createProduct = async (req: any, res: Response) => {
  try {    
    const { 
      name, 
      shortDescription,
      fullDescription,
      category, 
      price, 
      discountPercentage,
      finalPrice,
      images,
      stock, 
      specifications,
      brand,
      sku,
      weight,
      dimensions,
      material,
      warranty,
      returnPolicy,
      colors,
      finishes,
      isVisible
    } = req.body;


    // Validate required fields
    const errors: string[] = [];
    if (!name || (typeof name === 'string' && !name.trim())) {
      errors.push(`name (received: ${name})`);
    }
    if (!fullDescription && !shortDescription) {
      errors.push(`description (fullDescription: ${fullDescription}, shortDescription: ${shortDescription})`);
    }
    if (!category) {
      errors.push(`category (received: ${category})`);
    }
    if (price === undefined || price === null || price === '') {
      errors.push(`price (received: ${price})`);
    }
    if (stock === undefined || stock === null || stock === '') {
      errors.push(`stock (received: ${stock})`);
    }

    if (errors.length > 0) {
      console.log('Validation errors:', errors);
      res.status(400).json({
        success: false,
        message: `Missing required fields: ${errors.join(', ')}`
      });
      return;
    }

    // Upload images to Cloudinary
    let cloudinaryImageUrls: string[] = [];
    if (images && images.length > 0) {
      try {
        cloudinaryImageUrls = await uploadMultipleImagesFromDataUrls(images);
      } catch (uploadError) {
        res.status(400).json({ 
          success: false,
          message: 'Failed to upload images to Cloudinary',
          error: uploadError 
        });
        return;
      }
    }

    // Create product with Cloudinary image URLs
    const product = new Product({
      name: name.trim(),
      slug: name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, ''),
      description: fullDescription || shortDescription || '',
      category,
      price: parseFloat(price),
      discountPercentage: discountPercentage || 0,
      finalPrice: finalPrice || parseFloat(price),
      image: cloudinaryImageUrls.length > 0 ? cloudinaryImageUrls[0] : '',
      images: cloudinaryImageUrls.length > 0 ? cloudinaryImageUrls : [],
      stock: parseInt(stock),
      specifications: specifications?.filter((s: any) => s.key && s.value) || [],
      brand: brand || '',
      sku: sku || '',
      weight: weight || '',
      dimensions: dimensions || '',
      material: material || '',
      warranty: warranty || '',
      returnPolicy: returnPolicy || '30 days',
      colors: colors || [],
      finishes: finishes || [],
      createdBy: req.userId,
      isVisible: isVisible !== undefined ? isVisible : true,
      rating: 0,
      reviews: []
    });

    await product.save();
    console.log('Product created successfully:', { id: product._id, name: product.name, isVisible: product.isVisible });
    res.status(201).json({ 
      success: true, 
      message: 'Product created successfully', 
      product 
    });
    } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create product', 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    }
    };

// Admin: Update product
export const updateProduct = async (req: any, res: Response) => {
  try {
    const {
      name,
      description,
      fullDescription,
      shortDescription,
      category,
      price,
      discountPercentage,
      finalPrice,
      image,
      images,
      stock,
      isVisible,
      specifications,
      brand,
      sku,
      weight,
      dimensions,
      material,
      warranty,
      returnPolicy,
      colors,
      finishes
    } = req.body;

    // Handle image uploads for new images (base64 format)
    let cloudinaryImageUrls = images || [];
    const existingImages = images?.filter((img: string) => !img.startsWith('data:')) || [];
    const newImages = images?.filter((img: string) => img.startsWith('data:')) || [];
    
    if (newImages.length > 0) {
      try {
        const uploadedUrls = await uploadMultipleImagesFromDataUrls(newImages);
        cloudinaryImageUrls = [...existingImages, ...uploadedUrls];
      } catch (uploadError) {
        res.status(400).json({ 
          success: false,
          message: 'Failed to upload images to Cloudinary',
          error: uploadError 
        });
        return;
      }
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      {
        name,
        slug: name?.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, ''),
        description: fullDescription || shortDescription || description,
        category,
        price,
        discountPercentage,
        finalPrice,
        image: cloudinaryImageUrls?.[0] || image,
        images: cloudinaryImageUrls.length > 0 ? cloudinaryImageUrls : (image ? [image] : []),
        stock,
        isVisible,
        specifications: specifications || [],
        brand,
        sku,
        weight,
        dimensions,
        material,
        warranty,
        returnPolicy,
        colors,
        finishes
      },
      { new: true, runValidators: true }
    );

    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }

    res.json({ success: true, product });
  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({ success: false, message: 'Failed to update product', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

// Admin: Delete product
export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }
    res.json({ success: true, message: 'Product deleted' });
    } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete product' });
    }
    };

// Admin: Toggle product visibility
export const toggleProductVisibility = async (req: Request, res: Response) => {
  try {
    const { isVisible } = req.body;
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { isVisible },
      { new: true }
    );
    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update visibility' });
  }
};

// Add review
export const addProductReview = async (req: any, res: Response) => {
  try {
    const { rating, comment } = req.body;
    console.log('Adding review - Product ID:', req.params.id);
    console.log('Review data:', { rating, comment });
    console.log('User ID:', req.userId);

    const product = await Product.findById(req.params.id);

    if (!product) {
      console.error('Product not found:', req.params.id);
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }

    // Validate rating and comment
    if (!rating || !comment || !comment.trim()) {
      res.status(400).json({ success: false, message: 'Rating and comment are required' });
      return;
    }

    product.reviews.push({
      userId: req.userId,
      userName: req.user?.name || 'Anonymous',
      rating: parseInt(rating),
      comment: comment.trim(),
      createdAt: new Date()
    });

    const avgRating = product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length;
    product.rating = avgRating;

    await product.save();
    console.log('Review added successfully');
    res.json({ success: true, message: 'Review added successfully', product });
    } catch (error) {
    console.error('Error adding review:', error);
    res.status(500).json({ success: false, message: 'Failed to add review', error: error instanceof Error ? error.message : 'Unknown error' });
    }
    };
