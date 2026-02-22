import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
  width: number;
  height: number;
  format: string;
}

/**
 * Upload a single image from data URL (base64) to Cloudinary
 * @param dataUrl - Base64 encoded image data URL
 * @returns Promise with the secure URL from Cloudinary
 */
export const uploadImageFromDataUrl = async (
  dataUrl: string
): Promise<string> => {
  try {
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY) {
      throw new Error('Cloudinary configuration is missing');
    }

    const result = await cloudinary.uploader.upload(dataUrl, {
      folder: 'furniture-products',
      resource_type: 'auto',
    });

    return (result as CloudinaryUploadResponse).secure_url;
  } catch (error) {
    console.error('Error uploading image to Cloudinary:', error);
    throw error;
  }
};

/**
 * Upload multiple images from data URLs (base64) to Cloudinary
 * @param dataUrls - Array of base64 encoded image data URLs
 * @returns Promise with array of secure URLs from Cloudinary
 */
export const uploadMultipleImagesFromDataUrls = async (
  dataUrls: string[]
): Promise<string[]> => {
  try {
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY) {
      throw new Error('Cloudinary configuration is missing');
    }

    const uploadPromises = dataUrls.map((dataUrl) =>
      uploadImageFromDataUrl(dataUrl)
    );
    const secureUrls = await Promise.all(uploadPromises);
    return secureUrls;
  } catch (error) {
    console.error('Error uploading multiple images from data URLs:', error);
    throw error;
  }
};

/**
 * Delete an image from Cloudinary
 * @param publicId - Public ID of the image to delete
 * @returns Promise with deletion result
 */
export const deleteImage = async (publicId: string): Promise<any> => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error);
    throw error;
  }
};

/**
 * Delete multiple images from Cloudinary
 * @param publicIds - Array of public IDs to delete
 * @returns Promise with deletion results
 */
export const deleteMultipleImages = async (
  publicIds: string[]
): Promise<any[]> => {
  try {
    const deletePromises = publicIds.map((id) => deleteImage(id));
    const results = await Promise.all(deletePromises);
    return results;
  } catch (error) {
    console.error('Error deleting multiple images:', error);
    throw error;
  }
};

/**
 * Extract public ID from Cloudinary URL
 * @param url - Cloudinary image URL
 * @returns Public ID
 */
export const extractPublicIdFromUrl = (url: string): string => {
  const match = url.match(/\/([^/]+)\.[a-z]+$/i);
  return match ? match[1] : '';
};

export default {
  uploadImageFromDataUrl,
  uploadMultipleImagesFromDataUrls,
  deleteImage,
  deleteMultipleImages,
  extractPublicIdFromUrl,
};
