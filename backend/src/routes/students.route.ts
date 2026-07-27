import { Router } from "express";
import { getAllStudents } from "../controllers/students.controller";

const router = Router();

router.get("/", getAllStudents);

export default router;