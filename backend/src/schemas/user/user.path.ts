import { CreateUserBodySchema } from "./user.schema";
import { registry } from "../../config/openapi";  
import { z } from "../../config/openapi";

registry.registerPath({
  method: "post",
  path: "/users",
  summary: "Register a new user",
  description: "Register a user in the school system. Supports roles Admin (1), Teacher (2), and Student (3).",
  tags: ["Users"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreateUserBodySchema, 
        },
      },
    },
  },
  responses: {
    201: {
      description: "User created successfully",
      content: {
        "application/json": {
         
          schema: z.object({
            user_id: z.number().openapi({ example: 1 }),
            name: z.string().openapi({ example: "Eren" }),
            lastname: z.string().openapi({ example: "Jaeger" }),
            email: z.string().email().openapi({ example: "eren.jaeger@example.com" }),
            role: z.string().openapi({ example: "students" }),
          }),
        },
      },
    },
    400: {
      description: "Validation failed (e.g., weak password, mismatched passwords)",
      content: {
        "application/json": {
          schema: z.object({
            error: z.string().openapi({ example: "Bad Request" }),
            details: z.array(z.any()).openapi({ description: "Details of Zod validation errors" }),
          }),
        },
      },
    },
    500: {
      description: "Internal server error",
    },
  },
});