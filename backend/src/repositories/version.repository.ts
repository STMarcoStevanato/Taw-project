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

export const getPassedExamsForActiveVersion = async (applicationId: number) => {
  const query = `
    SELECT 
      m.foreign_course_id, 
      m.cafoscari_course_id,
      re.recognized_exam_id,
      re.foreign_score
    FROM application_versions v
    JOIN application_version_mappings m ON v.version_id = m.version_id
    JOIN recognized_exams re ON m.mapping_id = re.mapping_id
    WHERE v.application_id = $1 
      AND v.is_active = true;
  `;

  const result = await pool.query(query, [applicationId]);
  return result.rows; 
};