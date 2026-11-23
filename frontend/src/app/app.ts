
import { Component, signal, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './features/auth/auth.service';

@Component({
  imports: [RouterOutlet],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App implements OnInit {
  protected readonly title = signal('frontend');

  private readonly authService = inject(AuthService);

  ngOnInit(): void {
    this.authService.restoreSession().subscribe({
      error: () => {
        // No valid session: the user remains unauthenticated.
      }
    });
  }
}
