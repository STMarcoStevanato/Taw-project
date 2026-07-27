import { registry } from "../../config/openapi";  
import { z } from "../../config/openapi";

registry.registerPath({
    method: "get",
    path: "/students",
    summary: "Get all students",
    description: "Retreve a list of all the students in the system",
    tags: ["Students"],
    responses: {
        200: {
            description: "Request succesful",
            content: {
                "application/json": {
                    schema: z.object({
                        status: z.string().openapi({ example: "success" }),
                        results: z.number().openapi({ example: 1 }),
                        students: z.array(z.object({
                            student_id: z.number().openapi({ example: 10 }),
                            name: z.string().openapi({ example: "John" }),
                            lastname: z.string().openapi({ example: "Doe"}),
                            email: z.string().openapi({ example: "john.doe@example.com" }),
                        })),
                    }),
                }
            }
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
    }
})