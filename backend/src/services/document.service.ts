import path from "path";
import fs from "fs";
import { getApplicationVersionById } from "../repositories/version.repository";
import { insertNewTransaction } from "../repositories/transaction.repository";
import { insertLearningAgreement, getDocumentByVersionAndType } from "../repositories/documents.repository";
import { getDocumentByDocumentId  } from "../repositories/documents.repository";
import { getApplicationById } from "../repositories/application.repository";
import { getMappingByVersionId } from "../repositories/exams.repository";
import { getUserById } from "../repositories/user.repository";
import { getUniversityById } from "../repositories/universities.repository";
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
        const reason = "Learning Agreement uploaded";

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
            newState,
            reason
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

export const getDocumentRecordsFile = async (
    version_id: number,
    userId: number
) => {

    const version = await getApplicationVersionById(version_id);
    if (!version) {
        const error = new Error("Version not found") as any;
        error.statusCode = 404;
        throw error;
    }

    if (version.is_active === false) {
        const error = new Error("Version is not active") as any;
        error.statusCode = 400;
        throw error;
    }

    const application = await getApplicationById(version.application_id);
    if (!application) {
        const error = new Error("Application not found") as any;
        error.statusCode = 404;
        throw error;
    }

    if (Number(application.student_id) !== Number(userId)) {
        const error = new Error("User is not authorized to access this version's records file") as any;
        error.statusCode = 403;
        throw error;
    }

    if (Number(application.current_state_id) !== STATES.MOBILITY_IN_PROGRESS) {
        const error = new Error("Application is not in the correct state to access the records file") as any;
        error.statusCode = 400;
        throw error;
    }

    const mapping = await getMappingByVersionId(version_id);
    if (!mapping) {
        const error = new Error("Mapping not found for the given version") as any;
        error.statusCode = 404;
        throw error;
    }

    const missingRecognizedExam = mapping.mappings.some(
        (m) => m.recognized_exam === null
    );
    if (missingRecognizedExam) {
        const error = new Error("Not all mappings have recognized exams") as any;
        error.statusCode = 400;
        throw error;
    }

    const newTransaction = await insertNewTransaction(
        Number(application.application_id),
        Number(application.current_state_id),
        STATES.GETTING_EXAM_SCORE,
        userId,
        "Generating records file"
    );

    const user = await getUserById(userId);
    const referent = await getUserById(Number(application.referent_id));
    const university = await getUniversityById(Number(application.host_institution_id));

    return {
        "user": user,
        "referent": referent,
        "mapping": mapping,
        "application": application,
        "university": university
    };
};

export const UploadTraqnscriptOfRecords = async (
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

       if (infoApplicationVersion.is_active === false) {
           const error = new Error("The version is not active. ") as any;
           error.statusCode = 400;
           throw error;
       }

       const document = await getDocumentByVersionAndType(version_id, "TRANSCRIPT_OF_RECORDS");
       if (document !== null) {
           const error = new Error("The Transcript of Records has already been uploaded. ") as any;
           error.statusCode = 400;
           throw error;
       }

       const application = await getApplicationById(infoApplicationVersion.application_id);
       if (application === null) {
           const error = new Error("Application not found") as any;
           error.statusCode = 404;
           throw error;
       }

      if (Number(application.current_state_id) !== STATES.GETTING_EXAM_SCORE) {
           const error = new Error("The application is not in the correct state for uploading the Transcript of Records.") as any;
           error.statusCode = 409;
           throw error;  
       }

       const currentState = application.current_state_id;
       const newState = STATES.WAITING_EXAM_SCORE_APPROVAL;
       const reason = "Transcript of Records uploaded";

       const relativeFilePath = `transcripts_of_records/${file.filename}`;

       const newTranscriptOfRecords = await insertLearningAgreement(
           version_id,
           file.fieldname,
           relativeFilePath,
           file.originalname,
           file.mimetype,
           file.size,
           infoApplicationVersion.application_id,
           user_id,
           currentState,
           newState,
           reason
       );

       return newTranscriptOfRecords;
};