import multer from 'multer';
import { Request, Response, NextFunction } from 'express';
import { cloudinary } from '../config/cloudinary';
import { sendBadRequest } from '../utils/apiResponse';
import { v2 as cloudinaryV2 } from 'cloudinary';
import fs from 'fs';
import path from 'path';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
  'application/octet-stream',
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Memory storage — we'll stream to Cloudinary
const storage = multer.memoryStorage();

const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
): void => {
  // Relax validation to allow common image extensions
  const ext = path.extname(file.originalname).toLowerCase();
  const isImageExt = ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif'].includes(ext);

  if (ALLOWED_MIME_TYPES.includes(file.mimetype) || isImageExt) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, WebP, and HEIC images are allowed'));
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
  try {
    const res = await new Promise<{ url: string; publicId: string }>((resolve, reject) => {
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
    return res;
  } catch (err) {
    // Cloudinary failed/403, fallback to local uploads folder
    const uploadsDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    const ext = path.extname(file.originalname) || '.jpg';
    const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    const filePath = path.join(uploadsDir, filename);
    
    fs.writeFileSync(filePath, file.buffer);
    
    return {
      url: `/uploads/${filename}`,
      publicId: filename,
    };
  }
};

export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
  const uploadsDir = path.join(__dirname, '../../uploads');
  const filePath = path.join(uploadsDir, publicId);
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
      return;
    } catch (e) {
      // Ignore
    }
  }
  try {
    await cloudinaryV2.uploader.destroy(publicId);
  } catch (err) {
    // Ignore Cloudinary error on deletion
  }
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
  if (err.message === 'Only JPEG, PNG, WebP, and HEIC images are allowed') {
    sendBadRequest(res, err.message);
    return;
  }
  next(err);
};
