import {
  Component,
  computed,
  inject,
  OnInit,
  DestroyRef
} from '@angular/core';

import {
  Router,
  RouterLink,
  RouterLinkActive
} from '@angular/router';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { AuthService } from '../../../features/auth/auth.service';

import {
  NotificationService
} from '../../../features/notifications/notification.service';

@Component({
  selector: 'app-sidebar',
  imports: [
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css'
})
export class Sidebar implements OnInit {

  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly notificationService = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly role = computed(
    () => this.authService.currentUser()?.role
  );

  readonly currentUser = this.authService.currentUser;

  readonly unreadCount = this.notificationService.unreadCount;

  isLoggingOut = false;

  ngOnInit(): void {
    this.loadNotifications();
  }

  private loadNotifications(): void {

    this.notificationService.getNotifications()
      .pipe(
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        error: error => {
          console.error(
            'Errore durante il caricamento delle notifiche:',
            error
          );
        }
      });

  }

  logout(): void {

    if (this.isLoggingOut) return;

    this.isLoggingOut = true;

    this.authService.logout().subscribe({

      next: () => {

        this.notificationService.clearNotifications();

        this.router.navigate(['/']);

      },

      error: error => {

        console.error(
          'Errore durante il logout:',
          error
        );

        this.isLoggingOut = false;

      }

    });

  }

}