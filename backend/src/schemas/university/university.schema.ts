import { z, registry } from "../../config/openapi";

export const CourseSchema = z.object({
  course_id: z.number().openapi({ example: 101 }),
  name: z.string().openapi({ example: "Computer Science" }),
  credits: z.number().openapi({ example: 6 }),
});