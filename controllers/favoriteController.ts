import { Request, Response } from 'express';
import User from '../models/User';
import Product from '../models/Product';

export const favoriteController = {
  /**
    * Get all user favorites
    */
  async getAll(req: any, res: Response): Promise<any> {
    try {
      const user = await User.findById(req.userId).populate('favorites');
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      res.json({ success: true, favorites: user.favorites });
    } catch (error) {
      console.error('Get favorites error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch favorites' });
    }
  },

  /**
    * Add product to favorites
    */
  async add(req: any, res: Response): Promise<any> {
    try {
      const { productId } = req.params;

      // Verify product exists
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }

      // Add to favorites
      const user = await User.findByIdAndUpdate(
        req.userId,
        { $addToSet: { favorites: productId } },
        { new: true }
      ).populate('favorites');

      res.json({ success: true, message: 'Added to favorites', favorites: user?.favorites });
    } catch (error) {
      console.error('Add favorite error:', error);
      res.status(500).json({ success: false, message: 'Failed to add favorite' });
    }
  },

  /**
    * Remove product from favorites
    */
  async remove(req: any, res: Response): Promise<any> {
    try {
      const { productId } = req.params;

      const user = await User.findByIdAndUpdate(
        req.userId,
        { $pull: { favorites: productId } },
        { new: true }
      ).populate('favorites');

      res.json({ success: true, message: 'Removed from favorites', favorites: user?.favorites });
    } catch (error) {
      console.error('Remove favorite error:', error);
      res.status(500).json({ success: false, message: 'Failed to remove favorite' });
    }
  },

  /**
    * Check if product is in favorites
    */
  async checkIsFavorite(req: any, res: Response): Promise<any> {
    try {
      const user = await User.findById(req.userId);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      const isFavorite = user.favorites.includes(req.params.productId);
      res.json({ success: true, isFavorite });
    } catch (error) {
      console.error('Check favorite error:', error);
      res.status(500).json({ success: false, message: 'Failed to check favorite status' });
    }
  }
};
