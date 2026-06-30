import * as universityRepository from "../repositories/universities.repository";
import { University } from "../types/universities";

export const getAllUniversities = async (): Promise<University[]> => {
  return universityRepository.getAllUniversities();
};
