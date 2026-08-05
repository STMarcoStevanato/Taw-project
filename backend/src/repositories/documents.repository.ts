import { UploadDocumentParams } from "../types/documents";
import { pool } from "../config/db";

export const insertLearningAgreement = async (
    version_id: number,
    document_type: string,
    file_path: string,
    original_name: string,
    mime_type: string,
    file_size: number,
    application_id: number,
    user_id: number,
    currentState: number,
    newState: number,
    reason: string
) => {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");
        
        const insertQueryDocument = `
            INSERT INTO documents (
                version_id,
                document_type,
                file_path,
                original_name,
                mime_type,
                file_size
            ) VALUES (
                $1,
                $2,
                $3,
                $4,
                $5,
                $6
            ) RETURNING document_id
        `;
        const documentResult = await client.query(insertQueryDocument, [
            version_id,
            document_type,
            file_path,
            original_name,
            mime_type,
            file_size,
        ]);
        const newDocument = documentResult.rows[0];
        const newDocumentId = newDocument.document_id;

        const insertQueryTransaction = `
            INSERT INTO application_state_transitions (
                application_id,
                from_state_id,
                to_state_id,
                performed_by,
                reason
            ) VALUES (
                $1,
                $2,
                $3,
                $4,
                $5
            )
        `;

        await client.query(insertQueryTransaction, [
            application_id,
            currentState,
            newState,
            user_id,
            reason
        ]);

        await client.query("COMMIT");
        return {
            document_id: newDocumentId,
            version_id,
            document_type,
            file_path,
            original_name,
            mime_type,
            file_size,
        };
        
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}

export const getDocumentByDocumentId = async (
    document_id: number,
) => {
    const query = `
        SELECT *
        FROM documents
        WHERE document_id = $1
    `;
    const result = await pool.query(query, [document_id]);
    return result.rows[0] || null;
};

export const getDocumentByVersionAndType = async (
    version_id: number,
    document_type: string
) => {
    const query = `
        SELECT *
        FROM documents
        WHERE version_id = $1 AND document_type = $2
    `;
    const result = await pool.query(query, [version_id, document_type]);
    return result.rows[0] || null;
};

