import { STATES } from "../config/STATE";
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

  if (Number(application.current_state_id) !== STATES.MOBILITY_IN_PROGRESS) {
    const error = new Error("Exams can only be recorded when application is in MOBILITY_IN_PROGRESS state") as any;
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

  const newExam = await examRepository.createRecognizedExam(
    mapping_id,
    exam_date,
    foreign_score
  );

  return newExam;
};