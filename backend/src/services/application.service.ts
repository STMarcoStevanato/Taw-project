import { CourseMappingsInput } from "../schemas/application/application.schema"
import { findStudentById } from "../repositories/user.repository";
import { findReferentById } from "../repositories/user.repository";
import { getValidCourseIds }from "../repositories/universities.repository"
import { findUniversityById } from "../repositories/universities.repository";
import { getDocumentByVersionAndType } from "../repositories/documents.repository";
import { getApplicationVersionById, getPassedExamsForActiveVersion } from "../repositories/version.repository"
import { STATES } from "../config/STATE";
import * as applicationRepository from "../repositories/application.repository";
import { Application } from "../types/applications";
import { from } from "node:stream/iter";

export const getAllApplications = async (): Promise<Application[]> => {
    return applicationRepository.getAllApplications();
}

export const getStudentApplications = async (studentId: number): Promise<Application[]> => {
    return applicationRepository.getStudentApplications(studentId);
}

export const getReferentApplications = async (referentId: number): Promise<Application[]> => {
    return applicationRepository.getReferentApplications(referentId);
}

export const getTransitionApplications = async (transitionId: number): Promise<Application[]> => {
    return applicationRepository.getTransitionApplications(transitionId);
}

const validateCoursesAndHostInstitution = async (
  host_institution_id: number,
  mappings: CourseMappingsInput
) => {
  const isHostInstitution = await findUniversityById(host_institution_id);
  if (!isHostInstitution) {
    const error = new Error(`University with ID ${host_institution_id} does not exist`) as any;
    error.statusCode = 404;
    throw error;
  }

  /// Let's extract the Ca' Foscari courses and those from the foreign university from the mappings list
  const cafoscariIds = mappings
    .map((m) => m.cafoscari_course_id)
    .filter((id): id is number => id != null);

  const foreignIds = mappings
    .map((m) => m.foreign_course_id)
    .filter((id): id is number => id != null);

  //getValidCourseIds remove any courses that do not belong to the university from cafoscariIds and foreignIds
  const CAFOSCARI_UNIVERSITY_ID = 1; // Assuming 1 is the ID for Ca' Foscari University
  const [validCafoscariIds, validForeignIds] = await Promise.all([
    getValidCourseIds(cafoscariIds, CAFOSCARI_UNIVERSITY_ID),
    getValidCourseIds(foreignIds, host_institution_id),
  ]);

  const allCafoscariValid = cafoscariIds.every((id) =>
    validCafoscariIds.includes(id)
  );

  if (!allCafoscariValid) {
    const error = new Error("One or more courses at Ca' Foscari are invalid or do not exist.") as any;
    error.statusCode = 400;
    throw error;
  }

  const allForeignValid = foreignIds.every((id) =>
    validForeignIds.includes(id)
  );

  if (!allForeignValid) {
    const error = new Error("One or more courses at the host university are not valid for the selected institution.") as any;
    error.statusCode = 400;
    throw error;
  }
};

export const createApplication = async (
    student_id: number,
    referent_id: number,
    host_institution_id: number,
    academic_year: string, 
    expected_mobility_period: "first_semester" | "second_semester" | "full_year",
    mappings: CourseMappingsInput
) => {

    const isStudent = await findStudentById(student_id);
    if (!isStudent) {
        const error = new Error("Student with ID ${student_id} does not exist or is not a registered student") as any;
        error.statusCode = 404;
        throw error;
    }

    const isReferent = await findReferentById(referent_id);
    if (!isReferent) {
        const error = new Error("Referent with ID ${referent_id} does not exist or is not a registered referent") as any;
        error.statusCode = 404;
        throw error;
    }

    await validateCoursesAndHostInstitution(host_institution_id, mappings);

    const newApplication = await applicationRepository.createFullApplication(
        student_id,
        referent_id,
        host_institution_id,
        academic_year,
        expected_mobility_period,
        mappings
      );
    
      return newApplication;
};

