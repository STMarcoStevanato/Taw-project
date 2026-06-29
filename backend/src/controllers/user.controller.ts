import { Request, Response, NextFunction } from "express";
import * as userService from "../services/user.service";
import { CreateUserDTO } from "../schemas/user.schema";
import { LoginDTO } from "../schemas/auth.schema";
import crypto from "crypto";

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
      httpOnly: false, 
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

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {

    res.clearCookie("access_token", {
      httpOnly: true,
      secure: true,
      sameSite: "lax"
    });

    res.clearCookie("XSRF-TOKEN", {
      httpOnly: false,
      secure: true,
      sameSite: "lax"
    });

    return res.status(200).json({ 
      status: "success",
      message: "Logged out successfully" 
    });
    
  } catch (err) {
    next(err);
  }
};
