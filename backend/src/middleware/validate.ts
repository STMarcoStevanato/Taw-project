import { ZodSchema, ZodError } from "zod"; 
import { Request, Response, NextFunction } from "express";

export const validate =
  (schema: ZodSchema) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse({
        body: req.body,
        params: req.params,
        query: req.query,
        file: req.file, 
      }) as { body?: any; params?: any; query?: any; file?: any };

      
      if (validated.params) req.params = validated.params;
      if (validated.body) req.body = validated.body;
      if (validated.query) req.query = validated.query;
      next();
    } catch (err) {

      if (err instanceof ZodError) {
        return res.status(400).json({
          message: "Validation error",
          errors: err.format(), 
        });
      }

      return res.status(500).json({
        message: "Internal server error during validation",
      });
    }
  };