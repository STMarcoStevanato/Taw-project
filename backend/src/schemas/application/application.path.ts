import { registry, z } from "../../config/openapi";
import { applicationBodySchema } from "./application.schema";

registry.registerPath({
  method: "post",
  path: "/applications",
  summary: "Create a new study abroad application",
  description:
    "Creates a new application version 1 with mapped course equivalencies and records the initial state transition.",
  tags: ["Applications"],
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
          schema: applicationBodySchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Application created successfully",
      content: {
        "application/json": {
          schema: z.object({
            status: z.string().openapi({ example: "success" }),
            data: z.object({
              application_id: z.number().openapi({ example: 42 }),
              student_id: z.number().openapi({ example: 20 }),
              referent_id: z.number().openapi({ example: 17 }),
              host_institution_id: z.number().openapi({ example: 3 }),
              academic_year: z.string().openapi({ example: "2025/26" }),
              expected_mobility_period: z
                .enum(["first_semester", "second_semester", "full_year"])
                .openapi({ example: "first_semester" }),
              created_at: z
                .string()
                .datetime()
                .openapi({ example: "2026-07-28T10:00:00Z" }),
            }),
          }),
        },
      },
    },
    400: {
      description:
        "Bad Request. Validation failed (e.g. invalid academic year, invalid course IDs, or duplicate mappings).",
      content: {
        "application/json": {
          schema: z.object({
            message: z.string().openapi({
              example:
                "Duplicate course mappings (identical pairs) are not allowed.",
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
        "Forbidden. User lacks 'students' role or CSRF token validation failed.",
      content: {
        "application/json": {
          schema: z.object({
            message: z.string().openapi({ example: "Invalid CSRF Token" }),
          }),
        },
      },
    },
    404: {
      description: "Not Found. Student or Referent ID does not exist.",
      content: {
        "application/json": {
          schema: z.object({
            message: z.string().openapi({
              example: "Student with ID 20 does not exist.",
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