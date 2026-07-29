import { pool } from "../config/db"; 
import { CourseMappingsInput } from "../schemas/application/application.schema";

export const createFullApplication = async (
  student_id: number,
  referent_id: number,
  host_institution_id: number,
  academic_year: string,
  expected_mobility_period: string,
  mappings: CourseMappingsInput
) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const applicationQuery = `
      INSERT INTO applications (
        student_id, 
        referent_id, 
        host_institution_id, 
        current_state_id, 
        academic_year, 
        expected_mobility_period
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING application_id, created_at;
    `;
    const initialStateId = 1; // 1 = Creation / Draft

    const applicationResult = await client.query(applicationQuery, [
      student_id,
      referent_id,
      host_institution_id,
      initialStateId,
      academic_year,
      expected_mobility_period,
    ]);
    const newApplication = applicationResult.rows[0];
    const applicationId = newApplication.application_id;

    // 2. insert of version 1 (is_active = false)
    const versionQuery = `
      INSERT INTO application_versions (application_id, version_number, is_active)
      VALUES ($1, $2, $3);
    `;
    await client.query(versionQuery, [applicationId, 1, false]);

    // 3. insert of starting transition 1
    const transitionQuery = `
      INSERT INTO application_state_transitions (
        application_id, 
        from_state_id, 
        to_state_id, 
        performed_by, 
        reason
      )
      VALUES ($1, $2, $3, $4, $5);
    `;
    await client.query(transitionQuery, [
      applicationId,
      null,
      initialStateId,
      student_id,
      "Application creation",
    ]);

    // 4. Insert of courses 
    if (mappings && mappings.length > 0) {
      
      const valueTuples: string[] = [];
      const queryParams: any[] = [];
      let paramIndex = 1;

      mappings.forEach((m) => {
        valueTuples.push(`($${paramIndex++}, $${paramIndex++}, $${paramIndex++})`);
        queryParams.push(
          applicationId,
          m.foreign_course_id ?? null,
          m.cafoscari_course_id ?? null
        );
      });

      const mappingsQuery = `
        INSERT INTO application_version_mappings (
          application_id, 
          foreign_course_id, 
          cafoscari_course_id
        )
        VALUES ${valueTuples.join(", ")};
      `;

      await client.query(mappingsQuery, queryParams);
    }

    await client.query("COMMIT");

    return {
      application_id: applicationId,
      student_id,
      referent_id,
      host_institution_id,
      academic_year,
      expected_mobility_period,
      created_at: newApplication.created_at,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};