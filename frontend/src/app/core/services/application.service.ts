import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ApplicationsResponse {
  status: string;
  results: number;
  data: {
    applications: any[];
  };
}

export interface CourseMappingPayload {
  foreign_course_id?: number;
  cafoscari_course_id?: number;
}

export interface CreateApplicationPayload {
  student_id: number;
  referent_id: number;
  host_institution_id: number;
  academic_year: string;
  expected_mobility_period: 'first_semester' | 'second_semester' | 'full_year';
  mappings: CourseMappingPayload[];
}

export interface CreateApplicationResponse {
  status: string;
  data: any;
}

export interface UpdateApplicationPayload {
  host_institution_id: number;
  academic_year: string;
  expected_mobility_period: 'first_semester' | 'second_semester' | 'full_year';
  mappings: CourseMappingPayload[];
}

@Injectable({ providedIn: 'root' })
export class ApplicationService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  getAllApplications(): Observable<ApplicationsResponse> {
    return this.http.get<ApplicationsResponse>(`${this.baseUrl}/applications`, {
      withCredentials: true
    });
  }

  getStudentApplications(studentId: number): Observable<ApplicationsResponse> {
    return this.http.get<ApplicationsResponse>(`${this.baseUrl}/applications/student/${studentId}`, {
      withCredentials: true
    });
  }

  getReferentApplications(referentId: number): Observable<ApplicationsResponse> {
    return this.http.get<ApplicationsResponse>(`${this.baseUrl}/applications/referent/${referentId}`, {
      withCredentials: true
    });
  }

  createApplication(payload: CreateApplicationPayload): Observable<CreateApplicationResponse> {
    return this.http.post<CreateApplicationResponse>(`${this.baseUrl}/applications`, payload, {
      withCredentials: true
    });
  }

  updateApplication(applicationId: number, payload: UpdateApplicationPayload): Observable<CreateApplicationResponse> {
    return this.http.put<CreateApplicationResponse>(`${this.baseUrl}/applications/${applicationId}`, payload, {
      withCredentials: true
    });
  }
}
