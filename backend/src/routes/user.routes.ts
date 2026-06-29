import { Router } from "express";
import { createUser } from "../controllers/user.controller";
import { validate } from "../middleware/validate";
import { createUserSchema } from "../schemas/user.schema";


const router = Router();

/**
 * @openapi
 * /users:
 *  post:
 *    summary: Register a new user
 *    description: Creates a new user account with a specific role (Student, Staff, or Referent) after validating input data.
 *    tags:
 *      - Users
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            required:
 *              - name
 *              - lastname
 *              - email
 *              - password1
 *              - password2
 *              - role
 *            properties:
 *              name:
 *                type: string
 *                example: John
 *              lastname:
 *                type: string
 *                example: Doe
 *              email:
 *                type: string
 *                format: email
 *                example: john.doe@example.com
 *              password1:
 *                type: string
 *                format: password
 *                description: At least 8 chars, 1 lowercase, 1 uppercase, 1 number, 1 special.
 *                example: SecurePass123!
 *              password2:
 *                type: string
 *                format: password
 *                description: Must match password1 exactly.
 *                example: SecurePass123!
 *              role:
 *                type: integer
 *                enum: [1, 2, 3]
 *                description: "1 = Students, 2 = Staff, 3 = Referents"
 *                example: 1
 *    responses:
 *      201:
 *        description: User created successfully.
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                id:
 *                  type: integer
 *                  example: 15
 *                name:
 *                  type: string
 *                  example: John
 *                lastname:
 *                  type: string
 *                  example: Doe
 *                email:
 *                  type: string
 *                  example: john.doe@example.com
 *                role:
 *                  type: string
 *                  example: students
 *      400:
 *          description: Validation failed (e.g., weak password, mismatched passwords).
 *      500:
 *          description: Internal server error.
 */
router.post("/", validate(createUserSchema), createUser);

export default router;
