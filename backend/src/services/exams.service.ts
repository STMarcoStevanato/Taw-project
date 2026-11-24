import { STATES } from "../config/STATE";
import { getMappingDetail } from "../repositories/version.repository"
import * as applicationRepository from "../repositories/application.repository";
import * as examRepository from "../repositories/exams.repository"; // Create or adjust import path as needed

export const createRecognizedExam = async (
  user_id: number,
  mapping_id: number,
  exam_date: string,
  foreign_score: number
) => {
  const mapping = await examRepository.getMappingById(mapping_id);
  if (!mapping) {
    const error = new Error(`Mapping with ID ${mapping_id} does not exist`) as any;
    error.statusCode = 404;
    throw error;
  }

  const application = await applicationRepository.getApplicationById(mapping.application_id);
  if (!application) {
    const error = new Error(`Application with ID ${mapping.application_id} does not exist`) as any;
    error.statusCode = 404;
    throw error;
  }

  if (Number(application.student_id) !== user_id) {
    const error = new Error("User is not authorized to record exams for this application") as any;
    error.statusCode = 403;
    throw error;
  }

  if (!(Number(application.current_state_id) === STATES.MOBILITY_IN_PROGRESS || Number(application.current_state_id) === STATES.AWAITING_CHANGES_APPROVAL)) {
    const error = new Error("Exams can only be recorded when application is in MOBILITY_IN_PROGRESS or AWAITING_CHANGES_APPROVAL state") as any;
    error.statusCode = 400;
    throw error;
  }

  const isActiveVersion = await examRepository.isMappingInActiveVersion(
    mapping.application_id,
    mapping_id
  );
  if (!isActiveVersion) {
    const error = new Error(`Mapping ${mapping_id} is not part of the active application version`) as any;
    error.statusCode = 400;
    throw error;
  }

  const recognizedExam = await examRepository.getRecognizedExamsByMappingId(mapping_id);
  if (recognizedExam) {
    const error = new Error(`An exam has already been recorded for mapping ${mapping_id}`) as any;
    error.statusCode = 400;
    throw error;
  }

  const examDay = exam_date.slice(0, 10);
  const arrivalDay = new Date(application.arrival_date).toISOString().slice(0, 10);

  if (examDay < arrivalDay) {
    const error = new Error("Exam date cannot be before application arrival date") as any;
    error.statusCode = 400;
    throw error;
  }

  const newExam = await examRepository.createRecognizedExam(
    mapping_id,
    exam_date,
    foreign_score
  );

  return newExam;
};

export const getExams = async (mapping_id: number) => {

  const mapping = await examRepository.getMappingById(mapping_id);
  if (!mapping) {
    const error = new Error(`Mapping with ID ${mapping_id} does not exist`) as any;
    error.statusCode = 404;
    throw error;
  }

  return await getMappingDetail(mapping_id);
}