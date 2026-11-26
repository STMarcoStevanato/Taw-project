import { Router } from "express";
import userRoutes from "./user.routes";
import referentRoutes from "./referents.routes";
import universityRoutes from "./universities.route";
import authRoutes from "./isAuth";
import studentRoutes from "./students.route";
import applicationRoutes from "./applications.route";
import versionRoutes from "./versions.route";
import examRoutes from "./exams.route";
import notificationRoutes from "./notifications.routes"

const router = Router();

router.use("/users", userRoutes);
router.use("/referents", referentRoutes);
router.use("/exams", examRoutes);
router.use("/universities", universityRoutes);
router.use("/auth", authRoutes);
router.use("/students", studentRoutes);
router.use("/applications", applicationRoutes);
router.use("/versions", versionRoutes);
router.use("/notifications", notificationRoutes);



export default router;
