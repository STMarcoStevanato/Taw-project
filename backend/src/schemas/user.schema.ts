import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[a-z]/, "Must contain a lowercase letter")
  .regex(/[A-Z]/, "Must contain an uppercase letter")
  .regex(/[0-9]/, "Must contain a number")
  .regex(/[^a-zA-Z0-9]/, "Must contain a special character");

export const createUserSchema = z
  .object({
    body: z
      .object({
        name: z.string().min(1, "Name is required"),
        lastname: z.string().min(1, "Lastname is required"),
        email: z.string().email("Invalid email"),
        password1: passwordSchema,
        password2: passwordSchema,
        role: z.union([z.literal(1), z.literal(2), z.literal(3)]),
      })
      .refine((data) => data.password1 === data.password2, {
        message: "Passwords do not match",
        path: ["password2"], // error shown on password2
      }),
  });

export type CreateUserDTO = z.infer<typeof createUserSchema>["body"];