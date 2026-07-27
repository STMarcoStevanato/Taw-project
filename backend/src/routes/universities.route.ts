import { Router } from "express";
import { getAllUniversities, getUniversityCourses } from "../controllers/universities.controller";

const router = Router();

router.get("/", getAllUniversities);
router.get("/:id/courses/", getUniversityCourses);

export default router;