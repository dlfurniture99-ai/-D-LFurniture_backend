import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import cloudinary from '../config/cloudinary';

const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
  },
});

export interface CloudinaryRequest extends Request {
  cloudinaryUrls?: string[];
}

export const uploadToCloudinary = async (
  req: CloudinaryRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const files = req.files as Express.Multer.File[];
    
    console.log('Upload middleware - files received:', files?.length || 0);
    console.log('Upload middleware - req.files:', req.files);
    console.log('Upload middleware - req.file:', req.file);
    
    if (files && files.length > 0) {
      console.log('Uploading', files.length, 'files to Cloudinary...');
      
      const uploadPromises = files.map(async (file) => {
        console.log('Uploading file:', file.originalname, file.mimetype, file.size);
        const b64 = Buffer.from(file.buffer).toString('base64');
        const dataURI = 'data:' + file.mimetype + ';base64,' + b64;
        const result = await cloudinary.uploader.upload(dataURI, {
          folder: 'furniture',
        });
        console.log('Uploaded to:', result.secure_url);
        return result.secure_url;
      });
      
      req.cloudinaryUrls = await Promise.all(uploadPromises);
      console.log('All uploads complete:', req.cloudinaryUrls);
    } else {
      console.log('No files to upload');
    }
    next();
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    next(error);
  }
};
