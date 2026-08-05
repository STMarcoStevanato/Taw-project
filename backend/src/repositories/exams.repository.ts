import { pool } from "../config/db";
import { ApplicationVersionMapping } from "../types/exams";


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

export const getMappingByVersionId = async (version_id: number): Promise<ApplicationVersionMapping | null> => {
  const query = `
    SELECT 
      jsonb_build_object(
        'version_id', v.version_id,
        'mappings', COALESCE(
          jsonb_agg(
            jsonb_build_object(
              'mapping_id', m.mapping_id,
              'foreign_course_id', m.foreign_course_id,
              'cafoscari_course_id', m.cafoscari_course_id,
              'recognized_exam', CASE 
                WHEN r.recognized_exam_id IS NOT NULL THEN
                  jsonb_build_object(
                    'recognized_exam_id', r.recognized_exam_id,
                    'exam_date', r.exam_date,
                    'foreign_score', r.foreign_score
                  )
                ELSE NULL
              END
            )
          ) FILTER (WHERE m.mapping_id IS NOT NULL),
          '[]'::jsonb
        )
      ) AS result
    FROM application_versions v
    LEFT JOIN application_version_mappings m ON v.version_id = m.version_id
    LEFT JOIN recognized_exams r ON m.mapping_id = r.mapping_id
    WHERE v.version_id = $1
    GROUP BY v.version_id;
  `;

  const result = await pool.query(query, [version_id]);
  return result.rows[0]?.result || null;
};