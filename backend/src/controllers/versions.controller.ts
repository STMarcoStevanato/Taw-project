import { Request, Response, NextFunction } from "express";
import { UploadLearningAgreement } from "../services/document.service";
import { getDocumentFileService } from "../services/document.service";

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

export const getDocumentById = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const versionId = Number(req.params.versionId);
        const documentId = Number(req.params.documentId);
        const download = req.query.download === "true";

        const fileData = await getDocumentFileService(versionId, documentId);
        
        res.setHeader("Content-Type", fileData.mime_type);

        const dispositionType = download ? "attachment" : "inline";
        res.setHeader(
            "Content-Disposition",
            `${dispositionType}; filename="${fileData.original_name}"`
        );

        return res.sendFile(fileData.absolutePath);
    } catch (err) {
        next(err);
    }
};