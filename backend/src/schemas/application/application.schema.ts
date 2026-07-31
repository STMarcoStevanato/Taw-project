import { z, registry } from "../../config/openapi"; 

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
  .refine(
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
  );

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
      applicationId: z.coerce.number().int().positive().openapi({ example: 1 }),
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

export type ReferentApprovalRequest = z.infer<typeof referentApprovalSchema>;
