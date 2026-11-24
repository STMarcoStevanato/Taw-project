import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  StudentApplicationsResponse,
  CreateApplicationRequest,
  ReferentsResponse,
  UniversitiesResponse,
  CoursesResponse,
  MappingCoursesResponse
} from './application.model';

@Injectable({
  providedIn: 'root'
})
export class ApplicationService {
  private readonly http = inject(HttpClient);

  getStudentApplications(
    studentId: string
  ): Observable<StudentApplicationsResponse> {
    return this.http.get<StudentApplicationsResponse>(
      `/api/applications/student/${studentId}`
    );
  }

  createApplication(
    data: CreateApplicationRequest
  ): Observable<unknown> {
    return this.http.post(
      '/api/applications',
      data
    );
  }

  getReferents(): Observable<ReferentsResponse> {
    return this.http.get<ReferentsResponse>(
      '/api/referents'
    );
  }

  getUniversities(): Observable<UniversitiesResponse> {
    return this.http.get<UniversitiesResponse>(
      '/api/universities'
    );
  }
  
  getUniversityCourses(
    universityId: string
  ): Observable<CoursesResponse> {
    return this.http.get<CoursesResponse>(
      `/api/universities/${universityId}/courses`
    );
  }

  getMappingCourses(
    mappingId: number | string
  ): Observable<MappingCoursesResponse> {
    return this.http.get<MappingCoursesResponse>(
      `/api/exams/mapping/${mappingId}`
    );
  }

  downloadLearningAgreement(versionId: number): Observable<Blob> {
    return this.http.get(
        `/api/versions/${versionId}/learning-agreement`,
        {
            responseType: 'blob'
        }
    );
  }

}