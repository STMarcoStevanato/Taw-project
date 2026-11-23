import { z, registry } from "../../config/openapi"; 

export const studentParamsSchema = z.object({
  studentId: z
    .string()
    .openapi({
      param: {
        name: "studentId",
        in: "path",
        required: true,
        description: "The unique ID of the student",
      },
      example: "20",
    }),
});

export const referentParamsSchema = z.object({
  referentId: z
    .string()
    .openapi({
      param: {
        name: "referentId",
        in: "path",
        required: true,
        description: "The unique ID of the referent",
      },
      example: "17",
    }),
});

export const transitionParamsSchema = z.object({
  transitionId: z
    .string()
    .openapi({
      param: {
        name: "transitionId",
        in: "path",
        required: true,
        description: "The unique ID of the transition",
      },
      example: "5",
    }),
});


const courseMappingSchema = z
  .object({
    foreign_course_id: z
      .number()
      .int()
      .positive()
      .nullable()
      .optional()
      .openapi({ example: 745 }),
    cafoscari_course_id: z
      .number()
      .int()
      .positive()
      .nullable()
      .optional()
      .openapi({ example: 646 }),
  })
  .refine(
    (data) => data.foreign_course_id != null || data.cafoscari_course_id != null,
    {
      message:
        "At least one of foreign_course_id and cafoscari_course_id must be specified.",
      path: ["foreign_course_id"], 
    }
  )
  /*.refine(
    (data) => {
      if (data.foreign_course_id != null && data.cafoscari_course_id != null) {
        return data.foreign_course_id !== data.cafoscari_course_id;
      }
      return true;
    },
    {
      message:
        "foreign_course_id and cafoscari_course_id cannot have the same ID.",
      path: ["cafoscari_course_id"], 
    }
  );*/

export const applicationBodySchema = registry.register(
  "ApplicationRequest",
  z.object({
    student_id: z.number().int().positive().openapi({ example: 20 }),

    referent_id: z.number().int().positive().openapi({ example: 17 }),

    host_institution_id: z.number().int().positive().refine((val) => val !== 1, {
      message: "host_institution_id cannot be 1 (home university).",
    }).openapi({ example: 3 }),

    academic_year: z
    .string()
    .regex(/^\d{4}\/\d{2}$/, {
    message: "Invalid format. Use the AAAA/AA format (e.g., 2025/26)",
    })
    .refine(
    (val) => {
      
      const [startYearStr, endYearStr] = val.split("/");
      const startYear = parseInt(startYearStr, 10); 
      const endYearShort = parseInt(endYearStr, 10); 

      const expectedEndYearShort = (startYear + 1) % 100;

      if (endYearShort !== expectedEndYearShort) {
        return false;
      }

      if (startYear < 2020 || startYear > 2100) {
        return false;
      }

      return true;
    },
    {
      message:
        "Invalid academic year sequence. The second year must be the consecutive year (e.g., 2025/26).",
    }
  )
  .openapi({ example: "2025/26" }),
    expected_mobility_period: z.enum(["first_semester", "second_semester", "full_year"]).openapi({ example: "first_semester" }),
    mappings: z
    .array(courseMappingSchema)
    .min(1, { message: "You must enter at least one course mapping." })
    .refine(
      (mappings) => {
        const seenPairs = new Set<string>();

        for (const m of mappings) {
          const pairKey = `${m.foreign_course_id ?? "null"}-${m.cafoscari_course_id ?? "null"}`;

          if (seenPairs.has(pairKey)) {
            return false; 
          }
          seenPairs.add(pairKey);
        }

        return true;
      },
      {
        message: "Duplicate course mappings (identical pairs) are not allowed.",
      }
    )
  })
  .refine((data) => data.student_id !== data.referent_id, {
    message: "referent_id cannot be the same as student_id.",
    path: ["referent_id"],
  })
);

export const applicationSchema = z.object({
    body: applicationBodySchema,
  });

export type ApplicationBody = z.infer<typeof applicationBodySchema>;

export type CourseMappingsInput = ApplicationBody["mappings"];
export type CourseMappingItem = ApplicationBody["mappings"][number];


export const referentApprovalSchema = registry.register(
  "ReferentApprovalRequest",
  z
    .object({
      approved: z.boolean().openapi({ example: false }),
      reason: z.string().nullable().optional().openapi({
        example: "The selected exams are not the same as those offered by Ca' Foscari",
      }),
    })
    .refine(
      (data) => {
        if (!data.approved) {
          return typeof data.reason === "string" && data.reason.trim().length > 0;
        }
        return true;
      },
      {
        message: "The (reason) parameter is required when (approved) is false",
        path: ["reason"],
      }
    )
);

export const UploadParamsSchema = registry.register(
  "UploadParams",
  z.object({
    applicationId: z.coerce
      .number({
        message: "The application ID must be a number."
      })
      .int({ message: "The application ID must be an integer." })
      .positive({ message: "The application ID must be a positive number." })
      .openapi({ example: 4 }),
      versionId: z.coerce
      .number({
        message: "The version ID must be a number."
      })
      .int({ message: "The version ID must be an integer." })
      .positive({ message: "The version ID must be a positive number." })
      .openapi({ example: 4 }),
  })
);

export const ApproveRequestSchema = registry.register(
  "ApproveRequest",
  z.object({
    params: UploadParamsSchema,
    body: referentApprovalSchema,
  })
);

export type ApproveRequest = z.infer<typeof ApproveRequestSchema>;
export type ReferentApprovalRequest = z.infer<typeof referentApprovalSchema>;


export const applicationParamsSchema = z.object({
  applicationId: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().positive({ message: "Invalid application ID format." }))
    .openapi({ example: 123 }),
});

export const updateApplicationBodySchema = registry.register(
  "UpdateApplicationRequest",
  z.object({
    host_institution_id: applicationBodySchema.shape.host_institution_id,
    academic_year: applicationBodySchema.shape.academic_year,
    expected_mobility_period: applicationBodySchema.shape.expected_mobility_period,
    mappings: applicationBodySchema.shape.mappings,
  })
);

export const updateApplicationSchema = z.object({
  params: applicationParamsSchema,
  body: updateApplicationBodySchema,
});

export type ApplicationParams = z.infer<typeof applicationParamsSchema>;
export type UpdateApplicationBody = z.infer<typeof updateApplicationBodySchema>;

export const updateApplicationMobilityDatesBodySchema = registry.register(
  "UpdateApplicationMobilityDatesRequest",
  z
    .object({
      arrival_date: z
        .string()
        .date({ message: "Invalid arrival date format. Expected YYYY-MM-DD." })
        .openapi({
          example: "2026-09-15",
          description: "Data di arrivo prevista",
        }),
      departure_date: z
        .string()
        .date({ message: "Invalid departure date format. Expected YYYY-MM-DD." })
        .openapi({
          example: "2027-02-28",
          description: "Data di partenza prevista",
        }),
    })
    
    .refine(
      (data) => new Date(data.departure_date) > new Date(data.arrival_date),
      {
        message: "departure_date must be greater than arrival_date.",
        path: ["departure_date"],
      }
    )
);

export const updateApplicationMobilityDatesSchema = z.object({
  params: applicationParamsSchema,
  body: updateApplicationMobilityDatesBodySchema,
});

export type UpdateApplicationMobilityDatesBody = z.infer<typeof updateApplicationMobilityDatesBodySchema>;
