import { z, registry } from "../../config/openapi";

registry.registerPath({
    method: "get",
    path: "/notifications",
    summary: "Get user notifications",
    description:
      "Retrieve all notifications belonging to the authenticated user, including application state transitions, reasons, read status, total notification count and unread notification count. Notifications are ordered from newest to oldest.",
    tags: ["Notifications"],
    security: [
        {
          XSRFToken: [],
        },
      ],
    responses: {
      200: {
        description: "Notifications retrieved successfully",
        content: {
          "application/json": {
            schema: z.object({
              status: z.string().openapi({
                example: "success",
              }),
              data: z.object({
                unread_count: z.number().int().nonnegative().openapi({
                  example: 1,
                  description: "Number of unread notifications",
                }),
                total_count: z.number().int().nonnegative().openapi({
                  example: 2,
                  description: "Total number of notifications",
                }),
                notifications: z.array(
                  z.object({
                    notification_id: z.string().openapi({
                      example: "2",
                    }),
                    transition_id: z.string().openapi({
                      example: "56",
                    }),
                    application_id: z.string().openapi({
                      example: "18",
                    }),
                    host_institution: z.string().nullable().openapi({
                      example: "University of Barcelona",
                    }),
                    from_state_id: z.string().nullable().openapi({
                      example: "2",
                    }),
                    from_state: z.string().nullable().openapi({
                      example: "awaiting Learning Agreement approval by referent;",
                    }),
                    to_state_id: z.string().nullable().openapi({
                      example: "8",
                    }),
                    to_state: z.string().nullable().openapi({
                      example: "Rejected by referent",
                    }),
                    reason: z.string().nullable().openapi({
                      example: "The Learning Agreement requires corrections",
                    }),
                    performed_by: z.string().nullable().openapi({
                      example: "22",
                      description: "ID of the user who performed the state transition",
                    }),
                    read_at: z.string().datetime().nullable().openapi({
                      example: null,
                      description: "Date and time when the notification was read. Null if unread.",
                    }),
                    created_at: z.string().datetime().openapi({
                      example: "2026-11-24T23:23:23.899Z",
                      description: "Date and time when the notification was created",
                    }),
                  })
                ).openapi({
                  description: "List of notifications ordered from newest to oldest. Empty array if no notifications exist.",
                }),
              }),
            }),
          },
        },
      },
      401: {
        description: "Unauthorized - Missing or invalid authentication token",
      },
      404: {
        description: "Authenticated user not found",
      },
      500: {
        description: "Internal server error",
      },
    },
  });

  registry.registerPath({
    method: "patch",
    path: "/notifications/{notificationId}/read",
    summary: "Mark a notification as read",
    description:
      "Mark a specific notification belonging to the authenticated user as read. If the notification has already been read, the original read date is preserved.",
    tags: ["Notifications"],
    security: [
      {
        XSRFToken: [],
      },
    ],
    request: {
      params: z.object({
        notificationId: z.string().regex(/^[1-9]\d*$/).openapi({
          example: "2",
          description: "Unique identifier of the notification",
        }),
      }),
    },
    responses: {
      200: {
        description: "Notification marked as read successfully",
        content: {
          "application/json": {
            schema: z.object({
              status: z.string().openapi({
                example: "success",
              }),
              data: z.object({
                notification_id: z.string().openapi({
                  example: "2",
                }),
                read_at: z.string().datetime().openapi({
                  example: "2026-11-26T10:30:00.000Z",
                  description:
                    "Date and time when the notification was first read",
                }),
              }),
            }),
          },
        },
      },
      400: {
        description: "Invalid notification ID",
      },
      401: {
        description: "Unauthorized - Missing or invalid authentication token",
      },
      404: {
        description:
          "Notification not found or does not belong to the authenticated user",
      },
      500: {
        description: "Internal server error",
      },
    },
  });

  registry.registerPath({
    method: "patch",
    path: "/notifications/read-all",
    summary: "Mark all notifications as read",
    description:
      "Mark all unread notifications belonging to the authenticated user as read. Previously read notifications remain unchanged. Returns the number of notifications updated.",
    tags: ["Notifications"],
    security: [
      {
        XSRFToken: [],
      },
    ],
    responses: {
      200: {
        description: "All notifications marked as read successfully",
        content: {
          "application/json": {
            schema: z.object({
              status: z.string().openapi({
                example: "success",
              }),
              data: z.object({
                updated_count: z.number().int().nonnegative().openapi({
                  example: 5,
                  description:
                    "Number of notifications marked as read. Returns 0 if there are no unread notifications.",
                }),
              }),
            }),
          },
        },
      },
      401: {
        description: "Unauthorized - Missing or invalid authentication token",
      },
      500: {
        description: "Internal server error",
      },
    },
  });