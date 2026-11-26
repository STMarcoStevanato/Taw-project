import { Request, Response, NextFunction } from "express";
import { 
    getNotification, 
    markNotificationAsRead,
    markAllNotificationsAsRead 
} from "../services/notifications.service";

export const notifications = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = (req as any).user.user_id;
        const result = await getNotification(userId);

        return res.status(200).json({
            status: "success",
            data: result,
        });
    } catch (err) {
        next(err);
    }
};

export const readNotification = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = (req as any).user.user_id;
        const notificationId = req.params.notificationId;

        if (
            typeof notificationId !== "string" ||
            !/^[1-9]\d*$/.test(notificationId) ||
            BigInt(notificationId) > 9223372036854775807n
        ) {
            const error = new Error(
                "Invalid notification ID"
            ) as any;

            error.statusCode = 400;
            throw error;
        }

        const result = await markNotificationAsRead(
            notificationId,
            userId
        );

        return res.status(200).json({
            status: "success",
            data: result,
        });

    } catch (err) {
        next(err);
    }
};

export const readAllNotifications = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = (req as any).user.user_id;

        const result = await markAllNotificationsAsRead(userId);

        return res.status(200).json({
            status: "success",
            data: {
                updated_count: result,
            },
        });

    } catch (err) {
        next(err);
    }
};