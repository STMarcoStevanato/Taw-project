import { Router } from "express";
import { getAllUniversities } from "../controllers/universities.controller";

const router = Router();

router.get("/", getAllUniversities);

export default router;