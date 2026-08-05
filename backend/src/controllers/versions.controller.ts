import { Request, Response, NextFunction } from "express";
import { UploadLearningAgreement, getDocumentRecordsFile, getDocumentFileService, UploadTraqnscriptOfRecords } from "../services/document.service";
import { generateRecordsFile } from "../services/pdfService";

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

export const getRecordsFile = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const versionId = Number(req.params.versionId);
        const userId = (req as any).user?.user_id;

        const result = await getDocumentRecordsFile(versionId, userId);

        // Set the HTTP headers to always force the PDF to download
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename=Transcript_of_Records_v${versionId}.pdf`
        );

        // Generate the PDF and send the stream
        const doc = generateRecordsFile(result);
        doc.pipe(res);

    } catch (err) {
        next(err);
    }
};

export const uploadRecordsFile = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const versionId = Number(req.params.versionId);
        const file = req.file!; 
        const userId = (req as any).user?.user_id;

        const newRecordsFile = await UploadTraqnscriptOfRecords(versionId, file, userId);

        return res.status(201).json({
            status: "success",
            data: newRecordsFile,
        });
    } catch (err) {
        next(err);
    }
};