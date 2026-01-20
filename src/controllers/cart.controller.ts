import { Response } from 'express';
import Cart from '../models/Cart.model';
import Furniture from '../models/Furniture.model';
import { sendSuccess, sendError } from '../utils/response';
import { AppError, asyncHandler } from '../middlewares/error.middleware';
import { HTTP_STATUS } from '../utils/constants';
import { AuthRequest } from '../middlewares/auth.middleware';

export const getCart = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    let cart = await Cart.findOne({ userId: req.user?.userId }).populate(
      'items.productId'
    );

    if (!cart) {
      cart = new Cart({ userId: req.user?.userId, items: [], total: 0 });
      await cart.save();
    }

    res.status(HTTP_STATUS.OK).json(sendSuccess('Cart fetched', cart));
  }
);

export const addToCart = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { productId, quantity = 1 } = req.body;

    const furniture = await Furniture.findById(productId);
    if (!furniture) {
      throw new AppError('Product not found', HTTP_STATUS.NOT_FOUND);
    }

    let cart = await Cart.findOne({ userId: req.user?.userId });
    if (!cart) {
      cart = new Cart({
        userId: req.user?.userId,
        items: [],
        total: 0,
      });
    }

    const existingItem = cart.items.find(
      (item) => item.productId.toString() === productId
    );

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({
        productId,
        quantity,
        price: furniture.price,
      });
    }

    await cart.save();

    res.status(HTTP_STATUS.OK).json(
      sendSuccess('Item added to cart', cart)
    );
  }
);

export const updateCartItem = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { productId } = req.body
    const { quantity } = req.body;

    if (quantity < 0) {
      throw new AppError('Invalid quantity', HTTP_STATUS.BAD_REQUEST);
    }

    const cart = await Cart.findOne({ userId: req.user?.userId });
    if (!cart) {
      throw new AppError('Cart not found', HTTP_STATUS.NOT_FOUND);
    }

    if (quantity === 0) {
      cart.items = cart.items.filter(
        (item) => item.productId.toString() !== productId
      );
    } else {
      const item = cart.items.find(
        (item) => item.productId.toString() === productId
      );
      if (!item) {
        throw new AppError('Item not found in cart', HTTP_STATUS.NOT_FOUND);
      }
      item.quantity = quantity;
    }

    await cart.save();

    res.status(HTTP_STATUS.OK).json(
      sendSuccess('Cart updated', cart)
    );
  }
);

export const removeFromCart = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { productId } = req.body

    const cart = await Cart.findOne({ userId: req.user?.userId });
    if (!cart) {
      throw new AppError('Cart not found', HTTP_STATUS.NOT_FOUND);
    }

    cart.items = cart.items.filter(
      (item) => item.productId.toString() !== productId
    );

    await cart.save();

    res.status(HTTP_STATUS.OK).json(
      sendSuccess('Item removed from cart', cart)
    );
  }
);

export const clearCart = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const cart = await Cart.findOne({ userId: req.user?.userId });
    if (!cart) {
      throw new AppError('Cart not found', HTTP_STATUS.NOT_FOUND);
    }

    cart.items = [];
    cart.total = 0;
    await cart.save();

    res.status(HTTP_STATUS.OK).json(sendSuccess('Cart cleared'));
  }
);
