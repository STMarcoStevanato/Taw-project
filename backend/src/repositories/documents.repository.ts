import { UploadDocumentParams } from "../types/documents";
import { pool } from "../config/db";

export const insertLearningAgreement = async (

) => {
    const client = await pool.connect();

    try {

    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}

