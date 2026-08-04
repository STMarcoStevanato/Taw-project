import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from './core/services/auth.service';
import { AuthenticatedUser, LoginRequest, SignupRequest, UserRole } from './core/models/auth.models';

@Component({
  selector: 'app-root',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private static readonly USER_STORAGE_KEY = 'authUser';

  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);

  protected readonly mode = signal<'login' | 'signup'>('login');
  protected readonly loading = signal(false);
  protected readonly feedback = signal<string | null>(null);
  protected readonly feedbackType = signal<'success' | 'error' | null>(null);
  protected readonly currentYear = new Date().getFullYear();
  protected readonly currentUser = signal<AuthenticatedUser | null>(this.readUserFromStorage());
  protected readonly isAuthenticated = computed(() => this.currentUser() !== null);
  protected readonly profileMenuOpen = signal(false);

  protected readonly roleOptions: ReadonlyArray<{ label: string; value: UserRole }> = [
    { label: 'Student (1)', value: 1 },
    { label: 'Referent (2)', value: 2 },
    { label: 'Staff (3)', value: 3 }
  ];

  protected readonly loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  protected readonly signupForm = this.fb.nonNullable.group(
    {
      name: ['', [Validators.required]],
      lastname: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password1: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.pattern(/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^a-zA-Z0-9])/)
        ]
      ],
      password2: ['', [Validators.required]],
      role: [1 as UserRole, [Validators.required]]
    },
    {
      validators: [(form) => {
        const first = form.get('password1')?.value;
        const second = form.get('password2')?.value;
        return first === second ? null : { passwordsMismatch: true };
      }]
    }
  );

  protected readonly title = computed(() => {
    const user = this.currentUser();
    if (user) {
      return `Welcome, ${user.name}`;
    }
    return this.mode() === 'login' ? 'Welcome Back' : 'Create Your Account';
  });

  protected setMode(nextMode: 'login' | 'signup'): void {
    this.mode.set(nextMode);
    this.feedback.set(null);
    this.feedbackType.set(null);
  }

  protected submitLogin(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.feedback.set(null);

    const payload: LoginRequest = this.loginForm.getRawValue();

    this.authService.login(payload).subscribe({
      next: ({ user }) => {
        this.loading.set(false);
        this.currentUser.set(user);
        this.profileMenuOpen.set(false);
        localStorage.setItem(App.USER_STORAGE_KEY, JSON.stringify(user));
        this.feedbackType.set('success');
        this.feedback.set(`Logged in as ${user.name} ${user.lastname} (${user.role}).`);
        this.loginForm.reset({ email: payload.email, password: '' });
      },
      error: (error: HttpErrorResponse) => {
        this.loading.set(false);
        this.feedbackType.set('error');
        this.feedback.set(this.extractErrorMessage(error));
      }
    });
  }

  protected submitSignup(): void {
    if (this.signupForm.invalid) {
      this.signupForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.feedback.set(null);

    const rawPayload = this.signupForm.getRawValue();
    const payload: SignupRequest = {
      ...rawPayload,
      role: Number(rawPayload.role) as UserRole
    };

    this.authService.signup(payload).subscribe({
      next: () => {
        this.loading.set(false);
        this.feedbackType.set('success');
        this.feedback.set('Account created successfully. You can now log in.');
        this.signupForm.reset({
          name: '',
          lastname: '',
          email: '',
          password1: '',
          password2: '',
          role: 1
        });
        this.mode.set('login');
      },
      error: (error: HttpErrorResponse) => {
        this.loading.set(false);
        this.feedbackType.set('error');
        this.feedback.set(this.extractErrorMessage(error));
      }
    });
  }

  protected submitLogout(): void {
    if (this.loading()) {
      return;
    }

    this.loading.set(true);

    this.authService.logout().subscribe({
      next: () => {
        this.loading.set(false);
        this.clearSession();
        this.profileMenuOpen.set(false);
        this.feedbackType.set('success');
        this.feedback.set('You are now logged out.');
        this.mode.set('login');
      },
      error: (error: HttpErrorResponse) => {
        this.loading.set(false);
        this.feedbackType.set('error');
        this.feedback.set(this.extractErrorMessage(error));
      }
    });
  }

  protected toggleProfileMenu(): void {
    this.profileMenuOpen.set(!this.profileMenuOpen());
  }

  protected closeProfileMenu(): void {
    this.profileMenuOpen.set(false);
  }

  protected openDashboardStub(): void {
    this.closeProfileMenu();
    this.feedbackType.set('success');
    this.feedback.set('Dashboard is coming next. Your session is active and ready.');
  }

  protected prettifyRole(role: string | undefined): string {
    if (!role) {
      return 'N/A';
    }
    return role.charAt(0).toUpperCase() + role.slice(1);
  }

  private extractErrorMessage(error: HttpErrorResponse): string {
    return (error.error?.message as string | undefined) || 'Request failed. Please try again.';
  }

  private clearSession(): void {
    this.currentUser.set(null);
    localStorage.removeItem(App.USER_STORAGE_KEY);
    localStorage.removeItem('csrfToken');
  }

  private readUserFromStorage(): AuthenticatedUser | null {
    const rawUser = localStorage.getItem(App.USER_STORAGE_KEY);
    if (!rawUser) {
      return null;
    }

    try {
      return JSON.parse(rawUser) as AuthenticatedUser;
    } catch {
      localStorage.removeItem(App.USER_STORAGE_KEY);
      return null;
    }
  }
}
