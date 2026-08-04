import { Router } from "express";
import { createRecognizedExam } from "../controllers/exams.controller"; 
import { createExamSchema } from "../schemas/exam/exam.schema";         
import { validate } from "../middleware/validate";
import { isAuth } from "../middleware/authHandler";
import { hasRole } from "../middleware/roleHandler";

const router = Router();

router.post("/", isAuth, hasRole(["students"]), validate(createExamSchema), createRecognizedExam);

export default router;