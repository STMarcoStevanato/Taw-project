import { Router } from "express";
import { createRecognizedExam } from "../controllers/exams.controller"; 
import { getExamsByMapping } from "../controllers/exams.controller"; 
import { createExamSchema } from "../schemas/exam/exam.schema";         
import { validate } from "../middleware/validate";
import { isAuth } from "../middleware/authHandler";
import { hasRole } from "../middleware/roleHandler";

const router = Router();

router.post("/", isAuth, hasRole(["students"]), validate(createExamSchema), createRecognizedExam);
router.get("/mapping/:mappingId", isAuth, getExamsByMapping);

export default router;