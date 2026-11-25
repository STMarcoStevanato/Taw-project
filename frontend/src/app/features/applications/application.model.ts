export interface Application {
    application_id: string;

    student?: {
      student_id: string;
      name: string;
      lastname: string;
      email: string;
    };
  
    referent?: {
      referent_id: string;
      name: string;
      lastname: string;
      email: string;
    };
  
    host_institution: {
      host_institution_id: string;
      name: string;
      country_id: string;
      country_name: string;
      city: string;
    };
  
    current_state: {
      current_state_id: string;
      name: string;
    };

    arrival_date?: string | null;
    departure_date?: string | null;
  
    academic_year: string;
    expected_mobility_period:
      | 'first_semester'
      | 'second_semester'
      | 'full_year';
  
    versions: {
      version_id: number;
      version_number: number;
      is_active: boolean;
      mapping: {
        mapping_id: number;
        foreign_course_id: number;
        cafoscari_course_id: number;
      }[];
    }[];
  }
  
  export interface StudentApplicationsResponse {
    status: string;
    results: number;
    data: {
      applications: Application[];
    };
  }

  export interface CourseMappingRequest {
    foreign_course_id: number;
    cafoscari_course_id: number;
  }
  
  export interface CreateApplicationRequest {
    student_id: number;
    referent_id: number;
    host_institution_id: number;
    academic_year: string;
    expected_mobility_period:
      | 'first_semester'
      | 'second_semester'
      | 'full_year';
    mappings: CourseMappingRequest[];
  }

  export interface Referent {
    user_id: string;
    name: string;
    lastname: string;
    email: string;
  }
  
  export interface ReferentsResponse {
    status: string;
    results: number;
    data: {
      referents: Referent[];
    };
  }


export interface University {
  university_id: string;
  name: string;
  city: string;
  Countries: {
    country_id: string;
    name: string;
  };
}

export interface UniversitiesResponse {
  status: string;
  results: number;
  data: {
    universities: University[];
  };
}

export interface Course {
  course_id: string;
  code: string;
  name: string;
  credits: number;
}

export interface CoursesResponse {
  status: string;
  results: number;
  data: {
    courses: Course[];
  };
}

export interface MappingCourse {
  mapping_id: string;
  university_courses_id: string;
  course_name: string;
  credits: number;
  course_code: string;
  foreign_score: number | string | null;
  exam_date: string | null;
  course_type: 'cafoscari' | 'foreign';
}

export interface MappingCoursesResponse {
  status: string;
  data: MappingCourse[];
}

export interface UpdateApplicationRequest {
  host_institution_id: number;
  academic_year: string;
  expected_mobility_period:
      | 'first_semester'
      | 'second_semester'
      | 'full_year';

  mappings: CourseMappingRequest[];
}

export type ReferentApplicationsResponse = StudentApplicationsResponse;

export interface ReferentApprovalRequest {
  approved: boolean;
  reason?: string;
}


