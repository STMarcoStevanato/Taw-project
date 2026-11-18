import { Router } from "express";
import { login } from "../controllers/user.controller";
import { logout } from "../controllers/user.controller";
import { getMe } from "../controllers/user.controller";
import { validate } from "../middleware/validate";
import { isAuth } from "../middleware/authHandler";
import { loginSchema } from "../schemas/auth/auth.schema";

const router = Router();

router.post("/login", validate(loginSchema), login);
router.post("/logout", isAuth, logout);
router.get("/me", isAuth, getMe);

export default router;
