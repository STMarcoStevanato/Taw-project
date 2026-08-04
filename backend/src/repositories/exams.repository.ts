import { pool } from "../config/db";


export const getMappingById = async (mappingId: number) => {
  const query = `
    SELECT 
      avm.mapping_id,
      avm.version_id,
      avm.foreign_course_id,
      avm.cafoscari_course_id,
      av.application_id
    FROM application_version_mappings avm
    JOIN application_versions av ON avm.version_id = av.version_id
    WHERE avm.mapping_id = $1;
  `;
  const result = await pool.query(query, [mappingId]);
  return result.rows[0] || null;
};

export const isMappingInActiveVersion = async (
  applicationId: number,
  mappingId: number
): Promise<boolean> => {
  const query = `
    SELECT 1
    FROM application_version_mappings avm
    JOIN application_versions av ON avm.version_id = av.version_id
    WHERE av.application_id = $1 
      AND av.is_active = true 
      AND avm.mapping_id = $2;
  `;
  const result = await pool.query(query, [applicationId, mappingId]);
  return result.rowCount !== null && result.rowCount > 0;
};

export const createRecognizedExam = async (
  mapping_id: number,
  exam_date: string,
  foreign_score: number
) => {
  const query = `
    INSERT INTO recognized_exams (
      mapping_id, 
      exam_date, 
      foreign_score, 
      created_at
    )
    VALUES ($1, $2, $3, NOW())
    RETURNING recognized_exam_id, mapping_id, exam_date, foreign_score, created_at;
  `;

  const result = await pool.query(query, [
    mapping_id,
    exam_date,
    foreign_score,
  ]);

  return result.rows[0];
};

export const getRecognizedExamsByMappingId = async (mappingId: number) => {
  const query = `
    SELECT 
      recognized_exam_id,
      mapping_id,
      exam_date,
      foreign_score,
      created_at
    FROM recognized_exams
    WHERE mapping_id = $1;
  `;
  const result = await pool.query(query, [mappingId]);
  return result.rows[0] || null;
};