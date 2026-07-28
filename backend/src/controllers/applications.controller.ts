import { Request, Response, NextFunction } from "express";
import * as applicationService from "../services/application.service";

export const createApplication = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
        const { student_id,referent_id, host_institution_id, academic_year, expected_mobility_period, mappings} = req.body;
      
        const newApplication = await applicationService.createApplication(
            student_id, 
            referent_id,
            host_institution_id,
            academic_year, 
            expected_mobility_period, 
            mappings);
      
          return res.status(201).json({
            status: "success",
            data: newApplication,
          });
  
    } catch (err) {
      next(err);
    }
};