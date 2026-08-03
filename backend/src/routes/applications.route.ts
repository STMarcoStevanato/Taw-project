import { Router } from "express";
import { createApplication, referentApproval, editApplication, staffApproval } from "../controllers/applications.controller";
import { applicationSchema, ApproveRequestSchema, updateApplicationSchema } from "../schemas/application/application.schema";
import { validate } from "../middleware/validate";
import { isAuth } from "../middleware/authHandler";
import { hasRole } from  "../middleware/roleHandler";

const router = Router();

router.post("/", isAuth, hasRole(["students"]), validate(applicationSchema), createApplication);
router.put("/:applicationId", isAuth, hasRole(["students"]), validate(updateApplicationSchema), editApplication);
router.post("/:applicationId/version/:versionId/referent-approval", isAuth, hasRole(["referents"]), validate(ApproveRequestSchema), referentApproval);
router.post("/:applicationId/version/:versionId/staff-approval", isAuth, hasRole(["staff"]), staffApproval);

export default router;