import { computed, inject, Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { AuthService } from './auth.service';
import { AuthenticatedUser, LoginRequest, LoginResponse } from '../models/auth.models';

@Injectable({ providedIn: 'root' })
export class SessionService {
  private static readonly USER_STORAGE_KEY = 'authUser';

  private readonly authService = inject(AuthService);
  private readonly user = signal<AuthenticatedUser | null>(this.readUserFromStorage());

  readonly currentUser = computed(() => this.user());
  readonly isAuthenticated = computed(() => this.user() !== null);

  login(payload: LoginRequest): Observable<LoginResponse> {
    return this.authService.login(payload).pipe(
      tap((response) => {
        this.user.set(response.user);
        localStorage.setItem(SessionService.USER_STORAGE_KEY, JSON.stringify(response.user));
      })
    );
  }

  logout(): Observable<unknown> {
    return this.authService.logout().pipe(
      tap(() => {
        this.clearLocalSession();
      })
    );
  }

  clearLocalSession(): void {
    this.user.set(null);
    localStorage.removeItem(SessionService.USER_STORAGE_KEY);
    localStorage.removeItem('csrfToken');
  }

  private readUserFromStorage(): AuthenticatedUser | null {
    const raw = localStorage.getItem(SessionService.USER_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as AuthenticatedUser;
    } catch {
      localStorage.removeItem(SessionService.USER_STORAGE_KEY);
      return null;
    }
  }
}
