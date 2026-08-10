import { registry } from "../../config/openapi";  
import { z } from "../../config/openapi";
import { CourseSchema } from "./university.schema";

registry.registerPath({
  method: "get",
  path: "/universities",
  summary: "Get all universities",
  description: "Retrieve a list of all universities in the system.",
  tags: ["Universities"],
  responses: {
    200: {
      description: "Logout successful. Cookies have been cleared.",
      content: {
        "application/json": {
          schema: z.object({
            status: z.string().openapi({ example: "success" }),
            results: z.number().openapi({ example: 1 }),
            universities: z.array(z.object({
              university_id: z.number().openapi({ example: 1 }),
              name: z.string().openapi({ example: "Ca' Foscari" }),
              city: z.string().openapi({ example: "Venice" }),
              Countries: z.object({
                country_id: z.string().openapi({ example: "1" }),
                name: z.string().openapi({ example: "Italy" })
              }),
            })),
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

registry.registerPath({
  method: "get",
  path: "/universities/{id}/courses",
  summary: "Get courses by university ID",
  description: "Retrieve all courses offered by a specific university.",
  tags: ["Universities"],
  request: {
    params: z.object({
      id: z.coerce.number().int().positive().openapi({
        description: "Numeric ID of the university",
        example: 1,
      }),
    }),
  },
  responses: {
    200: {
      description: "List of university courses retrieved successfully.",
      content: {
        "application/json": {
          schema: z.object({
            status: z.string().openapi({ example: "success" }),
            results: z.number().openapi({ example: 2 }),
            data: z.object({
              courses: z.array(CourseSchema),
            }),
          }),
        },
      },
    },
    400: {
      description: "Invalid ID supplied.",
      content: {
        "application/json": {
          schema: z.object({
            message: z.string().openapi({ example: "Invalid university ID format" }),
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

