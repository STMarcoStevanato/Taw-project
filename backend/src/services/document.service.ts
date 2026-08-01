import path from "path";
import fs from "fs";
import { getApplicationVersionById } from "../repositories/version.repository";
import { getTransactionByIdApplicationIdAndStates } from "../repositories/transaction.repository";
import { insertLearningAgreement, getDocumentByVersionAndType } from "../repositories/documents.repository";
import { getDocumentByDocumentId  } from "../repositories/documents.repository";

export const UploadLearningAgreement = async (
     version_id: number,
     file: Express.Multer.File,
     user_id : number
    ) => {

        const infoApplicationVersion = await getApplicationVersionById(version_id);
        if (infoApplicationVersion === null) {
            const error = new Error("version_id not found") as any;
            error.statusCode = 404;
            throw error;
        }
        const document = await getDocumentByVersionAndType(version_id, "LEARNING_AGREEMENT");
        if (document !== null) {
            const error = new Error("The Learning Agreement has already been uploaded. ") as any;
            error.statusCode = 400;
            throw error;
        }

        const infoTransaction = await getTransactionByIdApplicationIdAndStates
        (
            infoApplicationVersion.application_id,
            null, // from_state_id 
            1,    // to_state_id -> 1 is created
        );

        if (infoTransaction === null) {
            const error = new Error("The user wants to upload the file. But there is a conflict with the application's transactions.") as any;
            error.statusCode = 409;
            throw error;
        }

        const relativeFilePath = `learning_agreements/${file.filename}`;

        const newLearningAgreement = await insertLearningAgreement(
            version_id,
            file.fieldname,
            relativeFilePath,
            file.originalname,
            file.mimetype,
            file.size,
            infoApplicationVersion.application_id,
            user_id,
        );

        return newLearningAgreement;
    }

export const getDocumentFileService = async (
    version_id: number,
    document_id: number
) => {
    const document = await getDocumentByDocumentId(document_id);
    if (!document) {
        const error = new Error("Document not found") as any;
        error.statusCode = 404;
        throw error;
    }

    if (Number(document.version_id) !== Number(version_id)) {
        const error = new Error("Document does not belong to the specified version") as any;
        error.statusCode = 400;
        throw error;
    }

    const absolutePath = path.join(process.cwd(), "uploads", document.file_path);


    if (!fs.existsSync(absolutePath)) {
        const error = new Error("File missing on server storage") as any;
        error.statusCode = 404;
        throw error;
    }

    return {
        absolutePath,
        original_name: document.original_name,
        mime_type: document.mime_type,
    };
};