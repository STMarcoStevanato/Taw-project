import { pool } from "../config/db"; 

export const getNotificationByUserID = async (user_id: number) => {
    const query = `
        SELECT
            COUNT(*) FILTER (
                WHERE n.read_at IS NULL
            )::integer AS unread_count,

            COUNT(*)::integer AS total_count,

            COALESCE(
                json_agg(
                    json_build_object(
                        'notification_id', n.notification_id::text,
                        'transition_id', ast.transition_id::text,
                        'application_id', a.application_id::text,
                        'host_institution', u.name,
                        'from_state_id', ast.from_state_id::text,
                        'from_state', fs.name,
                        'to_state_id', ast.to_state_id::text,
                        'to_state', ts.name,
                        'reason', ast.reason,
                        'performed_by', ast.performed_by::text,
                        'read_at', n.read_at,
                        'created_at', n.created_at
                    )
                    ORDER BY n.created_at DESC, n.notification_id DESC
                ),
                '[]'::json
            ) AS notifications

        FROM notifications n

        JOIN application_state_transitions ast
            ON n.transition_id = ast.transition_id

        JOIN applications a
            ON ast.application_id = a.application_id

        LEFT JOIN universities u
            ON a.host_institution_id = u.university_id

        LEFT JOIN application_states fs
            ON ast.from_state_id = fs.state_id

        LEFT JOIN application_states ts
            ON ast.to_state_id = ts.state_id

        WHERE n.user_id = $1;
    `;

    const result = await pool.query(query, [user_id]);

    return result.rows[0];
};

export const readNotificationById = async (
    notification_id: string,
    user_id: number
) => {
    const query = `
        UPDATE notifications
        SET read_at = COALESCE(read_at, NOW())
        WHERE notification_id = $1
          AND user_id = $2
        RETURNING
            notification_id,
            read_at;
    `;

    const result = await pool.query(query, [
        notification_id,
        user_id
    ]);

    return result.rows[0];
};

export const readAllNotificationsByUserID = async (
    user_id: number
) => {
    const query = `
        UPDATE notifications
        SET read_at = NOW()
        WHERE user_id = $1
          AND read_at IS NULL;
    `;

    const result = await pool.query(query, [user_id]);

    return result.rowCount;
};