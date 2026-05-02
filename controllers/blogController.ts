import { Request, Response } from 'express';
import Blog from '../models/blogModel';

export const blogController = {
  // Create a new blog
  async create(req: Request, res: Response) {
    try {
      const { title, content, image, category, tags, author, isPublished } = req.body;
      
      const newBlog = new Blog({
        title,
        content,
        image,
        category,
        tags: tags || [],
        author: author || 'Admin',
        isPublished: isPublished !== undefined ? isPublished : true
      });

      await newBlog.save();
      return res.status(201).json({ success: true, message: 'Blog created successfully', blog: newBlog });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  },

  // Get all blogs (for admin)
  async getAll(req: Request, res: Response) {
    try {
      const blogs = await Blog.find().sort({ createdAt: -1 });
      return res.status(200).json({ success: true, blogs });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  },

  // Get single blog by slug
  async getBySlug(req: Request, res: Response) {
    try {
      const blog = await Blog.findOne({ slug: req.params.slug });
      if (!blog) return res.status(404).json({ success: false, message: 'Blog not found' });
      return res.status(200).json({ success: true, blog });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  },

  // Update blog
  async update(req: Request, res: Response) {
    try {
      const updatedBlog = await Blog.findByIdAndUpdate(
        req.params.id,
        { $set: req.body },
        { new: true, runValidators: true }
      );
      if (!updatedBlog) return res.status(404).json({ success: false, message: 'Blog not found' });
      return res.status(200).json({ success: true, message: 'Blog updated successfully', blog: updatedBlog });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  },

  // Delete blog
  async delete(req: Request, res: Response) {
    try {
      const blog = await Blog.findByIdAndDelete(req.params.id);
      if (!blog) return res.status(404).json({ success: false, message: 'Blog not found' });
      return res.status(200).json({ success: true, message: 'Blog deleted successfully' });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
};
