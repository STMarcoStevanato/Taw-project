import path from "path";
import fs from "fs";
import { getApplicationVersionById } from "../repositories/version.repository";
import { getTransactionByIdApplicationIdAndStates } from "../repositories/transaction.repository";
import { insertLearningAgreement, getDocumentByVersionAndType } from "../repositories/documents.repository";
import { getDocumentByDocumentId  } from "../repositories/documents.repository";
import { getApplicationById } from "../repositories/application.repository";
import { STATES } from "../config/STATE";   

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

        const application = await getApplicationById(infoApplicationVersion.application_id);
        if (application === null) {
            const error = new Error("Application not found") as any;
            error.statusCode = 404;
            throw error;
        }

        if (!(
            Number(application.current_state_id) === STATES.AWAITING_LEARNING_AGREEMENT_APPROVAL_BY_REFERENT ||
            Number(application.current_state_id) === STATES.AWAITING_CHANGES_APPROVAL
            )
        ) { 
            const error = new Error("The application is not in the correct state for uploading the Learning Agreement.") as any;
            error.statusCode = 409;
            throw error;  
        }

        const currentState = application.current_state_id;
        const newState = Number(application.current_state_id);

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
            currentState,
            newState
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