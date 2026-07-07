import { Request, Response, NextFunction } from "express";
import * as universityService from "../services/universities.service";

export const getAllUniversities = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const universities = await universityService.getAllUniversities();

     return res.status(200).json({
      status: "success",
      results: universities.length,
      data: { universities }
    });

  } catch (err) {
    next(err);
  }
};