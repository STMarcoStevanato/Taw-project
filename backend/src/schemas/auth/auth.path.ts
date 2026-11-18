import { LoginBodySchema } from "./auth.schema";
import { registry } from "../../config/openapi";  
import { z } from "../../config/openapi";

registry.registerPath({
  method: "post",
  path: "/auth/login",
  summary: "User login",
    description: "Authenticates user credentials, sets the Secure HttpOnly session cookie (`access_token`), and provides the CSRF protection cookie (`XSRF-TOKEN`)",
    tags: ["Auth"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: LoginBodySchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Login successful. Authentication and CSRF cookies have been set in the headers.",
      content: {
        "application/json": {
          schema: z.object({
            user: z.object({
              user_id: z.string().openapi({ example: "20" }),
              name: z.string().openapi({ example: "Eren" }),
              lastname: z.string().openapi({ example: "Jaeger" }),
              email: z.string().email().openapi({ example: "eren.jaeger@example.com" }),
              role: z.string().openapi({ example: "students" }),
            }),
            csrfToken: z.string().openapi({ 
              example: "2df1499a01373ad9f282b0ah5eee72d1115f800ce30897d8",
              description: "CSRF token to be included in the headers of subsequent mutable requests (POST, PUT, DELETE)"
            }),
          }),
        },
      },
    },
    400: {
      description: "Validation failed (e.g., invalid email format or empty fields).",
      content: {
        "application/json": {
          schema: z.object({
            message: z.string().openapi({ example: "Validation failed" }),
            errors: z.array(z.any()).optional().openapi({ description: "Zod validation details" }),
          }),
        },
      },
    },
    401: {
      description: "Invalid email or password.",
      content: {
        "application/json": {
          schema: z.object({
            message: z.string().openapi({ example: "Invalid email or password." }),
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
  method: "post",
  path: "/auth/logout",
  summary: "User logout",
  description: "Clears the authentication and CSRF cookies (`access_token` and `XSRF-TOKEN`) from the client browser, destroying the active session.",
  tags: ["Auth"],
  security: [
    {
      XSRFToken: [],
    },
  ],
  responses: {
    200: {
      description: "Logout successful. Cookies have been cleared.",
      content: {
        "application/json": {
          schema: z.object({
            status: z.string().openapi({ example: "success" }),
            message: z.string().openapi({ example: "Logged out successfully" }),
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

registry.registerPath({
  method: "get",
  path: "/auth/me",
  summary: "Get authenticated user",
  description:
    "Retrieves the profile information of the currently authenticated user using the JWT stored in the HttpOnly cookie (`access_token`).",
  tags: ["Auth"],

  security: [
    {
      XSRFToken: [],
    },
  ],

  responses: {
    200: {
      description: "Authenticated user retrieved successfully.",
      content: {
        "application/json": {
          schema: z.object({
            user: z.object({
              user_id: z.number().openapi({
                example: 20,
              }),
              name: z.string().openapi({
                example: "Eren",
              }),
              lastname: z.string().openapi({
                example: "Jaeger",
              }),
              email: z.string().email().openapi({
                example: "eren.jaeger@example.com",
              }),
            }),
          }),
        },
      },
    },

    401: {
      description:
        "Unauthorized. Authentication token is missing, invalid, or expired.",
      content: {
        "application/json": {
          schema: z.object({
            message: z.string().openapi({
              example: "Unauthorized: Missing authentication token",
            }),
          }),
        },
      },
    },

    404: {
      description: "User not found.",
      content: {
        "application/json": {
          schema: z.object({
            message: z.string().openapi({
              example: "User not found",
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
            message: z.string().openapi({
              example: "Internal server error",
            }),
          }),
        },
      },
    },
  },
});