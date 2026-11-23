
import { Component, inject, signal } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../auth.service';
import { RegisterRequest } from '../auth.model'
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-register',
  imports: [
    RouterLink,
    ReactiveFormsModule,
    InputTextModule,
    PasswordModule,
    ButtonModule,
    SelectModule,
    CardModule],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class Register {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly errorMessage = signal('');

  readonly registerForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
    lastname: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password1: ['', Validators.required],
    password2: ['', Validators.required],
    role: [1 as 1 | 2 | 3, Validators.required]
  });

  onSubmit(): void {
    if (this.registerForm.invalid || this.loading()) {
      this.registerForm.markAllAsTouched();
      return;
    }

    const data = this.registerForm.getRawValue();

    if (data.password1 !== data.password2) {
      this.errorMessage.set('Le password non coincidono.');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    this.authService.register(data as RegisterRequest).subscribe({
      next: () => {
        this.loading.set(false);
        void this.router.navigate(['/login']);
      },
      error: (error) => {
        this.loading.set(false);
        this.errorMessage.set(
          error.status === 409
            ? 'Questa email è già registrata.'
            : 'Registrazione non riuscita. Riprova.'
        );
      }
    });
  }
}
