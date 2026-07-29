export interface UploadDocumentParams {
    versionId: number;
    applicationId: number;
    documentType: "LEARNING_AGREEMENT" | "TRANSCRIPT_OF_RECORDS";
    filePath: string;
    originalName: string;
    mimeType: string;
    fileSize: number;
    fromStateId?: number | null;
    toStateId?: number | null;
    performedBy?: number | null;
    reason?: string | null;
  }
  
