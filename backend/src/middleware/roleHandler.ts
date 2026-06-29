import { Request, Response, NextFunction } from "express";
import { UserWithRole } from "../types/user";

interface AuthenticatedRequest extends Request {
  user?: UserWithRole;
}

export const hasRole = (allowedRoles: ("students" | "staff" | "referents")[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    
    if (!req.user) {
      const error = new Error("Unauthorized: User data not found") as any;
      error.statusCode = 401;
      return next(error);
    }

    if (!allowedRoles.includes(req.user.role as any)) {
      const error = new Error("Forbidden: You do not have the permission to access this resource") as any;
      error.statusCode = 403; 
      return next(error);
    }

    next();
  };
};