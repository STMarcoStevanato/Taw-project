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

export const getUniversityCourses = async(
  req: Request, 
  res: Response,
  next: NextFunction
) => {
  try{
    const university_id = Number(req.params.id);
    const courses = await universityService.getUniversityCourses(university_id);

    return res.status(200).json({
      status: "success",
      results: courses.length,
      data: { courses }
    });

  }catch(err){
    next(err);
  }
}