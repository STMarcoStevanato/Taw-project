import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ReferentOption {
  user_id?: number;
  referent_id?: number;
  name: string;
  lastname: string;
  email: string;
}

export interface UniversityOption {
  university_id?: number;
  host_institution_id?: number;
  name: string;
  city?: string;
}

export interface CourseOption {
  course_id: number;
  code?: string;
  name: string;
  credits?: number;
}

interface ReferentsResponse {
  status: string;
  results: number;
  data: {
    referents: ReferentOption[];
  };
}

interface UniversitiesResponse {
  status: string;
  results: number;
  data: {
    universities: UniversityOption[];
  };
}

interface CoursesResponse {
  status: string;
  results: number;
  data: {
    courses: CourseOption[];
  };
}

@Injectable({ providedIn: 'root' })
export class LookupsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  getReferents(): Observable<ReferentsResponse> {
    return this.http.get<ReferentsResponse>(`${this.baseUrl}/referents`, {
      withCredentials: true
    });
  }

  getUniversities(): Observable<UniversitiesResponse> {
    return this.http.get<UniversitiesResponse>(`${this.baseUrl}/universities`, {
      withCredentials: true
    });
  }

  getUniversityCourses(universityId: number): Observable<CoursesResponse> {
    return this.http.get<CoursesResponse>(`${this.baseUrl}/universities/${universityId}/courses/`, {
      withCredentials: true
    });
  }
}