export const referentApproval = async (
    application_id: number,
    version_id: number,
    referent_id: number,
    is_approved: boolean,
    reason: string | null
) => {
    const application = await applicationRepository.getApplicationById(application_id);
    if (!application) {
        const error = new Error(`Application with ID ${application_id} does not exist`) as any;
        error.statusCode = 404;
        throw error;
    }

    if (Number(application.referent_id) !== referent_id) {
        const error = new Error(`Referent with ID ${referent_id} is not authorized to approve this application`) as any;
        error.statusCode = 403;
        throw error;
    }

    if (!(
        Number(application.current_state_id) === STATES.AWAITING_LEARNING_AGREEMENT_APPROVAL_BY_REFERENT ||
        Number(application.current_state_id) === STATES.REJECTED_BY_REFERENT ||
        Number(application.current_state_id) === STATES.AWAITING_CHANGES_APPROVAL
    )) {
        const error = new Error('Application is not in a valid state for approval') as any;
        error.statusCode = 400;
        throw error;
    }

    const version = await getApplicationVersionById(version_id);

    if (!version) {
        const error = new Error(`Version with ID ${version_id} does not exist`) as any;
        error.statusCode = 404;
        throw error;
    }

    if (application_id !== Number(version.application_id)) {
        const error = new Error(`Version with ID ${version_id} does not belong to application ${application_id}`) as any;
        error.statusCode = 404;
        throw error;
    }

    if (reason === null && !is_approved) {
        const error = new Error("A reason must be provided when rejecting an application") as any;
        error.statusCode = 400;
        throw error;
    }

    if (reason === null && is_approved) {
        reason = "Approval request accepted";
    }

    const document = await getDocumentByVersionAndType(version_id, "LEARNING_AGREEMENT");
    if (!document) {
        const error = new Error(`Learning Agreement document for version ${version_id} does not exist`) as any;
        error.statusCode = 404;
        throw error;
    }

    const currentState = application.current_state_id;

    let transactionNewState = undefined;
    
    if (Number(application.current_state_id) === STATES.AWAITING_CHANGES_APPROVAL) 
        transactionNewState = STATES.MOBILITY_IN_PROGRESS;
    else {
        if (is_approved) transactionNewState = STATES.AWAITING_LEARNING_AGREEMENT_APPROVAL_BY_STAFF;
        else transactionNewState = STATES.REJECTED_BY_REFERENT;
    }

    return await applicationRepository.postReferentApproval(
        application_id,
        version_id,
        referent_id,
        is_approved,
        reason,
        currentState,
        transactionNewState
    );
}

export const editApplication = async (
    application_id: number,
    user_id: number,
    host_institution_id: number,
    academic_year: string, 
    expected_mobility_period: "first_semester" | "second_semester" | "full_year",
    mappings: CourseMappingsInput
) => {
    const application = await applicationRepository.getApplicationById(application_id);
    if (!application) {
        const error = new Error(`Application with ID ${application_id} does not exist`) as any;
        error.statusCode = 404;
        throw error;
    }

    if (Number(application.student_id) !== user_id) {
        const error = new Error(`User with ID ${user_id} is not authorized to edit this application`) as any;
        error.statusCode = 403;
        throw error;
    }

    if (!(Number(application.current_state_id) === STATES.REJECTED_BY_REFERENT || Number(application.current_state_id) === STATES.MOBILITY_IN_PROGRESS)) {
        const error = new Error('Application is not in a valid state for editing') as any;
        error.statusCode = 400;
        throw error;
    }

    let newState: number;
    if (Number(application.current_state_id) === STATES.MOBILITY_IN_PROGRESS) {

        newState = STATES.AWAITING_CHANGES_APPROVAL;

        if (
            Number(application.host_institution_id) !== host_institution_id ||
            application.academic_year !== academic_year ||
            application.expected_mobility_period !==expected_mobility_period
        ) {
            const error = new Error('Cannot change host institution, academic year, or expected mobility period when editing a rejected application') as any;
            error.statusCode = 400;
            throw error;
        }

        // Check if any passed exams are no longer present in the mappings
        const passedExams = await getPassedExamsForActiveVersion(application_id);
        for (const passed of passedExams) {
            const isStillPresent = mappings.some(
                (m) =>
                    m.foreign_course_id === Number(passed.foreign_course_id) &&
                    m.cafoscari_course_id === Number(passed.cafoscari_course_id)
            );
            if (!isStillPresent) {
                const error = new Error(`Passed exam ${passed.recognized_exam_id} is no longer present in the application mappings`) as any;
                error.statusCode = 400;
                throw error;
            }
        }
        await validateCoursesAndHostInstitution(application.host_institution_id, mappings);

    } else {
        newState = STATES.AWAITING_LEARNING_AGREEMENT_APPROVAL_BY_REFERENT;
        await validateCoursesAndHostInstitution(host_institution_id, mappings);
    } 

    const updatedApplication = await applicationRepository.updateApplication(
    application_id,
    user_id,
    host_institution_id,
    academic_year,
    expected_mobility_period,
    mappings,
    Number(application.current_state_id),
    newState
  );

  return updatedApplication;
};

