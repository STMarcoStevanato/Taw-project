import { z, registry } from "../../config/openapi";
import { UploadParamsSchema, uploadDocumentSchema , GetDocumentParamsSchema, GetDocumentQuerySchema} from "./document.schema"; 

const LearningAgreementResponseSchema = registry.register(
  "LearningAgreementResponse",
  z.object({
    document_id: z.union([z.string(), z.number()]).openapi({ example: "6" }),
    version_id: z.number().openapi({ example: 4 }),
    document_type: z.string().openapi({ example: "LEARNING_AGREEMENT" }),
    file_path: z.string().openapi({ example: "learning_agreements/doc-v4-1785375385004-78023562.pdf" }),
    original_name: z.string().openapi({ example: "Learning_Agreement_Mario_Rossi.pdf" }),
    mime_type: z.string().openapi({ example: "application/pdf" }),
    file_size: z.number().openapi({ example: 2458112 }),
  })
);


registry.registerPath({
  method: "post",
  path: "/versions/{versionId}/learning-agreement",
  summary: "Upload a learning agreement document",
  description: "Uploads a learning agreement document for the specified application version.",
  tags: ["Documents"],
  security: [
    {
      XSRFToken: [],
    },
  ],
  request: {
    params: UploadParamsSchema,
    body: {
      content: {
        "multipart/form-data": {
          schema: z.object({
            LEARNING_AGREEMENT: z.string().openapi({
              type: "string",
              format: "binary",
              description: "The PDF document file to upload (Max 10MB)",
            }),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      description: "Learning agreement uploaded successfully.",
      content: {
        "application/json": {
          schema: z.object({
            status: z.literal("success").openapi({ example: "success" }),
            data: LearningAgreementResponseSchema,
          }),
        },
      },
    },
    400: {
      description: "Bad Request - Invalid parameter, invalid file type/size, or document already uploaded.",
    },
    404: {
      description: "Not Found - Version ID not found.",
    },
    409: {
      description: "Conflict - State transition conflict for this application.",
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/versions/{versionId}/documents/{documentId}",
  summary: "Get or download a document file",
  description: 
    "Retrieves a document file associated with a specific application version. " +
    "By default, returns the file with 'inline' disposition (for browser preview). " +
    "Pass ?download=true to force an 'attachment' download.",
  tags: ["Documents"],
  security: [
    {
      XSRFToken: [],
    },
  ],
  request: {
    params: GetDocumentParamsSchema,
    query: GetDocumentQuerySchema,
  },
  responses: {
    200: {
      description: "Document file retrieved successfully.",
      content: {
        "application/pdf": {
          schema: {
            type: "string",
            format: "binary",
          },
        },
        "application/octet-stream": {
          schema: {
            type: "string",
            format: "binary",
          },
        },
      },
      headers: {
        "Content-Type": {
          schema: { type: "string" },
          description: "MIME type of the file (e.g. application/pdf)",
        },
        "Content-Disposition": {
          schema: { type: "string" },
          description: "Indicates if the file should be displayed 'inline' or downloaded as 'attachment'",
        },
      },
    },
    400: {
      description: "Bad Request - Invalid ID parameters or document does not belong to the specified version.",
    },
    404: {
      description: "Not Found - Document record or physical file missing on server storage.",
    },
  },
});