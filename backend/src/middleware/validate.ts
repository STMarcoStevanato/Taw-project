import { ZodSchema, ZodError } from "zod"; // <-- Importa ZodError
import { Request, Response, NextFunction } from "express";

export const validate =
  (schema: ZodSchema) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        params: req.params,
        query: req.query,
      });
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