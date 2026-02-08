import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define upload directories
const avatarDir = path.join(__dirname, '../../uploads/avatars');
const postDir = path.join(__dirname, '../../uploads/posts');

// Ensure directories exist
[avatarDir, postDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure storage
const createStorage = (destDir) => multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, destDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

// File filter (Images only)
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Not an image! Please upload an image.'), false);
  }
};

// Exports
export const uploadAvatar = multer({
  storage: createStorage(avatarDir),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter,
});

export const uploadPostImage = multer({
  storage: createStorage(postDir),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter,
});
