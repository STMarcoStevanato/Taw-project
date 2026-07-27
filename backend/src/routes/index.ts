import { Router } from "express";
import userRoutes from "./user.routes";
import referentRoutes from "./referents.routes";
import universityRoutes from "./universities.route";
import authRoutes from "./isAuth";
import studentRoutes from "./students.route";

const router = Router();

router.use("/users", userRoutes);
router.use("/referents", referentRoutes);
router.use("/universities", universityRoutes);
router.use("/universities/:id/courses", universityRoutes);
router.use("/auth", authRoutes);
router.use("/students", studentRoutes);


export default router;
