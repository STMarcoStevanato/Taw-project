import { Router } from "express";
import { uploadDocumentSchema } from "../schemas/document/document.schema";
import { validate } from "../middleware/validate";
import { isAuth } from "../middleware/authHandler";
import { hasRole } from  "../middleware/roleHandler";
import { createPdfUploader }  from "../middleware/uploadMiddleware";
import { handleMulterError } from "../middleware/uploadErrorHandler";
import * as validationControllers from "../controllers/versions.controller"
import { is } from "zod/v4/locales";

const router = Router();

router.post(
    "/:versionId/learning-agreement",
     isAuth,
     hasRole(["students"]),
     createPdfUploader({
        fieldName: 'LEARNING_AGREEMENT',
        folderName: 'learning_agreements'
      }),
     handleMulterError,
     validate(uploadDocumentSchema),
     validationControllers.uploadLearningAgreement
    ); 

router.post(
    "/:versionId/records-file",
     isAuth,
     hasRole(["students"]),
     createPdfUploader({
        fieldName: 'TRANSCRIPT_OF_RECORDS',
        folderName: 'transcripts_of_records'
      }),
     handleMulterError,
     validate(uploadDocumentSchema),
     validationControllers.uploadRecordsFile
    );

router.get("/:versionId/documents/:documentId", isAuth, hasRole(["students", "referents", "staff"]), validationControllers.getDocumentById);
router.get("/:versionId/learning-agreement", isAuth, hasRole(["students", "referents", "staff"]), validationControllers.getLearningAgreement);
router.get("/:versionId/records-file", isAuth, hasRole(["students", "referents", "staff"]), validationControllers.getRecordsFile);

router.delete("/:versionId/documents/:documentId", isAuth, hasRole(["students", "referents", "staff"]), validationControllers.deleteTranscriptRecordsById);

export default router;