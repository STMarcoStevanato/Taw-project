import { pool } from "../config/db";
import { University } from "../types/universities";

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