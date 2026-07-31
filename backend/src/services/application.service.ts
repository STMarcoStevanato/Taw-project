import { CourseMappingsInput } from "../schemas/application/application.schema"
import { findStudentById } from "../repositories/user.repository";
import { findReferentById } from "../repositories/user.repository";
import { getValidCourseIds }from "../repositories/universities.repository"
import { findUniversityById } from "../repositories/universities.repository";
import { STATES } from "../config/STATE";
import * as applicationRepository from "../repositories/application.repository";

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

    const isHostInstitution = await findUniversityById(host_institution_id);
    if (!isHostInstitution) {
        const error = new Error("University with ID ${host_institution_id} does not exist") as any;
        error.statusCode = 404;
        throw error;
    }

    // Let's extract the Ca' Foscari courses and those from the foreign university from the mappings list
    const cafoscariIds = mappings
        .map((m) => m.cafoscari_course_id)
        .filter((id): id is number => id != null);

    const foreignIds = mappings
        .map((m) => m.foreign_course_id)
        .filter((id): id is number => id != null);

    //getValidCourseIds remove any courses that do not belong to the university from cafoscariIds and foreignIds
    const validCafoscariIds = await getValidCourseIds(cafoscariIds, 1); // 1 = Ca'Foscari ID
    const validForeignIds = await getValidCourseIds(foreignIds, host_institution_id)

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

    if (Number(application.referent_id) !== Number(referent_id)) {
        const error = new Error(`Referent with ID ${referent_id} is not authorized to approve this application`) as any;
        error.statusCode = 403;
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

    const currentState = application.state_id;
    let transactionNewState = undefined;
    if (is_approved) transactionNewState = STATES.AWAITING_LEARNING_AGREEMENT_BY_STAFF;
    else transactionNewState = STATES.REJECTED_BY_REFERENT;

    return await applicationRepository.postReferentApproval(
        application_id,
        referent_id,
        is_approved,
        reason,
        currentState,
        transactionNewState
    );
}