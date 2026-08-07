import { registry, z } from "../../config/openapi";
import { applicationBodySchema, UploadParamsSchema, referentApprovalSchema, updateApplicationSchema, updateApplicationBodySchema, studentParamsSchema, referentParamsSchema, transitionParamsSchema, applicationParamsSchema, updateApplicationMobilityDatesBodySchema } from "./application.schema";
// GET REGISTRY
registry.registerPath({ // GET applications
  method: "get",
  path: "/applications",
  summary: "Retrieve all study abroad applications",
  description:
    "Fetches a list of all study abroad applications with nested student, referent, host institution, and version history details.",
  tags: ["Applications"],
  responses: {
    200: {
      description: "Applications retrieved successfully",
      content: {
        "application/json": {
          schema: z.object({
            status: z.string().openapi({ example: "success" }),
            results: z.number().openapi({ example: 1 }),
            data: z.object({
              applications: z.array(
                z.object({
                  application_id: z.string().openapi({ example: "6" }),
                  student: z.object({
                    student_id: z.string().openapi({ example: "20" }),
                    name: z.string().openapi({ example: "Eren" }),
                    lastname: z.string().openapi({ example: "Jaeger" }),
                    email: z.string().email().openapi({ example: "eren.jaeger@example.com" }),
                  }),
                  referent: z.object({
                    referent_id: z.string().openapi({ example: "22" }),
                    name: z.string().openapi({ example: "Test" }),
                    lastname: z.string().openapi({ example: "TESTREFERENT" }),
                    email: z.string().email().openapi({ example: "Test@gmail.com" }),
                  }),
                  host_institution: z.object({
                    host_institution_id: z.string().openapi({ example: "4" }),
                    name: z.string().openapi({ example: "Technical University of Munich" }),
                    country_id: z.string().openapi({ example: "3" }),
                    country_name: z.string().openapi({ example: "Germany" }),
                    city: z.string().openapi({ example: "Munich" }),
                  }),
                  current_state: z.object({
                    current_state_id: z.string().openapi({ example: "4" }),
                    name: z.string().openapi({ example: "mobility in progress" }),
                  }),
                  academic_year: z.string().openapi({ example: "2025/26" }),
                  expected_mobility_period: z
                    .enum(["first_semester", "second_semester", "full_year"])
                    .openapi({ example: "first_semester" }),
                  versions: z.array(
                    z.object({
                      version_id: z.number().openapi({ example: 6 }),
                      version_number: z.number().openapi({ example: 1 }),
                      is_active: z.boolean().openapi({ example: false }),
                      mapping: z.array(
                        z.object({
                          mapping_id: z.number().openapi({ example: 9 }),
                          foreign_course_id: z.number().openapi({ example: 745 }),
                          cafoscari_course_id: z.number().openapi({ example: 646 }),
                        })
                      ),
                    })
                  ),
                })
              ),
            }),
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

registry.registerPath({ // GET applications by student
  method: "get",
  path: "/applications/student/{studentId}",
  summary: "Retrieve applications for a specific student",
  description:
    "Fetches a list of all study abroad applications associated with a specific student, including referent, host institution, and version mapping details.",
  tags: ["Applications"],
  request: {
    params: studentParamsSchema,
  },
  responses: {
    200: {
      description: "Applications retrieved successfully",
      content: {
        "application/json": {
          schema: z.object({
            status: z.string().openapi({ example: "success" }),
            results: z.number().openapi({ example: 1 }),
            data: z.object({
              applications: z.array(
                z.object({
                  application_id: z.string().openapi({ example: "6" }),
                  referent: z.object({
                    referent_id: z.string().openapi({ example: "22" }),
                    name: z.string().openapi({ example: "Test" }),
                    lastname: z.string().openapi({ example: "TESTREFERENT" }),
                    email: z.string().email().openapi({ example: "Test@gmail.com" }),
                  }),
                  host_institution: z.object({
                    host_institution_id: z.string().openapi({ example: "4" }),
                    name: z.string().openapi({ example: "Technical University of Munich" }),
                    country_id: z.string().openapi({ example: "3" }),
                    country_name: z.string().openapi({ example: "Germany" }),
                    city: z.string().openapi({ example: "Munich" }),
                  }),
                  current_state: z.object({
                    current_state_id: z.string().openapi({ example: "4" }),
                    name: z.string().openapi({ example: "mobility in progress" }),
                  }),
                  academic_year: z.string().openapi({ example: "2025/26" }),
                  expected_mobility_period: z
                    .enum(["first_semester", "second_semester", "full_year"])
                    .openapi({ example: "first_semester" }),
                  versions: z.array(
                    z.object({
                      version_id: z.number().openapi({ example: 6 }),
                      version_number: z.number().openapi({ example: 1 }),
                      is_active: z.boolean().openapi({ example: false }),
                      mapping: z.array(
                        z.object({
                          mapping_id: z.number().openapi({ example: 9 }),
                          foreign_course_id: z.number().openapi({ example: 745 }),
                          cafoscari_course_id: z.number().openapi({ example: 646 }),
                        })
                      ),
                    })
                  ),
                })
              ),
            }),
          }),
        },
      },
    },
    404: {
      description: "Student not found.",
      content: {
        "application/json": {
          schema: z.object({
            message: z.string().openapi({ example: "Student with ID 20 does not exist." }),
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

registry.registerPath({ // GET applications by referent
  method: "get",
  path: "/applications/referent/{referentId}",
  summary: "Retrieve applications for a specific referent",
  description:
    "Fetches a list of all study abroad applications associated with a specific academic referent, including student, host institution, and version mapping details.",
  tags: ["Applications"],
  request: {
    params: referentParamsSchema,
  },
  responses: {
    200: {
      description: "Applications retrieved successfully",
      content: {
        "application/json": {
          schema: z.object({
            status: z.string().openapi({ example: "success" }),
            results: z.number().openapi({ example: 1 }),
            data: z.object({
              applications: z.array(
                z.object({
                  application_id: z.string().openapi({ example: "6" }),
                  student: z.object({
                    student_id: z.string().openapi({ example: "20" }),
                    name: z.string().openapi({ example: "Eren" }),
                    lastname: z.string().openapi({ example: "Jaeger" }),
                    email: z.string().email().openapi({ example: "eren.jaeger@example.com" }),
                  }),
                  host_institution: z.object({
                    host_institution_id: z.string().openapi({ example: "4" }),
                    name: z.string().openapi({ example: "Technical University of Munich" }),
                    country_id: z.string().openapi({ example: "3" }),
                    country_name: z.string().openapi({ example: "Germany" }),
                    city: z.string().openapi({ example: "Munich" }),
                  }),
                  current_state: z.object({
                    current_state_id: z.string().openapi({ example: "4" }),
                    name: z.string().openapi({ example: "mobility in progress" }),
                  }),
                  academic_year: z.string().openapi({ example: "2025/26" }),
                  expected_mobility_period: z
                    .enum(["first_semester", "second_semester", "full_year"])
                    .openapi({ example: "first_semester" }),
                  versions: z.array(
                    z.object({
                      version_id: z.number().openapi({ example: 6 }),
                      version_number: z.number().openapi({ example: 1 }),
                      is_active: z.boolean().openapi({ example: false }),
                      mapping: z.array(
                        z.object({
                          mapping_id: z.number().openapi({ example: 9 }),
                          foreign_course_id: z.number().openapi({ example: 745 }),
                          cafoscari_course_id: z.number().openapi({ example: 646 }),
                        })
                      ),
                    })
                  ),
                })
              ),
            }),
          }),
        },
      },
    },
    404: {
      description: "Referent not found.",
      content: {
        "application/json": {
          schema: z.object({
            message: z.string().openapi({ example: "Referent with ID 22 does not exist." }),
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

registry.registerPath({ // GET applications by transition
  method: "get",
  path: "/applications/transition/{transitionId}",
  summary: "Retrieve applications for a specific transition",
  description:
    "Fetches a list of all study abroad applications associated with a specific transition state, including student, referent, host institution, and version mapping details.",
  tags: ["Applications"],
  request: {
    params: transitionParamsSchema,
  },
  responses: {
    200: {
      description: "Applications retrieved successfully",
      content: {
        "application/json": {
          schema: z.object({
            status: z.string().openapi({ example: "success" }),
            results: z.number().openapi({ example: 1 }),
            data: z.object({
              applications: z.array(
                z.object({
                  application_id: z.string().openapi({ example: "6" }),
                  student: z.object({
                    student_id: z.string().openapi({ example: "20" }),
                    name: z.string().openapi({ example: "Eren" }),
                    lastname: z.string().openapi({ example: "Jaeger" }),
                    email: z.string().email().openapi({ example: "eren.jaeger@example.com" }),
                  }),
                  referent: z.object({
                    referent_id: z.string().openapi({ example: "22" }),
                    name: z.string().openapi({ example: "Test" }),
                    lastname: z.string().openapi({ example: "TESTREFERENT" }),
                    email: z.string().email().openapi({ example: "Test@gmail.com" }),
                  }),
                  host_institution: z.object({
                    host_institution_id: z.string().openapi({ example: "4" }),
                    name: z.string().openapi({ example: "Technical University of Munich" }),
                    country_id: z.string().openapi({ example: "3" }),
                    country_name: z.string().openapi({ example: "Germany" }),
                    city: z.string().openapi({ example: "Munich" }),
                  }),
                  current_state: z.object({
                    current_state_id: z.string().openapi({ example: "4" }),
                    name: z.string().openapi({ example: "mobility in progress" }),
                  }),
                  academic_year: z.string().openapi({ example: "2025/26" }),
                  expected_mobility_period: z
                    .enum(["first_semester", "second_semester", "full_year"])
                    .openapi({ example: "first_semester" }),
                  versions: z.array(
                    z.object({
                      version_id: z.number().openapi({ example: 6 }),
                      version_number: z.number().openapi({ example: 1 }),
                      is_active: z.boolean().openapi({ example: false }),
                      mapping: z.array(
                        z.object({
                          mapping_id: z.number().openapi({ example: 9 }),
                          foreign_course_id: z.number().openapi({ example: 745 }),
                          cafoscari_course_id: z.number().openapi({ example: 646 }),
                        })
                      ),
                    })
                  ),
                })
              ),
            }),
          }),
        },
      },
    },
    404: {
      description: "Transition not found.",
      content: {
        "application/json": {
          schema: z.object({
            message: z.string().openapi({ example: "Transition with ID 5 does not exist." }),
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

// POST REGISTRY
registry.registerPath({
  method: "post",
  path: "/applications",
  summary: "Create a new study abroad application",
  description:
    "Creates a new application version 1 with mapped course equivalencies and records the initial state transition.",
  tags: ["Applications"],
  security: [
    {
      XSRFToken: [],
    },
  ],
  request: {
    body: {
      required: true,
      content: {
        "application/json": {
          schema: applicationBodySchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Application created successfully",
      content: {
        "application/json": {
          schema: z.object({
            status: z.string().openapi({ example: "success" }),
            data: z.object({
              application_id: z.number().openapi({ example: 42 }),
              student_id: z.number().openapi({ example: 20 }),
              referent_id: z.number().openapi({ example: 17 }),
              host_institution_id: z.number().openapi({ example: 3 }),
              academic_year: z.string().openapi({ example: "2025/26" }),
              expected_mobility_period: z
                .enum(["first_semester", "second_semester", "full_year"])
                .openapi({ example: "first_semester" }),
              created_at: z
                .string()
                .datetime()
                .openapi({ example: "2026-07-28T10:00:00Z" }),
            }),
          }),
        },
      },
    },
    400: {
      description:
        "Bad Request. Validation failed (e.g. invalid academic year, invalid course IDs, or duplicate mappings).",
      content: {
        "application/json": {
          schema: z.object({
            message: z.string().openapi({
              example:
                "Duplicate course mappings (identical pairs) are not allowed.",
            }),
          }),
        },
      },
    },
    401: {
      description: "Unauthorized. Missing or invalid authentication token.",
      content: {
        "application/json": {
          schema: z.object({
            message: z.string().openapi({ example: "Unauthorized" }),
          }),
        },
      },
    },
    403: {
      description:
        "Forbidden. User lacks 'students' role or CSRF token validation failed.",
      content: {
        "application/json": {
          schema: z.object({
            message: z.string().openapi({ example: "Invalid CSRF Token" }),
          }),
        },
      },
    },
    404: {
      description: "Not Found. Student or Referent ID does not exist.",
      content: {
        "application/json": {
          schema: z.object({
            message: z.string().openapi({
              example: "Student with ID 20 does not exist.",
            }),
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

registry.registerPath({
  method: "post",
  path: "/applications/{applicationId}/version/{versionId}/referent-approval",
  summary: "Approval or rejection of the application by the referent",
  description:
    "Allows the academic referent to approve or reject a specific version of an application. In case of rejection (`approved: false`), the reason (`reason`) is mandatory.",
  tags: ["Applications"],
  security: [
    {
      XSRFToken: [],
    },
  ],
  request: {
    params: UploadParamsSchema,
    body: {
      content: {
        "application/json": {
          schema: referentApprovalSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Approval or rejection recorded successfully",
      content: {
        "application/json": {
          schema: z.object({
            status: z.string().openapi({ example: "success" }),
            data: z.object({
              application_id: z.number().openapi({ example: 4 }),
              referent_id: z.number().openapi({ example: 22 }),
              is_approved: z.boolean().openapi({ example: false }),
              reason: z.string().nullable().openapi({
                example: "The selected exams are not the same as those offered by Ca' Foscari",
              }),
              new_state_id: z.number().openapi({ example: 5 }),
            }),
          }),
        },
      },
    },
    400: {
      description: "Bad Request - Missing data, invalid IDs, or no reason provided in the event of a rejection",
      content: {
        "application/json": {
          schema: z.object({
            status: z.string().openapi({ example: "error" }),
            statusCode: z.number().openapi({ example: 400 }),
            message: z.string().openapi({
              example: "The (reason) parameter is required when (approved) is false",
            }),
          }),
        },
      },
    },
    403: {
      description: "Forbidden - The user is not the authorized referent for this application",
      content: {
        "application/json": {
          schema: z.object({
            status: z.string().openapi({ example: "error" }),
            statusCode: z.number().openapi({ example: 403 }),
            message: z.string().openapi({
              example: "Referent with ID 22 is not authorized to approve this application",
            }),
          }),
        },
      },
    },
    404: {
      description: "Not Found - Application or Version not found",
      content: {
        "application/json": {
          schema: z.object({
            status: z.string().openapi({ example: "error" }),
            statusCode: z.number().openapi({ example: 404 }),
            message: z.string().openapi({
              example: "Application with ID 4 does not exist",
            }),
          }),
        },
      },
    },
  },
});

registry.registerPath({
    method: "put",
    path: "/applications/{applicationId}",
    summary: "Update an application or request learning agreement changes",
    description: `
    Allows a student to submit a new version of their application under the following scenarios:
    1. **State REJECTED_BY_REFERENT**: Allows full modification of all fields (host institution, academic year, mobility period, and course mappings). The application transitions to \`AWAITING_LEARNING_AGREEMENT_APPROVAL_BY_REFERENT\`.
    2. **State MOBILITY_IN_PROGRESS**: Allows changes strictly to course \`mappings\`. Structural header fields (\`host_institution_id\`, \`academic_year\`, \`expected_mobility_period\`) must remain identical, and courses with already registered exams (\`recognized_exams\`) cannot be removed. The application transitions to \`AWAITING_LA_CHANGES_APPROVAL\`.
    `,
    tags: ["Applications"],
    security: [
      {
        XSRFToken: [],
      },
    ],
    request: {
      params: updateApplicationSchema.shape.params,
      body: {
        content: {
          "application/json": {
            schema: updateApplicationBodySchema,
          },
        },
        description: "Updated application details and proposed course mappings list.",
        required: true,
      },
    },
    responses: {
      200: {
        description: "Application successfully updated. A new draft version has been created.",
        content: {
          "application/json": {
            schema: z.object({
              status: z.string().openapi({ example: "success" }),
              data: z.object({
                application_id: z.number().openapi({ example: 123 }),
                version_id: z.number().openapi({ example: 2 }),
                version_number: z.number().openapi({ example: 2 }),
                current_state_id: z.number().openapi({ example: 2 }),
                host_institution_id: z.number().openapi({ example: 5 }),
                academic_year: z.string().openapi({ example: "2025/26" }),
                expected_mobility_period: z.string().openapi({ example: "first_semester" }),
              }),
            }),
          },
        },
      },
      400: {
        description: "Bad Request - Validation error or business logic constraint violation.",
        content: {
          "application/json": {
            schema: z.object({
              status: z.string().openapi({ example: "error" }),
              message: z.string().openapi({
                examples: [
                  "Cannot change host institution, academic year, or mobility period while mobility is in progress.",
                  "Cannot remove course with ID 101 because a score has already been registered for it.",
                  "One or more courses at Ca' Foscari are invalid or do not exist.",
                  "Cannot update application while in current state.",
                ],
              }),
            }),
          },
        },
      },
      401: {
        description: "Unauthorized - Missing or invalid session / CSRF token.",
      },
      403: {
        description: "Forbidden - The application does not belong to the authenticated student.",
      },
      404: {
        description: "Not Found - Application, host university, or referent not found.",
      },
    },
});

registry.registerPath({
  method: "post",
  path: "/applications/{applicationId}/version/{versionId}/staff-approval",
  summary: "Approval of the application version by the staff",
  description:
    "Allows a staff member to approve an active version of the Learning Agreement or transcript of records, and transition the application state to PRE_DEPARTURE_COMPLETED. or CLOSED.",
  tags: ["Applications"],
  security: [
    {
      XSRFToken: [],
    },
  ],
  request: {
    params: UploadParamsSchema,
  },
  responses: {
    200: {
      description: "Staff approval recorded successfully",
      content: {
        "application/json": {
          schema: z.object({
            status: z.string().openapi({ example: "success" }),
            data: z.object({
              application_id: z.number().openapi({ example: 105 }),
              from_state_id: z.number().openapi({
                example: 3,
                description: "State before transition (AWAITING_LEARNING_AGREEMENT_APPROVAL_BY_STAFF)",
              }),
              to_state_id: z.number().openapi({
                example: 4,
                description: "New state after transition (PRE_DEPARTURE_COMPLETED)",
              }),
              staff_id: z.number().openapi({ example: 42 }),
              reason: z.string().openapi({
                example: "Learning Agreement approved by staff",
              }),
            }),
          }),
        },
      },
    },
    400: {
      description: "Bad Request - Invalid application state or version not yet approved by referent",
      content: {
        "application/json": {
          schema: z.object({
            status: z.string().openapi({ example: "error" }),
            statusCode: z.number().openapi({ example: 400 }),
            message: z.string().openapi({
              example: "Application is not in a valid state for staff approval",
            }),
          }),
        },
      },
    },
    403: {
      description: "Forbidden - The user does not have the staff role",
      content: {
        "application/json": {
          schema: z.object({
            status: z.string().openapi({ example: "error" }),
            statusCode: z.number().openapi({ example: 403 }),
            message: z.string().openapi({
              example: "User is not authorized to perform staff approvals",
            }),
          }),
        },
      },
    },
    404: {
      description: "Not Found - Application or Version not found, or version does not belong to application",
      content: {
        "application/json": {
          schema: z.object({
            status: z.string().openapi({ example: "error" }),
            statusCode: z.number().openapi({ example: 404 }),
            message: z.string().openapi({
              example: "Application with ID 105 does not exist",
            }),
          }),
        },
      },
    },
  },
});

registry.registerPath({
  method: "patch",
  path: "/applications/{applicationId}/mobility-dates",
  summary: "Update the mobility dates in the application",
  description: "Set or update arrival_date and departure_date for a specific application. The departure date must be after the arrival date.",
  tags: ["Applications"],
  security: [
    {
      XSRFToken: [],
    },
  ],
  request: {
    params: applicationParamsSchema,
    body: {
      description: "Arrival and departure dates to set for the application. The departure date must be after the arrival date.",
      required: true,
      content: {
        "application/json": {
          schema: updateApplicationMobilityDatesBodySchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Mobility dates updated successfully",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              status: { type: "string", example: "success" },
              message: { type: "string", example: "Mobility dates updated successfully" },
              data: {
                type: "object",
                properties: {
                  application_id: { type: "number", example: 123 },
                  arrival_date: { type: "string", example: "2026-09-15" },
                  departure_date: { type: "string", example: "2027-02-28" },
                },
              },
            },
          },
        },
      },
    },
    400: {
      description: "error - Invalid dates or business logic violation (e.g., departure date before arrival date).",
    },
    401: {
      description: "error - User not authenticated.",
    },
    403: {
      description: "error - Access denied (Unauthorized role).",
    },
    404: {
      description: "error - Application not found.",
    },
  },
});
