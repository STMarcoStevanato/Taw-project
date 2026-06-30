import { Router } from "express";
import userRoutes from "./user.routes";
import referentRoutes from "./referents.routes";
import universityRoutes from "./universities.route";
import authRoutes from "./isAuth";

const router = Router();

router.use("/users", userRoutes);
router.use("/referents", referentRoutes);
router.use("/universities", universityRoutes);
router.use("/auth", authRoutes);

export default router;
