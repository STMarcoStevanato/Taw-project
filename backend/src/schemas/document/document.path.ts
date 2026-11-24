import { z, registry } from "../../config/openapi";
import { UploadParamsSchema, uploadDocumentSchema , GetDocumentParamsSchema, GetDocumentQuerySchema, VersionParamsSchema, TranscriptOfRecordsPdfFileSchema} from "./document.schema"; 

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

registry.registerPath({
  method: "get",
  path: "/versions/{versionId}/learning-agreement",
  summary: "Download the Learning Agreement PDF document",
  description:
    "Generates and streams the Learning Agreement PDF document for a given application version, containing student information, academic referent details, host university details, mobility period, course mappings, and total academic credits for both the sending and receiving institutions.",
  tags: ["Documents"],
  security: [
    {
      XSRFToken: [],
    },
  ],
  request: {
    params: VersionParamsSchema,
  },
  responses: {
    200: {
      description: "PDF document generated and downloaded successfully.",
      content: {
        "application/pdf": {
          schema: z.string().openapi({
            type: "string",
            format: "binary",
            description: "The generated Learning Agreement PDF file.",
          }),
        },
      },
    },
    400: {
      description: "Bad Request - Invalid versionId parameter.",
    },
    401: {
      description: "Unauthorized - User is not authenticated.",
    },
    403: {
      description: "Forbidden - Insufficient permissions (requires 'students' role) or user does not own this application version.",
    },
    404: {
      description: "Not Found - Application version, application, or course mappings not found.",
    },
    500: {
      description: "Internal Server Error - Error generating the Learning Agreement PDF document.",
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/versions/{versionId}/records-file",
  summary: "Download the Transcript of Records PDF document",
  description:
    "Generates and streams the Transcript of Records PDF document for a given application version, containing student info, host university details, and recognized course exams.",
  tags: ["Documents"],
  security: [
    {
      XSRFToken: [],
    },
  ],
  request: {
    params: VersionParamsSchema,
  },
  responses: {
    200: {
      description: "PDF document generated and downloaded successfully.",
      content: {
        "application/pdf": {
          schema: z.string().openapi({
            type: "string",
            format: "binary",
            description: "The generated Transcript of Records PDF file.",
          }),
        },
      },
    },
    400: {
      description: "Bad Request - Invalid versionId parameter.",
    },
    401: {
      description: "Unauthorized - User is not authenticated.",
    },
    403: {
      description: "Forbidden - Insufficient permissions (requires 'students' role) or user does not own this application version.",
    },
    404: {
      description: "Not Found - Application version or document records not found.",
    },
    500: {
      description: "Internal Server Error - Error generating the PDF document.",
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/versions/{versionId}/records-file",
  summary: "Upload a Transcript of Records PDF document",
  description:
    "Uploads a Transcript of Records PDF document for the specified application version. The file is handled via multipart/form-data under the field name 'TRANSCRIPT_OF_RECORDS'.",
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
            TRANSCRIPT_OF_RECORDS: z.string().openapi({
              type: "string",
              format: "binary",
              description: "The Transcript of Records PDF file to upload (Max 10MB)",
            }),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      description: "Transcript of Records uploaded successfully.",
      content: {
        "application/json": {
          schema: z.object({
            status: z.literal("success").openapi({ example: "success" }),
            data: TranscriptOfRecordsPdfFileSchema,
          }),
        },
      },
    },
    400: {
      description:
        "Bad Request - Missing or invalid 'TRANSCRIPT_OF_RECORDS' file field, file type is not PDF, exceeds size limit, or fails validation schema.",
    },
    401: {
      description: "Unauthorized - User is not authenticated.",
    },
    403: {
      description:
        "Forbidden - Insufficient permissions (requires 'students' role) or user is not authorized to modify this application version.",
    },
    404: {
      description: "Not Found - Application version not found.",
    },
    409: {
      description: "Conflict - State transition conflict or document already uploaded for this version.",
    },
    500: {
      description: "Internal Server Error - File processing or storage error.",
    },
  },
});

registry.registerPath({
  method: "delete",
  path: "/versions/{versionId}/documents/{documentId}",
  summary: "Delete a Transcript of Records document",
  description: "Deletes the specified Transcript of Records document for the given application version.",
  tags: ["Documents"],
  security: [
    {
      XSRFToken: [],
    },
  ],
  request: {
    params: GetDocumentParamsSchema
  },
  responses: {
    204: {
      description: "Document deleted successfully.",
    },
    400: {
      description: "Bad Request - Invalid ID parameters.",
    },
    404: {
      description: "Not Found - Document not found.",
    },
    500: {
      description: "Internal Server Error - Error deleting the document.",
    },
  },
});
