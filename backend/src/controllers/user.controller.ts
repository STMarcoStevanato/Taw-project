import { Request, Response, NextFunction } from "express";
import * as userService from "../services/user.service";
import { CreateUserDTO } from "../schemas/user/user.schema";
import { LoginDTO } from "../schemas/auth/auth.schema";
import { UserWithRole } from "../types/user";
import crypto from "crypto";

interface AuthenticatedRequest extends Request {
  user?: UserWithRole;
}

export const createUser = async (
  req: Request<{}, {}, CreateUserDTO>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, lastname, email, password1, password2, role} = req.body;

    const user = await userService.createUser(name, lastname, email, password1, role);

    res.status(201).json(user);
  } catch (err: any) {
    next(err);
  }
};

export const login = async (
  req: Request<{}, {}, LoginDTO>, 
  res: Response, 
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;
    const { user, token } = await userService.login(email, password);

    const csrfToken = crypto.randomBytes(24).toString("hex");

    res.cookie("access_token", token, {
      httpOnly: true, 
      secure: true,  
      sameSite: "lax", 
      maxAge: 2 * 60 * 60 * 1000, // 2h
    });

    res.cookie("XSRF-TOKEN", csrfToken, {
      httpOnly: false,      //allows the front end to read the token and send it
      secure: true,   
      sameSite: "lax",
      maxAge: 2 * 60 * 60 * 1000, // 2h
    });

    return res.status(200).json({ 
      user, 
      csrfToken: csrfToken // Return the CSRF token for Swagger documentation 
    });

  } catch (err) {
    next(err);
  }
};

export const logout = (
  req: Request,
  res: Response
) => {
  const cookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: "lax" as const,
    path: "/"
  };

  res.clearCookie("access_token", cookieOptions);

  res.clearCookie("XSRF-TOKEN", {
    ...cookieOptions,
    httpOnly: false
  });

  return res.status(200).json({
    status: "success",
    message: "Logged out successfully"
  });
};

export const getMe = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authReq = req as AuthenticatedRequest;

    const userId = authReq.user?.user_id;

    if (!userId) {
      res.status(401).json({
        message: "Unauthorized"
      });
      return;
    }

    const user = await userService.getUserById(userId);

    res.status(200).json({ user });

  } catch (err) {
    next(err);
  }
};

export const getReferents = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const referents = await userService.getReferents();
    
    return res.status(200).json({
      status: "success",
      results: referents.length,
      data: { referents }
    });

  } catch (err) {
    next(err);
  }
};
