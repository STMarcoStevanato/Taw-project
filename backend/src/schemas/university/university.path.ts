import { registry } from "../../config/openapi";  
import { z } from "../../config/openapi";

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
