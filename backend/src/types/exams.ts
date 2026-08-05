export interface Exam {
  exam_id: number;
  mapping_id: number;
  exam_date: Date;
  foreign_score: number;
}

export interface UserData {
  name: string;
  lastname: string;
  email: string;
}

export interface ReferentData {
  name: string;
  lastname: string;
  email: string;
}

export interface CountryData {
  country_id: number;
  name: string;
}

export interface UniversityData {
  university_id: number;
  name: string;
  city: string;
  Countries: CountryData;
}

export interface ApplicationData {
  application_id: string;
  student_id: string;
  referent_id: string;
  host_institution_id: string;
  current_state_id: string;
  created_at: string;
  academic_year: string;
  expected_mobility_period: string;
  arrival_date: string;
  departure_date: string;
}

export interface RecognizedExam {
  recognized_exam_id: number;
  exam_date: string;
  foreign_score: number;
}

export interface MappingItem {
  mapping_id: number;
  foreign_course_id: number;
  cafoscari_course_id: number;
  recognized_exam: RecognizedExam | null;
}

export interface ApplicationVersionMapping {
  version_id: number;
  mappings: MappingItem[];
}

export interface TranscriptRecordsPayload {
  user: UserData;
  referent: ReferentData;
  mapping: ApplicationVersionMapping;
  application: ApplicationData;
  university: UniversityData | null;
}