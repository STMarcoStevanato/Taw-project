import { z, registry } from "../../config/openapi"; 

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[a-z]/, "Must contain a lowercase letter")
  .regex(/[A-Z]/, "Must contain an uppercase letter")
  .regex(/[0-9]/, "Must contain a number")
  .regex(/[^a-zA-Z0-9]/, "Must contain a special character");

export const CreateUserBodySchema = registry.register(
  "CreateUserRequest",
  z.object({
    name: z.string().min(1, "Name is required").openapi({ example: "Eren" }),
    lastname: z.string().min(1, "Lastname is required").openapi({ example: "Jaeger" }),
    email: z.string().email("Invalid email").openapi({ example: "eren.jaeger@example.com" }),
    password1: passwordSchema.openapi({ example: "Password123!" }),
    password2: passwordSchema.openapi({ example: "Password123!" }),
    role: z.union([z.literal(1), z.literal(2), z.literal(3)])
      .openapi({ 
        description: "User role: 1 = Admin, 2 = Teacher, 3 = Student", 
        example: 3 
      }),
  })
);

export const createUserSchema = z.object({
  body: CreateUserBodySchema.refine((data) => data.password1 === data.password2, {
    message: "Passwords do not match",
    path: ["password2"], 
  }),
});


export type CreateUserDTO = z.infer<typeof CreateUserBodySchema>;