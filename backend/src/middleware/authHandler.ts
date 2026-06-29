import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { UserWithRole } from "../types/user";

const JWT_SECRET = process.env.JWT_SECRET as string;

// Let's extend the Express Request interface just for this file to support a typed `req.user`.
interface AuthenticatedRequest extends Request {
  user?: UserWithRole;
}

export const isAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {

  const token = req.cookies["access_token"];
  const csrfCookie = req.cookies["XSRF-TOKEN"];
  const csrfHeader = req.headers["x-xsrf-token"]; 

  if (!token) {
    const error = new Error("Unauthorized: Missing authentication token") as any;
    error.statusCode = 401;
    return next(error);
  }

 
  if (["POST", "PUT", "DELETE"].includes(req.method)) {
    if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
      const error = new Error("Forbidden: CSRF token validation failed") as any;
      error.statusCode = 403; 
      return next(error);
    }
  }

  try {
    
    const decoded = jwt.verify(token, JWT_SECRET) as { user_id: string; role: string };

    req.user = {
      user_id: Number(decoded.user_id),
      role: decoded.role as "students" | "staff" | "referents" | "none",
      name: "",     
      lastname: "",
      email: ""
    };

    next(); 
  } catch (err) {
    const error = new Error("Unauthorized: Invalid or expired token") as any;
    error.statusCode = 401;
    return next(error);
  }
};