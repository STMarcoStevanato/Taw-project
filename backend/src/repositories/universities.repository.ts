import { pool } from "../config/db";
import { University } from "../types/universities";
import { Course } from "../types/courses";

export const getAllUniversities = async (): Promise<University[]> => {
  const query = `
    SELECT 
      u.university_id, 
      u.name, 
      u.city, 
      c.country_id, 
      c.name AS country_name
    FROM universities u
    JOIN countries c ON u.country_id = c.country_id;
  `;

  const result = await pool.query(query);
  
  return result.rows.map(row => ({
    university_id: row.university_id,
    name: row.name,
    city: row.city,
    Countries: {
      country_id: row.country_id,
      name: row.country_name
    }
  }));
};

export const getUniversityCourses = async (university_id: number): Promise<Course[]> => {
  const query = `
    SELECT c.course_id, uc.course_code, c.course_name, uc.credits
    FROM university_courses uc
    JOIN courses_list c ON uc.course_id = c.course_id
    WHERE uc.university_id = $1
  `;
  
  const result = await pool.query(query);

  return result.rows.map(row => ({
    course_id: row.course_id,
    code: row.course_code,
    name: row.course_name,
    credits: row.course_credits
  }));
}

export const getValidCourseIds = async (courseIds: number[], university_id: number): Promise<number[]> => {
  if (courseIds.length === 0) return [];
  const query = `
    SELECT uc.course_id
    FROM university_courses uc
    WHERE uc.university_id = $2
      AND uc.course_id = ANY($1::bigint[]);
  `;

  const result = await pool.query(query, [courseIds, university_id]);

  // Returns an array containing only the IDs found, e.g., [642, 643]
  return result.rows.map((row) => Number(row.course_id));
};

export const findUniversityById = async (university_id: number): Promise<boolean> => {
  const query = `
    SELECT EXISTS (
      SELECT 1 
      FROM public.universities 
      WHERE university_id = $1
    );
  `;

  const result = await pool.query(query, [university_id]);
  return result.rows[0].exists;
}

export const getUniversityById = async (university_id: number): Promise<University | null> => {
  const query = `
    SELECT 
      u.university_id, 
      u.name, 
      u.city, 
      c.country_id, 
      c.name AS country_name
    FROM universities u
    JOIN countries c ON u.country_id = c.country_id
    WHERE u.university_id = $1;
  `;

  const result = await pool.query(query, [university_id]);

  if (result.rows.length === 0) {
    return null; // University not found
  }

  const row = result.rows[0];
  return {
    university_id: row.university_id,
    name: row.name,
    city: row.city,
    Countries: {
      country_id: row.country_id,
      name: row.country_name
    }
  };
};  