import { getState } from "../repositories/transaction.repository";
import { State } from "../types/transactions";

let statesCache: Record<string, number> = {};
let reverseStatesCache: Record<number, string> = {};

function normalizeToKey(name: string): string {
  return name
    .trim()
    .replace(/[^\w\s]/g, '') 
    .replace(/\s+/g, '_')     
    .toUpperCase();          
}

export async function loadApplicationStates(): Promise<void> {
    try {
        const states = await getState();

        const newCache: Record<string, number> = {};
        const newReverseCache: Record<number, string> = {};

        for (const state of states) {
            const key = normalizeToKey(state.name);
            newCache[key] = Number(state.state_id);
            newReverseCache[Number(state.state_id)] = state.name;
        }

        statesCache = Object.freeze(newCache);
        reverseStatesCache = Object.freeze(newReverseCache);

    } catch (error) {
        console.error("Error loading application states:", error);
        throw new Error("Failed to load application states");
    }
}

// Helper for retrieving the state ID using the symbolic key
// Es: getState('AWAITING_LEARNING_AGREEMENT_BY_REFERENT') -> 2

export function getStateIdByName(key: string): number {
  const id = statesCache[key.toUpperCase()];
  if (!id) {
    throw new Error(`Stato non trovato per la chiave: ${key}`);
  }
  return id;
}

// Reverse helper to retrieve the original name from the ID (useful for DTOs/API responses)
// Es: getStateName(2) -> "awaiting Learning Agreement approval;"

export function getStateNameById(id: number): string {
  return reverseStatesCache[id] || 'UNKNOWN';
}


export type ApplicationStateKeys = 
  | 'CREATED'
  | 'AWAITING_LEARNING_AGREEMENT_APPROVAL_BY_REFERENT'
  | 'AWAITING_LEARNING_AGREEMENT_APPROVAL_BY_STAFF'
  | 'REJECTED_BY_REFERENT'
  | 'PRE_DEPARTURE_COMPLETED'
  | 'MOBILITY_IN_PROGRESS'
  | 'AWAITING_CHANGES_APPROVAL'
  | 'GETTING_EXAM_SCORE'
  | 'WAITING_EXAM_SCORE_APPROVAL'
  | 'CLOSED'
  | 'CANCELED';
  

export const STATES = new Proxy({} as Record<ApplicationStateKeys, number>, {
  get: (_, prop: string) => getStateIdByName(prop)
});