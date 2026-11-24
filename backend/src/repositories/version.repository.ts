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

export const getMappingDetail = async (mappingID: number) => {
  const query = `
    SELECT
      m.mapping_id,
      uc.university_courses_id,
      cl.course_name,
      uc.credits,
      uc.course_code,
      re.foreign_score,
      re.exam_date,
      c.course_type
    FROM application_version_mappings m
    CROSS JOIN LATERAL (
      VALUES
        (m.foreign_course_id, 'foreign'),
        (m.cafoscari_course_id, 'cafoscari')
    ) AS c(course_id, course_type)
    JOIN university_courses uc
      ON uc.university_courses_id = c.course_id
    JOIN courses_list cl ON uc.course_id = cl.course_id
    LEFT JOIN recognized_exams re ON m.mapping_id = re.mapping_id
    WHERE m.mapping_id = $1;
  `;

  const result = await pool.query(query, [mappingID]);
  return result.rows;
};