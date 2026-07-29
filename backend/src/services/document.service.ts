import { getApplicationVersionById } from "../repositories/version.repository";
import { getTransactionByIdApplicationIdAndStates } from "../repositories/transaction.repository";

export const UploadLearningAgreement = async (
     versionId: number,
     file: Express.Multer.File,
     userId?: number
    ) => {
        const infoApplicationVersion = await getApplicationVersionById(versionId);
        if (infoApplicationVersion === null) {
            const error = new Error("versionId not found") as any;
            error.statusCode = 404;
            throw error;
        }

        if (infoApplicationVersion?.version_number !== 1) {
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

        return infoTransaction;
    }