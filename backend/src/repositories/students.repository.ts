import { pool } from "../config/db";
import { Student } from "../types/students"

export const getAllStudents = async (): Promise<Student[]> => {
    const query = `
        SELECT u.user_id, u.name, u.lastname, u.email
        FROM users u 
        JOIN students s ON u.user_id = s.user_id;
    `;

    const result = await pool.query(query);

    return result.rows.map(row => ({
        student_id: row.student_id,
        name: row.name,
        lastname: row.lastname,
        email: row.email, 
    }));
};