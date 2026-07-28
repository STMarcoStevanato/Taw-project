import { Router } from "express";
import { createApplication } from "../controllers/applications.controller";
import { applicationSchema } from "../schemas/application/application.schema";
import { validate } from "../middleware/validate";
import { isAuth } from "../middleware/authHandler";
import { hasRole } from  "../middleware/roleHandler";

const router = Router();

router.post("/", isAuth, hasRole(["students"]), validate(applicationSchema), createApplication);

export default router;