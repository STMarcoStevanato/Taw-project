import { pool } from "../config/db";
import { Transaction, State } from "../types/transactions";

export const getTransactionByIdApplicationIdAndStates = async (applicationId: number, fromState: number|null, toState:number): Promise<Transaction> => {
    const query = `
    SELECT * FROM application_state_transitions
    where application_id = $1 
    AND from_state_id IS NOT DISTINCT FROM $2
    AND to_state_id = $3;
    `;

    const result =  await pool.query(query, [applicationId,fromState,toState]);
    return result.rows[0] || null;
}

export const getState = async (): Promise<State[]> => {
    const query = `
    SELECT state_id, name FROM application_states;
    `;

    const result =  await pool.query(query);
    return result.rows;
}
