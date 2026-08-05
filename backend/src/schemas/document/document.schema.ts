import { z, registry } from "../../config/openapi";

export const DocumentTypeEnum = z.enum([
  'LEARNING_AGREEMENT',
  'TRANSCRIPT_OF_RECORDS'
]);

export const UploadParamsSchema = registry.register(
  "UploadParams",
  z.object({
    versionId: z.coerce
      .number({
        message: "The version ID must be a number."
      })
      .int({ message: "The version ID must be an integer." })
      .positive({ message: "The version ID must be a positive number." })
      .openapi({ example: 4 }),
  })
);

export const PdfFileSchema = registry.register(
  "PdfFile",
  z.object({
    fieldname: z.string().openapi({ example: "learning_agreement" }),
    originalname: z.string({
        message: 'The original file name is required.'
    }).openapi({ example: "Learning_Agreement_Mario_Rossi.pdf" }),
    encoding: z.string().openapi({ example: "7bit" }),
    mimetype: z
    .literal('application/pdf', {
      message: 'The file must be in PDF format only.'
    })
    .openapi({ example: "application/pdf" }),
    size: z
      .number()
      .positive()
      .max(10 * 1024 * 1024, {
        message: 'The file size cannot exceed 10 MB.'
      })
      .openapi({ example: 2458112 }),
    path: z.string({
        message: 'The file path is required.'
    }).openapi({ example: "uploads/learning_agreements/LA-v4-1722211200.pdf" }),
  })
);

export const TranscriptOfRecordsPdfFileSchema = registry.register(
  "TranscriptOfRecordsPdfFile",
  z.object({
    fieldname: z.string().openapi({ example: "TRANSCRIPT_OF_RECORDS" }),
    originalname: z.string({
      message: 'The original file name is required.'
    }).openapi({ example: "Transcript_of_Records_Eren_Jaeger.pdf" }),
    encoding: z.string().openapi({ example: "7bit" }),
    mimetype: z
      .literal('application/pdf', {
        message: 'The file must be in PDF format only.'
      })
      .openapi({ example: "application/pdf" }),
    size: z
      .number()
      .positive()
      .max(10 * 1024 * 1024, {
        message: 'The file size cannot exceed 10 MB.'
      })
      .openapi({ example: 2458112 }),
    path: z.string({
      message: 'The file path is required.'
    }).openapi({ example: "transcripts_of_records/TOR-v10-1722822000.pdf" }),
  })
);


export const uploadDocumentSchema = z.object({
  params: UploadParamsSchema,
  file: PdfFileSchema,
});

export type UploadParamsDTO = z.infer<typeof UploadParamsSchema>;
export type PdfFileDTO = z.infer<typeof PdfFileSchema>;


export const GetDocumentParamsSchema = registry.register(
  "GetDocumentParams",
  z.object({
    versionId: z.coerce
      .number({ message: "The version ID must be a number." })
      .int()
      .positive({ message: "The version ID must be a positive integer." })
      .openapi({ example: 4 }),
    documentId: z.coerce
      .number({ message: "The document ID must be a number." })
      .int()
      .positive({ message: "The document ID must be a positive integer." })
      .openapi({ example: 6 }),
  })
);

export const GetDocumentQuerySchema = registry.register(
  "GetDocumentQuery",
  z.object({
    download: z
      .enum(["true", "false"])
      .optional()
      .openapi({
        example: "true",
        description: "If set to 'true', forces file download instead of inline preview.",
      }),
  })
);

export const VersionParamsSchema = z.object({
  versionId: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().positive())
    .openapi({
      param: {
        name: "versionId",
        in: "path",
      },
      type: "integer",
      example: 10,
      description: "ID univoco della versione dell'application",
    }),
});