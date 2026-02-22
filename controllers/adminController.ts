import { Request, Response } from 'express';
import DeliveryBoy from '../models/DeliveryBoy';

export const adminController = {
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
