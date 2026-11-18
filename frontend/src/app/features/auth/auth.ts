import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthUser {
  user_id: string;
  name: string;
  lastname: string;
  email: string;
  role: 'students' | 'staff' | 'referents' | 'none';
}

export interface LoginResponse {
  user: AuthUser;
  csrfToken: string;
}

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
  
  
    setCurrentUser(user: AuthUser): void {
      this._currentUser.set(user);
    }
  }
