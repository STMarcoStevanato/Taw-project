import { Router } from "express";
import { login } from "../controllers/user.controller";
import { logout } from "../controllers/user.controller";
import { validate } from "../middleware/validate";
import { isAuth } from "../middleware/authHandler";
import { loginSchema } from "../schemas/auth.schema";

const router = Router();

/**
 * @openapi
 * /auth/login:
 *  post:
 *    summary: User login
 *    description: Authenticates user credentials, sets the Secure HttpOnly session cookie (`access_token`), and provides the CSRF protection cookie (`XSRF-TOKEN`).
 *    tags:
 *      - Authentication
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            required:
 *              - email
 *              - password
 *            properties:
 *              email:
 *                type: string
 *                format: email
 *                example: john.doe@example.com
 *              password:
 *                type: string
 *                format: password
 *                example: SecurePass123!
 *    responses:
 *      200:
 *        description: Login successful. Authentication and CSRF cookies have been set in the headers.
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                user:
 *                  type: object
 *                  properties:
 *                    user_id:
 *                      type: string
 *                      example: "8"
 *                    name:
 *                      type: string
 *                      example: John
 *                    lastname:
 *                      type: string
 *                      example: Doe
 *                    email:
 *                      type: string
 *                      example: john.doe@example.com
 *                    role:
 *                      type: string
 *                      example: staff
 *      400:
 *        description: Validation failed (e.g., invalid email format or empty fields).
 *      401:
 *        description: Invalid email or password.
 *      500:
 *        description: Internal server error.
 */
router.post("/login", validate(loginSchema), login);

/**
 * @openapi
 * /auth/logout:
 *  post:
 *    summary: User logout
 *    description: Clears the authentication and CSRF cookies (`access_token` and `XSRF-TOKEN`) from the client browser, destroying the active session.
 *    tags:
 *      - Authentication
 *    security:
 *      - XSRFToken: []
 *    responses:
 *      200:
 *        description: Logout successful. Cookies have been cleared.
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                status:
 *                  type: string
 *                  example: success
 *                message:
 *                  type: string
 *                  example: Logged out successfully
 *      401:
 *        description: Unauthorized. Missing or invalid authentication token.
 *      403:
 *        description: Forbidden. CSRF token validation failed.
 *      500:
 *        description: Internal server error.
 */
router.post("/logout", isAuth, logout);

export default router;
