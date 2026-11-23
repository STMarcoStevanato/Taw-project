import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';

import { Navbar } from '../../shared/components/navbar/navbar';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-home',
  imports: [Navbar, RouterLink, ButtonModule],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home {
  readonly authService = inject(AuthService);

  scrollToPrograms(): void {
    document.getElementById('programs')?.scrollIntoView({
      behavior: 'smooth'
    });
  }
}