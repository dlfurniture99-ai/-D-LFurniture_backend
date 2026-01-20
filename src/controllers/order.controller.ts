import { Response } from 'express';
import Order from '../models/Order.model';
import Cart from '../models/Cart.model';
import { sendSuccess, sendError } from '../utils/response';
import { AppError, asyncHandler } from '../middlewares/error.middleware';
import { HTTP_STATUS, ORDER_STATUS } from '../utils/constants';
import { createOrderSchema, updateOrderStatusSchema } from '../validations/order.validation';
import { AuthRequest } from '../middlewares/auth.middleware';

export const createOrder = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const body = createOrderSchema.parse(req.body);

    const cart = await Cart.findOne({ userId: req.user?.userId });
    if (!cart || cart.items.length === 0) {
      throw new AppError('Cart is empty', HTTP_STATUS.BAD_REQUEST);
    }

    const order = new Order({
      userId: req.user?.userId,
      items: cart.items,
      total: cart.total,
      shippingAddress: body,
      status: ORDER_STATUS.PENDING,
    });

    await order.save();

    // Clear cart
    cart.items = [];
    cart.total = 0;
    await cart.save();

    res.status(HTTP_STATUS.CREATED).json(
      sendSuccess('Order created', order)
    );
  }
);

export const getUserOrders = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const orders = await Order.find({ userId: req.user?.userId }).sort({
      createdAt: -1,
    });

    res.status(HTTP_STATUS.OK).json(sendSuccess('Orders fetched', orders));
  }
);

export const getOrderById = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const order = await Order.findById(id);
    if (!order) {
      throw new AppError('Order not found', HTTP_STATUS.NOT_FOUND);
    }

    // Check if user owns this order
    if (order.userId.toString() !== req.user?.userId && req.user?.role !== 'admin') {
      throw new AppError('Access denied', HTTP_STATUS.FORBIDDEN);
    }

    res.status(HTTP_STATUS.OK).json(sendSuccess('Order fetched', order));
  }
);

export const updateOrderStatus = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const body = updateOrderStatusSchema.parse(req.body);

    const order = await Order.findByIdAndUpdate(
      id,
      { status: body.status },
      { new: true, runValidators: true }
    );

    if (!order) {
      throw new AppError('Order not found', HTTP_STATUS.NOT_FOUND);
    }

    res.status(HTTP_STATUS.OK).json(
      sendSuccess('Order status updated', order)
    );
  }
);

export const getAllOrders = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find()
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip),
      Order.countDocuments(),
    ]);

    res.status(HTTP_STATUS.OK).json(
      sendSuccess('Orders fetched', {
        orders,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      })
    );
  }
);
