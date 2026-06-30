import { Request, Response, NextFunction } from "express";
import * as universityService from "../services/universities.service";

export const getAllUniversities = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const universities = await universityService.getAllUniversities();
    res.status(200).json(universities);
  } catch (err) {
    next(err);
  }
};