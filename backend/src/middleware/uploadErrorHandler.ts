import { Request, Response, NextFunction } from 'express';
import multer from 'multer';

export const handleMulterError = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        message: 'Validation error',
        error: 'File size exceeds the allowed limit.'
      });
    }
    return res.status(400).json({
      message: 'File upload error',
      error: err.message
    });
  } else if (err && typeof err.message === 'string' && err.message.startsWith('FORMAT_NOT_ALLOWED')) {
    const errorDetails = err.message.replace('FORMAT_NOT_ALLOWED: ', '');
    return res.status(400).json({
      message: 'Validation error',
      error: errorDetails
    });
  }

  next(err);
};