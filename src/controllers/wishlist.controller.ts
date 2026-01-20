import { Response } from 'express';
import Wishlist from '../models/Wishlist.model';
import Furniture from '../models/Furniture.model';
import { sendSuccess, sendError } from '../utils/response';
import { AppError, asyncHandler } from '../middlewares/error.middleware';
import { HTTP_STATUS } from '../utils/constants';
import { AuthRequest } from '../middlewares/auth.middleware';

export const getWishlist = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    let wishlist = await Wishlist.findOne({
      userId: req.user?.userId,
    }).populate('productIds');

    if (!wishlist) {
      wishlist = new Wishlist({
        userId: req.user?.userId,
        productIds: [],
      });
      await wishlist.save();
    }

    res.status(HTTP_STATUS.OK).json(sendSuccess('Wishlist fetched', wishlist));
  }
);

export const addToWishlist = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { productId } = req.body;

    const furniture = await Furniture.findById(productId);
    if (!furniture) {
      throw new AppError('Product not found', HTTP_STATUS.NOT_FOUND);
    }

    let wishlist = await Wishlist.findOne({ userId: req.user?.userId });
    if (!wishlist) {
      wishlist = new Wishlist({
        userId: req.user?.userId,
        productIds: [],
      });
    }

    if (!wishlist.productIds.includes(productId)) {
      wishlist.productIds.push(productId);
    }

    await wishlist.save();

    res.status(HTTP_STATUS.OK).json(
      sendSuccess('Item added to wishlist', wishlist)
    );
  }
);

export const removeFromWishlist = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { productId } = req.body;

    const wishlist = await Wishlist.findOne({ userId: req.user?.userId });
    if (!wishlist) {
      throw new AppError('Wishlist not found', HTTP_STATUS.NOT_FOUND);
    }

    wishlist.productIds = wishlist.productIds.filter(
      (id) => id.toString() !== productId
    );

    await wishlist.save();

    res.status(HTTP_STATUS.OK).json(
      sendSuccess('Item removed from wishlist', wishlist)
    );
  }
);
