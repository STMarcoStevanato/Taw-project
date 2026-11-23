import { pool } from "../config/db";
import { UserWithRole } from "../types/user";

export const createUser = async (name: string, lastname: string, email: string, password: string, roleTableName: string) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN"); 
    
    const userQuery = `
      INSERT INTO users (name, lastname, email, password)
      VALUES ($1, $2, $3, $4)
      RETURNING user_id, name, lastname, email;
    `;
    const userResult = await client.query(userQuery, [name, lastname, email, password]);
    const newUser = userResult.rows[0];

    
    const userRoleQuery = `
      INSERT INTO ${roleTableName} (user_id)
      VALUES ($1);
    `;
    await client.query(userRoleQuery, [newUser.user_id]);

    await client.query("COMMIT"); 
    
    return { ...newUser, role: roleTableName };

  } catch (error) {
    await client.query("ROLLBACK"); 
    throw error;
  } finally {
    client.release(); 
  }
};

export const findUserByEmail = async (email: string) => {
  const query = `
    SELECT * FROM users 
    WHERE email = $1;
  `;
  
  const result = await pool.query(query, [email]);
  
  return result.rows[0] || null;
};

export const findUserByEmailWithRole = async (email:string) => {
  const query = `
    SELECT 
      u.user_id, 
      u.name, 
      u.lastname, 
      u.email, 
      u.password,
      CASE 
        WHEN s.user_id IS NOT NULL THEN 'students'
        WHEN st.user_id IS NOT NULL THEN 'staff'
        WHEN r.user_id IS NOT NULL THEN 'referents'
        ELSE 'none'
      END as role
    FROM users u
    LEFT JOIN students s ON u.user_id = s.user_id
    LEFT JOIN staff st ON u.user_id = st.user_id
    LEFT JOIN referents r ON u.user_id = r.user_id
    WHERE u.email = $1;
  `;

  const result = await pool.query(query, [email]);
  return result.rows[0] || null;
}

export const getReferents = async (): Promise<UserWithRole[]> => {
  const query = `
      SELECT 
      r.user_id,
      u.name,
      u.lastname,
      u.email
    FROM public.referents r
    INNER JOIN public.users u ON r.user_id = u.user_id
    ORDER BY u.lastname ASC, u.name ASC;
  `;

  const result = await pool.query(query);
  return result.rows;
};

export const findStudentById = async (studentId: number): Promise<boolean> => {
  const query = `
    SELECT EXISTS (
      SELECT 1 
      FROM public.students 
      WHERE user_id = $1
    );
  `;

  const result = await pool.query(query, [studentId]);
  return result.rows[0].exists;
};

export const findReferentById = async (referentId: number): Promise<boolean> => {
  const query = `
    SELECT EXISTS (
      SELECT 1 
      FROM public.referents 
      WHERE user_id = $1
    );
  `;

  const result = await pool.query(query, [referentId]);
  return result.rows[0].exists;
};

export const getUserById = async (userId: number) => {
  const query = `
    SELECT
      u.user_id,
      u.name,
      u.lastname,
      u.email,
      CASE
        WHEN s.user_id IS NOT NULL THEN 'students'
        WHEN st.user_id IS NOT NULL THEN 'staff'
        WHEN r.user_id IS NOT NULL THEN 'referents'
        ELSE NULL
      END AS role
    FROM public.users u
    LEFT JOIN public.students s ON u.user_id = s.user_id
    LEFT JOIN public.staff st ON u.user_id = st.user_id
    LEFT JOIN public.referents r ON u.user_id = r.user_id
    WHERE u.user_id = $1;
  `;

  const result = await pool.query(query, [userId]);

  return result.rows[0] ?? null;
};