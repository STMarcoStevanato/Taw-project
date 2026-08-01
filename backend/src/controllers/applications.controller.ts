import { Request, Response, NextFunction } from "express";
import * as applicationService from "../services/application.service";
import { ApproveRequestSchema } from "../schemas/application/application.schema";

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

export const referentApproval = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
        const userId = (req as any).user.user_id;
        const { params, body } = ApproveRequestSchema.parse({
          params: req.params,
          body: req.body,
        });
        

        const result = await applicationService.referentApproval(
            params.applicationId,
            params.versionId,
            userId,
            body.approved,
            body.reason ?? null
        );

        return res.status(200).json({
            status: "success",
            data: result,
        });

    } catch (err) {
      next(err);
    }
};

export const editApplication = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
        const userId = (req as any).user.user_id;
        const applicationId = Number(req.params.applicationId); 
        const body = req.body;

        const result = await applicationService.editApplication(
            applicationId,
            userId,
            body.host_institution_id,
            body.academic_year,
            body.expected_mobility_period,
            body.mappings
        );

        return res.status(200).json({
            status: "success",
            data: result,
        });

    } catch (err) {
      next(err);
    }
};