import { pool } from "../config/db";
import { ApplicationVersionInfo } from "../types/applications";

export const getApplicationVersionById = async (versionId: number): Promise<ApplicationVersionInfo> => {
    const query = `
    SELECT * FROM application_versions
    where version_id = $1;
    `;

    const result =  await pool.query(query, [versionId]);
    return result.rows[0] || null;
}