import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthenticatedUser, LoginRequest, LoginResponse, SignupRequest } from '../models/auth.models';

interface LogoutResponse {
  status: string;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  signup(payload: SignupRequest): Observable<AuthenticatedUser> {
    return this.http.post<AuthenticatedUser>(`${this.baseUrl}/users`, payload, {
      withCredentials: true
    });
  }

  login(payload: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.baseUrl}/auth/login`, payload, { withCredentials: true })
      .pipe(tap((response) => localStorage.setItem('csrfToken', response.csrfToken)));
  }

  logout(): Observable<LogoutResponse> {
    return this.http.post<LogoutResponse>(`${this.baseUrl}/auth/logout`, {}, { withCredentials: true });
  }
}
