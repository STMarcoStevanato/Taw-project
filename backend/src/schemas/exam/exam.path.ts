import { z, registry } from "../../config/openapi";
import { createExamBodySchema } from "./exam.schema";

registry.registerPath({
  method: "post",
  path: "/exams",
  summary: "Record a recognized foreign exam",
  description:
    "Records a passed foreign exam tied to an active course mapping while the application is in MOBILITY_IN_PROGRESS state.",
  tags: ["Exams"],
  security: [
    {
      XSRFToken: [],
    },
  ],
  request: {
    body: {
      required: true,
      content: {
        "application/json": {
          schema: createExamBodySchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Exam recorded successfully",
      content: {
        "application/json": {
          schema: z.object({
            status: z.string().openapi({ example: "success" }),
            data: z.object({
              recognized_exam_id: z.number().openapi({ example: 101 }),
              mapping_id: z.number().openapi({ example: 42 }),
              exam_date: z.string().openapi({ example: "2026-05-20" }),
              foreign_score: z.number().openapi({ example: 28 }),
              created_at: z
                .string()
                .datetime()
                .openapi({ example: "2026-08-03T10:00:00Z" }),
            }),
          }),
        },
      },
    },
    400: {
      description:
        "Bad Request. Validation failed or application is not in MOBILITY_IN_PROGRESS state.",
      content: {
        "application/json": {
          schema: z.object({
            message: z.string().openapi({
              example:
                "Exams can only be recorded when application is in MOBILITY_IN_PROGRESS state",
            }),
          }),
        },
      },
    },
    401: {
      description: "Unauthorized. Missing or invalid authentication token.",
      content: {
        "application/json": {
          schema: z.object({
            message: z.string().openapi({ example: "Unauthorized" }),
          }),
        },
      },
    },
    403: {
      description:
        "Forbidden. User lacks 'staff' or 'referents' role or CSRF token validation failed.",
      content: {
        "application/json": {
          schema: z.object({
            message: z.string().openapi({ example: "Forbidden" }),
          }),
        },
      },
    },
    404: {
      description: "Not Found. Mapping ID or Application does not exist.",
      content: {
        "application/json": {
          schema: z.object({
            message: z.string().openapi({
              example: "Mapping with ID 42 does not exist",
            }),
          }),
        },
      },
    },
    500: {
      description: "Internal server error.",
      content: {
        "application/json": {
          schema: z.object({
            message: z.string().openapi({ example: "Internal server error" }),
          }),
        },
      },
    },
  },
});