import { Request, Response } from 'express';
import DeliveryBoy from '../models/DeliveryBoy';
import User from '../models/User';
import Booking from '../models/Booking';

export const adminController = {
   /**
    * Get all customers (users)
    */
   async getAllCustomers(req: Request, res: Response): Promise<void> {
     try {
       const { page = 1, limit = 10, search = '' } = req.query;
       const skip = (Number(page) - 1) * Number(limit);

       // Build search filter
       const filter: any = {};
       if (search) {
         filter.$or = [
           { name: { $regex: search, $options: 'i' } },
           { email: { $regex: search, $options: 'i' } },
           { phone: { $regex: search, $options: 'i' } }
         ];
       }

       // Fetch users with pagination
       const users = await User.find(filter)
         .select('-password -otp -otpExpires')
         .populate('bookings', 'totalPrice createdAt')
         .sort({ createdAt: -1 })
         .skip(skip)
         .limit(Number(limit));

       // Calculate total spent and order count for each user
       const customersWithStats = await Promise.all(
         users.map(async (user) => {
           const bookings = await Booking.find({ userId: user._id });
           const totalSpent = bookings.reduce((sum, booking) => sum + (booking.totalPrice || 0), 0);
           
           return {
             _id: user._id,
             name: user.name,
             email: user.email,
             phone: user.phone || 'N/A',
             totalOrders: bookings.length,
             totalSpent,
             joinDate: user.createdAt,
             isActive: user.isActive,
             isVerified: user.isVerified
           };
         })
       );

       const total = await User.countDocuments(filter);

       res.status(200).json({
         success: true,
         users: customersWithStats,
         pagination: {
           total,
           page: Number(page),
           limit: Number(limit),
           pages: Math.ceil(total / Number(limit))
         }
       });
     } catch (error) {
       console.error('Get customers error:', error);
       res.status(500).json({
         success: false,
         message: 'Failed to fetch customers',
         error: error instanceof Error ? error.message : 'Unknown error'
       });
     }
   },

   /**
    * Get all delivery boys
    */
  async getAllDeliveryBoys(req: Request, res: Response): Promise<void> {
    try {
      const deliveryBoys = await DeliveryBoy.find()
        .select('-emailVerificationOtp -emailVerificationOtpExpires -emailVerificationLoginOtp -emailVerificationLoginOtpExpires')
        .sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        data: deliveryBoys
      });
    } catch (error) {
      console.error('Get delivery boys error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch delivery boys',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },

  /**
   * Get delivery boy by ID
   */
  async getDeliveryBoyById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const deliveryBoy = await DeliveryBoy.findById(id)
        .select('-emailVerificationOtp -emailVerificationOtpExpires -emailVerificationLoginOtp -emailVerificationLoginOtpExpires');

      if (!deliveryBoy) {
        res.status(404).json({ success: false, message: 'Delivery boy not found' });
        return;
      }

      res.status(200).json({
        success: true,
        data: deliveryBoy
      });
    } catch (error) {
      console.error('Get delivery boy error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch delivery boy',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },

  /**
   * Delete delivery boy
   */
  async deleteDeliveryBoy(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const deliveryBoy = await DeliveryBoy.findByIdAndDelete(id);

      if (!deliveryBoy) {
        res.status(404).json({ success: false, message: 'Delivery boy not found' });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Delivery boy deleted successfully'
      });
    } catch (error) {
      console.error('Delete delivery boy error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete delivery boy',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },

  /**
   * Deactivate delivery boy (soft delete)
   */
  async deactivateDeliveryBoy(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const deliveryBoy = await DeliveryBoy.findByIdAndUpdate(
        id,
        { isActive: false },
        { new: true }
      );

      if (!deliveryBoy) {
        res.status(404).json({ success: false, message: 'Delivery boy not found' });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Delivery boy deactivated successfully',
        data: deliveryBoy
      });
    } catch (error) {
      console.error('Deactivate delivery boy error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to deactivate delivery boy',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },

  /**
   * Activate delivery boy
   */
  async activateDeliveryBoy(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const deliveryBoy = await DeliveryBoy.findByIdAndUpdate(
        id,
        { isActive: true },
        { new: true }
      );

      if (!deliveryBoy) {
        res.status(404).json({ success: false, message: 'Delivery boy not found' });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Delivery boy activated successfully',
        data: deliveryBoy
      });
    } catch (error) {
      console.error('Activate delivery boy error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to activate delivery boy',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
};
