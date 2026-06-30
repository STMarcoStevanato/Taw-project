import { Router } from "express";
import { getReferents } from "../controllers/user.controller";
import { isAuth } from "../middleware/authHandler";

const router = Router();

/**
 * @openapi
 * /referents:
 *  get:
 *    summary: Get all referents with details
 *    description: Retrieves a list of all registered referents, including their profile details (name, lastname, email) from the users table.
 *    tags:
 *      - Referents
 *    security:
 *      - XSRFToken: []
 *    responses:
 *      200:
 *        description: A list of referents retrieved successfully.
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                status:
 *                  type: string
 *                  example: success
 *                results:
 *                  type: integer
 *                  example: 1
 *                data:
 *                  type: object
 *                  properties:
 *                    referents:
 *                      type: array
 *                      items:
 *                        type: object
 *                        properties:
 *                          user_id:
 *                            type: integer
 *                            example: 12
 *                          name:
 *                            type: string
 *                            example: Anton
 *                          lastname:
 *                            type: string
 *                            example: Čechov
 *                          email:
 *                            type: string
 *                            example: Anton.Cechov@example.com
 *      401:
 *        description: Unauthorized. Missing or invalid authentication token.
 *      500:
 *        description: Internal server error.
 */

router.get("/", isAuth, getReferents);

export default router;
