import { registry } from "../../config/openapi";  
import { z } from "../../config/openapi";

registry.registerPath({
  method: "get",
  path: "/referents",
  summary: "Get all referents with details",
  description: "Retrieves a list of all registered referents, including their profile details (name, lastname, email) from the users table",
  tags: ["Referents"],
  security: [
    {
      XSRFToken: [],
    },
  ],
  responses: {
    200: {
      description: "List of referents retrieved successfully",
      content: {
        "application/json": {
            schema: z.object({
                status: z.string().openapi({ example: "success" }),
                results: z.number().openapi({ example: 1 }), 
                referents: z.array(z.object({
                    user_id: z.number().openapi({ example: 12 }),
                    name: z.string().openapi({ example: "Anton" }),
                    lastname: z.string().openapi({ example: "Čechov" }),
                    email: z.string().email().openapi({ example: "anton.cechov@example.com" }),
                })),
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
      description: "Forbidden. CSRF token validation failed.",
      content: {
        "application/json": {
          schema: z.object({
            message: z.string().openapi({ example: "Invalid CSRF Token" }),
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
