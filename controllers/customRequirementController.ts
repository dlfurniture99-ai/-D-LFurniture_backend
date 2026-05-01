import { Request, Response } from 'express';
import CustomRequirement from '../models/CustomRequirement';

export const customRequirementController = {
  /**
   * Submit a new custom requirement (Public)
   */
  async submit(req: Request, res: Response): Promise<void> {
    try {
      const requirementData = req.body;
      
      const newRequirement = new CustomRequirement(requirementData);
      await newRequirement.save();

      res.status(201).json({
        success: true,
        message: 'Your requirement has been submitted successfully. We will get back to you soon.',
        data: newRequirement
      });
    } catch (error: any) {
      console.error('Submit requirement error:', error);
      res.status(400).json({
        success: false,
        message: 'Failed to submit requirement',
        error: error.message,
        details: error.errors // Include mongoose validation details if any
      });
    }
  },

  /**
   * Get all custom requirements (Admin)
   */
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const { page = 1, limit = 10, status, inquiryType, search } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      // Build filter
      const filter: any = {};
      if (status) filter.status = status;
      if (inquiryType) filter.inquiryType = inquiryType;
      
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
          { message: { $regex: search, $options: 'i' } }
        ];
      }

      const requirements = await CustomRequirement.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit));

      const total = await CustomRequirement.countDocuments(filter);

      res.status(200).json({
        success: true,
        data: requirements,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error: any) {
      console.error('Get requirements error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch requirements',
        error: error.message
      });
    }
  },

  /**
   * Update requirement status (Admin)
   */
  async updateStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status, adminNotes } = req.body;

      const requirement = await CustomRequirement.findByIdAndUpdate(
        id,
        { status, adminNotes },
        { new: true, runValidators: true }
      );

      if (!requirement) {
        res.status(404).json({ success: false, message: 'Requirement not found' });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Status updated successfully',
        data: requirement
      });
    } catch (error: any) {
      console.error('Update status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update status',
        error: error.message
      });
    }
  }
};
