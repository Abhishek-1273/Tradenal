import multer from 'multer';
import { Request, Response, NextFunction } from 'express';
import { cloudinary } from '../config/cloudinary';
import { sendBadRequest } from '../utils/apiResponse';
import { v2 as cloudinaryV2 } from 'cloudinary';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Memory storage — we'll stream to Cloudinary
const storage = multer.memoryStorage();

const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
): void => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, and WebP images are allowed'));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
});

export const uploadToCloudinary = async (
  file: Express.Multer.File,
  folder: string,
  userId: string
): Promise<{ url: string; publicId: string }> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinaryV2.uploader.upload_stream(
      {
        folder: `trading-journal/${userId}/${folder}`,
        resource_type: 'image',
        transformation: [
          { quality: 'auto:good' },
          { fetch_format: 'auto' },
        ],
      },
      (error, result) => {
        if (error) return reject(error);
        if (!result) return reject(new Error('Upload failed'));
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    uploadStream.end(file.buffer);
  });
};

export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
  await cloudinaryV2.uploader.destroy(publicId);
};

// Middleware to handle multer errors
export const handleUploadError = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      sendBadRequest(res, 'File too large. Maximum size is 10MB');
      return;
    }
    sendBadRequest(res, err.message);
    return;
  }
  if (err.message === 'Only JPEG, PNG, and WebP images are allowed') {
    sendBadRequest(res, err.message);
    return;
  }
  next(err);
};
