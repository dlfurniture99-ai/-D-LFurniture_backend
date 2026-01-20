import { Response } from 'express';
import User from '../models/User.model';
import Order from '../models/Order.model';
import Wishlist from '../models/Wishlist.model';
import { sendSuccess } from '../utils/response';
import { AppError, asyncHandler } from '../middlewares/error.middleware';
import { HTTP_STATUS } from '../utils/constants';
import { AuthRequest } from '../middlewares/auth.middleware';

export const getUserProfile = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    console.log(req.user);
    const user = await User.findById(req.user?.userId);
    if (!user) {
      throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
    }
    res.status(HTTP_STATUS.OK).json(sendSuccess('User profile fetched', user));
  }
);

export const getUserOrders = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const orders = await Order.find({ userId: req.user?.userId }).sort({ createdAt: -1 });
    res.status(HTTP_STATUS.OK).json(sendSuccess('User orders fetched', orders));
  }
);

export const getUserWishlist = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const wishlist = await Wishlist.findOne({ userId: req.user?.userId }).populate('productIds');
    res.status(HTTP_STATUS.OK).json(sendSuccess('User wishlist fetched', wishlist));
  }
);

// Aggregated endpoint to fetch all user data in one call
export const getUserDashboard = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user?.userId;

    const [user, orders, wishlist] = await Promise.all([
      User.findById(userId),
      Order.find({ userId }).sort({ createdAt: -1 }),
      Wishlist.findOne({ userId }).populate('productIds')
    ]);

    if (!user) {
      throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
    }

    // If wishlist doesn't exist, return null or empty structure
    const wishlistData = wishlist || { productIds: [] };

    res.status(HTTP_STATUS.OK).json(
      sendSuccess('User dashboard data fetched', {
        profile: user,
        orders: orders || [],
        wishlist: wishlistData,
        stats: {
          totalOrders: orders.length,
          wishlistCount: wishlistData.productIds.length
        }
      })
    );
  }
);