import multer, { Options, FileFilterCallback } from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';

interface UploadOptions {
  fieldName: string;          // Name of the key sent in the form data
  folderName: string;         // Name of the subfolder in /uploads/
  maxSizeMB?: number;         // Size limit (default: 10MB)
  allowedMimetypes?: string[];// Allowed MIME types (default: PDF only)
}


export const createPdfUploader = ({
  fieldName,
  folderName,
  maxSizeMB = 10,
  allowedMimetypes = ['application/pdf']
}: UploadOptions) => {

  // 1. Dynamic Storage Configuration
  const storage = multer.diskStorage({
    destination: (req: Request, _file: Express.Multer.File, cb) => {
      const uploadPath = path.join(process.cwd(), 'uploads', folderName);

      // Create the folder if it doesn't exist
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }

      cb(null, uploadPath);
    },

    filename: (req: Request, file: Express.Multer.File, cb) => {
      const versionId = req.params.versionId || 'unknown';
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const ext = path.extname(file.originalname);
      
      // name file: doc-v{versionId}-{timestamp}-{random}.pdf
      cb(null, `doc-v${versionId}-${uniqueSuffix}${ext}`);
    }
  });

  // 2. Dynamic Format Filter
  const fileFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    if (allowedMimetypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`FORMAT_NOT_ALLOWED: Only ${allowedMimetypes.join(', ')} files are allowed.`));
    }
  };

  // 3. Multer Petition
  const upload = multer({
    storage,
    fileFilter,
    limits: {
      fileSize: maxSizeMB * 1024 * 1024
    }
  });

  // The middleware returns the value configured for the required field
  return upload.single(fieldName);
};