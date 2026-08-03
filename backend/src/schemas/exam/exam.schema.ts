import { z, registry } from "../../config/openapi";

export const createExamBodySchema = registry.register(
  "CreateExamRequest",
  z.object({
    mapping_id: z
      .number()
      .int()
      .positive()
      .openapi({ example: 42 }),

    exam_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, {
        message: "Invalid date format. Use YYYY-MM-DD format (e.g., 2026-05-20).",
      })
      .openapi({ example: "2026-05-20" }),

    foreign_score: z
      .number()
      .int()
      .min(0, { message: "Score cannot be negative." })
      .openapi({ example: 28 }),
  })
);

export const createExamSchema = z.object({
  body: createExamBodySchema,
});

export type CreateExamBody = z.infer<typeof createExamBodySchema>;
export type CreateExamInput = z.infer<typeof createExamSchema>;