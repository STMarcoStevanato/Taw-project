import { Router } from "express";
import { createApplication, referentApproval } from "../controllers/applications.controller";
import { applicationSchema, referentApprovalSchema } from "../schemas/application/application.schema";
import { validate } from "../middleware/validate";
import { isAuth } from "../middleware/authHandler";
import { hasRole } from  "../middleware/roleHandler";

const router = Router();

router.post("/", isAuth, hasRole(["students"]), validate(applicationSchema), createApplication);
router.post("/:id/referent-approval", isAuth, hasRole(["referents"]), validate(referentApprovalSchema), referentApproval);

export default router;