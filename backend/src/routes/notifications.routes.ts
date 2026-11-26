import { Router } from "express"
import { isAuth } from "../middleware/authHandler";
import { hasRole } from "../middleware/roleHandler";
import { notifications, readNotification, readAllNotifications } from "../controllers/notifications.controller";

const router = Router();

router.get("/", isAuth, notifications);

router.patch("/:notificationId/read", isAuth, readNotification);
router.patch("/read-all", isAuth, readAllNotifications);

export default router;
