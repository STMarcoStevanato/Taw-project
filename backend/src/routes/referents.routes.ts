import { Router } from "express";
import { getReferents } from "../controllers/user.controller";
import { isAuth } from "../middleware/authHandler";

const router = Router();

router.get("/", isAuth, getReferents);

export default router;
