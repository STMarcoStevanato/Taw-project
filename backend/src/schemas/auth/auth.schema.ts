import { z, registry } from "../../config/openapi"; 

export const LoginBodySchema = registry.register(
  "LoginRequest",
  z.object({
    email: z.string().email("Invalid email format").openapi({ example: "eren.jaeger@example.com" }),
    password: z.string().min(1, "Password is required").openapi({ example: "Password123!" }),
  })
);

export const loginSchema = z.object({
  body: LoginBodySchema,
});

export type LoginDTO = z.infer<typeof LoginBodySchema>;