import { getUserById } from "../repositories/user.repository";
import { 
    getNotificationByUserID,
    readNotificationById,
    readAllNotificationsByUserID 
} from "../repositories/notifications.repository";

export const getNotification = async (user_id: number) => {

    const user = await getUserById(user_id);
    if (!user) {
        const error = new Error(`User with ID ${user_id} does not exist`) as any;
        error.statusCode = 404;
        throw error;
    } 
    return await getNotificationByUserID(user_id);
}

export const markNotificationAsRead = async (
    notification_id: string,
    user_id: number
) => {

    const notification = await readNotificationById(
        notification_id,
        user_id
    );

    if (!notification) {
        const error = new Error(
            `Notification with ID ${notification_id} not found`
        ) as any;

        error.statusCode = 404;
        throw error;
    }
    return notification;
};

export const markAllNotificationsAsRead = async (
    user_id: number
) => {
    return await readAllNotificationsByUserID(user_id);
};