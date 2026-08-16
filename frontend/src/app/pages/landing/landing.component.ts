import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { SessionService } from '../../core/services/session.service';
import { LoginRequest, SignupRequest, UserRole } from '../../core/models/auth.models';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.css'
})
export class LandingComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly session = inject(SessionService);

  readonly mode = signal<'login' | 'signup'>('login');
  readonly loading = signal(false);
  readonly feedback = signal<string | null>(null);
  readonly feedbackType = signal<'success' | 'error' | null>(null);
  readonly profileMenuOpen = signal(false);
  readonly currentYear = new Date().getFullYear();

  readonly currentUser = this.session.currentUser;
  readonly isAuthenticated = this.session.isAuthenticated;

  readonly roleOptions: ReadonlyArray<{ label: string; value: UserRole }> = [
    { label: 'Student (1)', value: 1 },
    { label: 'Referent (2)', value: 2 },
    { label: 'Staff (3)', value: 3 }
  ];

  readonly loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  readonly signupForm = this.fb.nonNullable.group(
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

  readonly title = computed(() => {
    const user = this.currentUser();
    if (user) {
      return `Welcome, ${user.name}`;
    }
    return this.mode() === 'login' ? 'Welcome Back' : 'Create Your Account';
  });

  setMode(nextMode: 'login' | 'signup'): void {
    this.mode.set(nextMode);
    this.feedback.set(null);
    this.feedbackType.set(null);
  }

  submitLogin(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const payload: LoginRequest = this.loginForm.getRawValue();
    this.loading.set(true);
    this.feedback.set(null);

    this.session.login(payload).subscribe({
      next: ({ user }) => {
        this.loading.set(false);
        this.profileMenuOpen.set(false);
        this.feedbackType.set('success');
        this.feedback.set(`Logged in as ${user.name} ${user.lastname} (${user.role}).`);
        this.loginForm.reset({ email: payload.email, password: '' });
        this.router.navigateByUrl('/dashboard');
      },
      error: (error: HttpErrorResponse) => {
        this.loading.set(false);
        this.feedbackType.set('error');
        this.feedback.set(this.extractErrorMessage(error));
      }
    });
  }

  submitSignup(): void {
    if (this.signupForm.invalid) {
      this.signupForm.markAllAsTouched();
      return;
    }

    const rawPayload = this.signupForm.getRawValue();
    const payload: SignupRequest = {
      ...rawPayload,
      role: Number(rawPayload.role) as UserRole
    };

    this.loading.set(true);
    this.feedback.set(null);

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

  submitLogout(): void {
    if (this.loading()) {
      return;
    }

    this.loading.set(true);
    this.session.logout().subscribe({
      next: () => {
        this.loading.set(false);
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

  toggleProfileMenu(): void {
    this.profileMenuOpen.set(!this.profileMenuOpen());
  }

  closeProfileMenu(): void {
    this.profileMenuOpen.set(false);
  }

  goToDashboard(): void {
    this.closeProfileMenu();
    this.router.navigateByUrl('/dashboard');
  }

  prettifyRole(role: string | undefined): string {
    if (!role) {
      return 'N/A';
    }
    return role.charAt(0).toUpperCase() + role.slice(1);
  }

  private extractErrorMessage(error: HttpErrorResponse): string {
    return (error.error?.message as string | undefined) || 'Request failed. Please try again.';
  }
}
