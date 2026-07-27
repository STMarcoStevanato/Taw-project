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
    WHERE uc.university_id = 
  ` + university_id;
  
  const result = await pool.query(query);

  return result.rows.map(row => ({
    course_id: row.course_id,
    code: row.course_code,
    name: row.course_name,
    credits: row.course_credits
  }));
}