import { Request, Response, NextFunction } from "express";
import { UploadLearningAgreement } from "../services/document.service";

export const uploadLearningAgreement = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const versionId = Number(req.params.versionId);
        const file = req.file!; 
        const userId = (req as any).user?.user_id;

        const newLearningAgreement = await UploadLearningAgreement(versionId, file, userId);

        return res.status(201).json({
            status: "success",
            data: newLearningAgreement,
        });
    } catch (err) {
        next(err);
    }
};