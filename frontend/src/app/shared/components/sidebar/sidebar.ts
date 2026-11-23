import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

import { AuthService } from '../../../features/auth/auth.service';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css'
})
export class Sidebar {

    private readonly authService = inject(AuthService);
    private readonly router = inject(Router);
  
    readonly role = computed(
      () => this.authService.currentUser()?.role
    );
  
    readonly currentUser = this.authService.currentUser;
  
    isLoggingOut = false;
  
    logout(): void {
      if (this.isLoggingOut) return;
  
      this.isLoggingOut = true;
  
      this.authService.logout().subscribe({
        next: () => {
          this.router.navigate(['/']);
        },
        error: (error) => {
          console.error('Errore durante il logout:', error);
          this.isLoggingOut = false;
        }
      });
    }

}