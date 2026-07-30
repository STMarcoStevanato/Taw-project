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

router.get(
    "/:versionId/documents/:documentId",
    isAuth,
    hasRole(["students", "referents", "staff"]),
    validationControllers.getDocumentById
  );

export default router;