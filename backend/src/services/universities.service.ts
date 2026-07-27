import * as universityRepository from "../repositories/universities.repository";
import { University } from "../types/universities";
import { Course } from "../types/courses";

export const getAllUniversities = async (): Promise<University[]> => {
  return universityRepository.getAllUniversities();
};

export const getUniversityCourses = async (university_id: number): Promise<Course[]> => {
  return universityRepository.getUniversityCourses(university_id);
}