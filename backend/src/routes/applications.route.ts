import { Router } from "express";
import { createApplication, referentApproval, editApplication, staffApproval, updateMobilityDates } from "../controllers/applications.controller";
import { getAllApplications, getStudentApplications, getReferentApplications, getTransitionApplications } from "../controllers/applications.controller"
import { applicationSchema, ApproveRequestSchema, updateApplicationSchema, updateApplicationMobilityDatesSchema } from "../schemas/application/application.schema";
import { validate } from "../middleware/validate";
import { isAuth } from "../middleware/authHandler";
import { hasRole } from  "../middleware/roleHandler";

const router = Router();

router.get("/", getAllApplications);
router.get("/student/:studentId", getStudentApplications);
router.get("/referent/:referentId", getReferentApplications);
router.get("/transition/:transitionId", getTransitionApplications);

router.post("/", isAuth, hasRole(["students"]), validate(applicationSchema), createApplication);
router.post("/:applicationId/version/:versionId/referent-approval", isAuth, hasRole(["referents"]), validate(ApproveRequestSchema), referentApproval);
router.post("/:applicationId/version/:versionId/staff-approval", isAuth, hasRole(["staff"]), staffApproval);

router.put("/:applicationId", isAuth, hasRole(["students"]), validate(updateApplicationSchema), editApplication);

router.patch("/:applicationId/mobility-dates", isAuth, hasRole(["students"]), validate(updateApplicationMobilityDatesSchema), updateMobilityDates);


export default router;