export const staffApproval = async (
    application_id: number,
    version_id: number,
    user_id: number,
) => {
    const application = await applicationRepository.getApplicationById(application_id);
    if (!application) {
        const error = new Error(`Application with ID ${application_id} does not exist`) as any;
        error.statusCode = 404;
        throw error;
    }

    if (Number(application.current_state_id) !== STATES.AWAITING_LEARNING_AGREEMENT_APPROVAL_BY_STAFF) {
        const error = new Error('Application is not in a valid state for staff approval') as any;
        error.statusCode = 400;
        throw error;
    }

    const version = await getApplicationVersionById(version_id);

    if (!version) {
        const error = new Error(`Version with ID ${version_id} does not exist`) as any;
        error.statusCode = 404;
        throw error; 
    }

    if (Number(version.application_id) !== application_id) {
        const error = new Error(`Version with ID ${version_id} does not belong to application ${application_id}`) as any;
        error.statusCode = 404;
        throw error; 
    }

    if (version.is_active !== true) {
        const error = new Error(`Version with ID ${version_id} has not been approved by the referent yet`) as any;
        error.statusCode = 400;
        throw error; 
    }

    const currentState = application.current_state_id;
    const newState = STATES.PRE_DEPARTURE_COMPLETED;
    const reason = "Learning Agreement approved by staff";

    const staffApprovalResult = await applicationRepository.postStaffApproval(
        application_id,
        currentState,
        newState,
        user_id,
        reason
    );

    return staffApprovalResult;
};

export const updateMobilityDates = async (
    application_id: number,
    user_id: number,
    arrival_date: string,
    departure_date: string
) => {

    const application = await applicationRepository.getApplicationById(application_id);
    if (!application) {
        const error = new Error(`Application with ID ${application_id} does not exist`) as any;
        error.statusCode = 404;
        throw error;
    }

    if (Number(application.student_id) !== user_id) {
        const error = new Error(`User with ID ${user_id} is not authorized to update mobility dates for this application`) as any;
        error.statusCode = 403;
        throw error;
    }

    if (Number(application.current_state_id) !== STATES.PRE_DEPARTURE_COMPLETED) {
        const error = new Error('Application is not in a valid state for updating mobility dates') as any;
        error.statusCode = 400;
        throw error;
    }

    const from_state_id = Number(application.current_state_id);
    const to_state_id = STATES.MOBILITY_IN_PROGRESS;
    const reason = "Mobility dates updated by student";

    const updatedApplication = await applicationRepository.updateMobilityDates(
        application_id,
        user_id,
        arrival_date,
        departure_date,
        from_state_id,
        to_state_id,
        reason
    );

    return updatedApplication;
};
