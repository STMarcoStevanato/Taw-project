
import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

import {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  AuthUser,
  MeResponse
} from './auth.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly http = inject(HttpClient);

  private readonly _currentUser = signal<AuthUser | null>(null);

  readonly currentUser = this._currentUser.asReadonly();

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(
      '/api/auth/login',
      credentials
    );
  }

  register(data: RegisterRequest): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(
      '/api/users',
      data
    );
  }

  logout(): Observable<void> {
    return this.http.post<void>(
      '/api/auth/logout',
      {}
    ).pipe(
      tap(() => {
        this._currentUser.set(null);
      })
    );
  }

  getMe(): Observable<MeResponse> {
    return this.http.get<MeResponse>('/api/auth/me');
  }

  restoreSession(): Observable<MeResponse> {
    return this.getMe().pipe(
      tap({
        next: (response) => {
          this._currentUser.set(response.user);
        },
        error: () => {
          this._currentUser.set(null);
        }
      })
    );
  }

  setCurrentUser(user: AuthUser): void {
    this._currentUser.set(user);
  }
}
