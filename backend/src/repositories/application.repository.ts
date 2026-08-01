import { pool } from "../config/db"; 
import { CourseMappingsInput } from "../schemas/application/application.schema";
import { STATES } from "../config/STATE";

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
    const initialStateId = STATES.CREATED;

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
      VALUES ($1, $2, $3)
      RETURNING version_id;
    `;
    const versionResult = await client.query(versionQuery, [applicationId, 1, false]);
    const versionId = versionResult.rows[0].version_id;

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
          versionId,
          m.foreign_course_id ?? null,
          m.cafoscari_course_id ?? null
        );
      });

      const mappingsQuery = `
        INSERT INTO application_version_mappings (
          version_id, 
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

export const getApplicationById = async (application_id: number) => {
  const query = `
    SELECT * FROM applications WHERE application_id = $1;
  `;
  const result = await pool.query(query, [application_id]);
  return result.rows[0];
};

export const postReferentApproval = async (
  application_id: number,
  version_id: number,
  referent_id: number,
  is_approved: boolean,
  reason: string | null,
  current_state_id: number,
  new_state_id: number
) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const updateApplicationQuery = `
      UPDATE application_versions
      SET is_active = false
      WHERE application_id = $1 AND version_id = $2;
    `;
    await client.query(updateApplicationQuery, [application_id, version_id]);

    const insertTransitionQuery = `
      INSERT INTO application_state_transitions (
        application_id,
        from_state_id,
        to_state_id,
        performed_by,
        reason
      )
      VALUES ($1, $2, $3, $4, $5);
    `;
    await client.query(insertTransitionQuery, [
      application_id,
      current_state_id,
      new_state_id,
      referent_id,
      reason
    ]);

    await client.query("COMMIT");
    return {
      application_id,
      referent_id,
      is_approved,
      reason,
      new_state_id
    };

  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
  
}

export const updateApplication = async (
  application_id: number,
  student_id: number,
  host_institution_id: number,
  academic_year: string,
  expected_mobility_period: string,
  mappings: CourseMappingsInput,
  current_state: number,
  next_state: number
) => {
  const client = await pool.connect();
  try {

    await client.query("BEGIN");

    // 1. Update to the main application and status update
    const updateAppQuery = `
      UPDATE applications
      SET 
        host_institution_id = $1,
        academic_year = $2,
        expected_mobility_period = $3,
        current_state_id = $4
      WHERE application_id = $5
      RETURNING application_id;
    `;

    await client.query(updateAppQuery, [
      host_institution_id,
      academic_year,
      expected_mobility_period,
      next_state,
      application_id,
    ]);

    // 2. Calculating the next version_number (MAX + 1)
    const maxVersionQuery = `
      SELECT COALESCE(MAX(version_number), 0) + 1 AS next_version
      FROM application_versions
      WHERE application_id = $1;
    `;
    const versionNumResult = await client.query(maxVersionQuery, [application_id]);
    const nextVersionNumber = versionNumResult.rows[0].next_version;

    // 3. Inserting the NEW version (is_active = false waiting for approval)
    const versionQuery = `
      INSERT INTO application_versions (application_id, version_number, is_active)
      VALUES ($1, $2, $3)
      RETURNING version_id;
    `;
    const versionResult = await client.query(versionQuery, [
      application_id,
      nextVersionNumber,
      false, // The new version will only be activated if the referent approves
    ]);
    const newVersionId = versionResult.rows[0].version_id;

    // 4. Historical Context of the State Transition
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
      application_id,
      current_state,
      next_state,
      student_id,
      `Application updated to version ${nextVersionNumber}`,
    ]);

    // 5. Inserting the new course mappings for this version
    if (mappings && mappings.length > 0) {
      const valueTuples: string[] = [];
      const queryParams: any[] = [];
      let paramIndex = 1;

      mappings.forEach((m) => {
        valueTuples.push(`($${paramIndex++}, $${paramIndex++}, $${paramIndex++})`);
        queryParams.push(
          newVersionId, // Linked to the NEW version created
          m.foreign_course_id ?? null,
          m.cafoscari_course_id ?? null
        );
      });

      const mappingsQuery = `
        INSERT INTO application_version_mappings (
          version_id, 
          foreign_course_id, 
          cafoscari_course_id
        )
        VALUES ${valueTuples.join(", ")};
      `;

      await client.query(mappingsQuery, queryParams);
    }

    await client.query("COMMIT");

    return {
      application_id,
      version_id: newVersionId,
      version_number: nextVersionNumber,
      current_state_id: next_state,
      host_institution_id,
      academic_year,
      expected_mobility_period,
    };

  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}