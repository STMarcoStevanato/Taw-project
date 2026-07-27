import * as StudentRepository from "../repositories/students.repository"
import { Student } from "../types/students"

export const getAllStudents = async (): Promise<Student[]> => {
    return StudentRepository.getAllStudents();
}