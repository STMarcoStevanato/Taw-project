
import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';

import { AuthService } from '../../../features/auth/auth.service';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, ButtonModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class Navbar {

  readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly loggingOut = signal(false);
  readonly logoutError = signal('');

  logout(): void {
    if (this.loggingOut()) return;

    this.loggingOut.set(true);
    this.logoutError.set('');

    this.authService.logout().subscribe({
      next: () => {
        this.loggingOut.set(false);
        void this.router.navigate(['/']);
      },
      error: () => {
        this.logoutError.set('Logout non riuscito. Riprova.');
        this.loggingOut.set(false);
      }
    });
  }
}
