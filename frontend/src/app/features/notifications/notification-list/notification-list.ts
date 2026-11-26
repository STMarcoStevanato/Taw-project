import {
    Component,
    computed,
    inject,
    OnInit,
    signal
  } from '@angular/core';
  
  import { Router } from '@angular/router';
  import { finalize } from 'rxjs';
  
  import { ButtonModule } from 'primeng/button';
  import { CardModule } from 'primeng/card';
  import { TagModule } from 'primeng/tag';
  import { MessageModule } from 'primeng/message';
  import { ProgressSpinnerModule } from 'primeng/progressspinner';
  
  import { NotificationService } from '../notification.service';
  import { Notification } from '../notification.model';
  
  type NotificationFilter = 'all' | 'unread' | 'read';
  
  @Component({
    selector: 'app-notification-list',
    standalone: true,
    imports: [
      ButtonModule,
      CardModule,
      TagModule,
      MessageModule,
      ProgressSpinnerModule
    ],
    templateUrl: './notification-list.html',
    styleUrl: './notification-list.css'
  })
  export class NotificationList implements OnInit {
  
    private readonly notificationService = inject(NotificationService);
    private readonly router = inject(Router);
  
    readonly notifications = this.notificationService.notifications;
    readonly unreadCount = this.notificationService.unreadCount;
    readonly totalCount = this.notificationService.totalCount;
  
    readonly readCount = computed(() =>
      this.totalCount() - this.unreadCount()
    );
  
    readonly loading = signal(false);
    readonly errorMessage = signal('');
    readonly successMessage = signal('');
  
    readonly activeFilter = signal<NotificationFilter>('all');
  
    readonly markingAllAsRead = signal(false);
    readonly readingNotificationId = signal<string | null>(null);
  
    readonly actionInProgress = computed(() =>
      this.loading() ||
      this.markingAllAsRead() ||
      this.readingNotificationId() !== null
    );
  
    readonly filteredNotifications = computed(() => {
  
      switch (this.activeFilter()) {
  
        case 'unread':
          return this.notificationService.unreadNotifications();
  
        case 'read':
          return this.notificationService.readNotifications();
  
        default:
          return this.notifications();
  
      }
  
    });
  
    ngOnInit(): void {
      this.loadNotifications();
    }
  
    loadNotifications(): void {
  
      if (this.actionInProgress()) {
        return;
      }
  
      this.loading.set(true);
      this.errorMessage.set('');
      this.successMessage.set('');
  
      this.notificationService.getNotifications()
        .pipe(
          finalize(() => this.loading.set(false))
        )
        .subscribe({
          error: error => {
            this.errorMessage.set(
              error.error?.message ??
              'Impossibile caricare le notifiche.'
            );
          }
        });
  
    }
  
    setFilter(filter: NotificationFilter): void {
      this.activeFilter.set(filter);
    }
  
    markAsRead(notification: Notification): void {
  
      if (notification.read_at || this.actionInProgress()) {
        return;
      }
  
      this.readingNotificationId.set(notification.notification_id);
      this.errorMessage.set('');
      this.successMessage.set('');
  
      this.notificationService.markAsRead(
        notification.notification_id
      )
        .pipe(
          finalize(() => this.readingNotificationId.set(null))
        )
        .subscribe({
          error: error => {
            this.errorMessage.set(
              error.error?.message ??
              'Impossibile contrassegnare la notifica come letta.'
            );
          }
        });
  
    }
  
    markAllAsRead(): void {
  
      if (this.unreadCount() === 0 || this.actionInProgress()) {
        return;
      }
  
      this.markingAllAsRead.set(true);
      this.errorMessage.set('');
      this.successMessage.set('');
  
      this.notificationService.markAllAsRead()
        .pipe(
          finalize(() => this.markingAllAsRead.set(false))
        )
        .subscribe({
          next: () => {
            this.successMessage.set(
              'Tutte le notifiche sono state contrassegnate come lette.'
            );
          },
          error: error => {
            this.errorMessage.set(
              error.error?.message ??
              'Impossibile completare l’aggiornamento delle notifiche.'
            );
          }
        });
  
    }
  
    openApplication(notification: Notification): void {
  
      if (this.actionInProgress()) {
        return;
      }
  
      if (notification.read_at) {
        this.navigateToApplication(notification.application_id);
        return;
      }
  
      this.readingNotificationId.set(notification.notification_id);
      this.errorMessage.set('');
      this.successMessage.set('');
  
      this.notificationService.markAsRead(
        notification.notification_id
      )
        .pipe(
          finalize(() => this.readingNotificationId.set(null))
        )
        .subscribe({
          next: () => {
            this.navigateToApplication(notification.application_id);
          },
          error: error => {
            this.errorMessage.set(
              error.error?.message ??
              'Impossibile aggiornare la notifica.'
            );
          }
        });
  
    }
  
    private navigateToApplication(applicationId: string): void {
  
      this.router.navigate([
        '/dashboard',
        'applications',
        applicationId,
        'manage'
      ]);
  
    }
  
    private normalizeState(state: string | null): string {
  
      return (state ?? '')
        .trim()
        .replace(/;+$/, '')
        .replace(/_/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();
  
    }
  
    getNotificationTitle(notification: Notification): string {
  
      switch (this.normalizeState(notification.to_state)) {
  
        case 'created':
          return 'Application creata';
  
        case 'awaiting learning agreement approval by referent':
          return 'Learning Agreement in attesa di approvazione';
  
        case 'rejected by referent':
          return 'Learning Agreement rifiutato';
  
        case 'awaiting learning agreement approval by staff':
          return 'Learning Agreement approvato dal referente';
  
        case 'pre departure completed':
          return 'Fase di pre-partenza completata';
  
        case 'mobility in progress':
          return 'Mobilità in corso';
  
        case 'awaiting changes approval':
        case 'awaiting la changes approval':
          return 'Modifiche al Learning Agreement da approvare';
  
        case 'getting exam score':
          return 'Registrazione dei risultati degli esami';
  
        case 'waiting exam score approval by referent':
          return 'Risultati degli esami da approvare';
  
        case 'waiting exam score approval by staff':
          return 'Risultati degli esami approvati dal referente';
  
        case 'closed':
          return 'Application completata';
  
        case 'canceled':
          return 'Application cancellata';
  
        default:
          return 'Aggiornamento Application';
  
      }
  
    }
  
    getNotificationIcon(notification: Notification): string {
  
      switch (this.normalizeState(notification.to_state)) {
  
        case 'created':
          return 'pi pi-plus-circle';
  
        case 'rejected by referent':
          return 'pi pi-times-circle';
  
        case 'awaiting learning agreement approval by referent':
        case 'awaiting changes approval':
        case 'awaiting la changes approval':
        case 'waiting exam score approval by referent':
          return 'pi pi-clock';
  
        case 'awaiting learning agreement approval by staff':
        case 'pre departure completed':
        case 'waiting exam score approval by staff':
        case 'closed':
          return 'pi pi-check-circle';
  
        case 'mobility in progress':
          return 'pi pi-globe';
  
        case 'getting exam score':
          return 'pi pi-graduation-cap';
  
        case 'canceled':
          return 'pi pi-ban';
  
        default:
          return 'pi pi-bell';
  
      }
  
    }
  
    getNotificationSeverity(
      notification: Notification
    ): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
  
      switch (this.normalizeState(notification.to_state)) {
  
        case 'rejected by referent':
        case 'canceled':
          return 'danger';
  
        case 'awaiting learning agreement approval by referent':
        case 'awaiting changes approval':
        case 'awaiting la changes approval':
        case 'waiting exam score approval by referent':
          return 'warn';
  
        case 'awaiting learning agreement approval by staff':
        case 'pre departure completed':
        case 'waiting exam score approval by staff':
        case 'closed':
          return 'success';
  
        case 'mobility in progress':
        case 'getting exam score':
          return 'info';
  
        default:
          return 'secondary';
  
      }
  
    }
  
    formatDateTime(date: string): string {
  
      return new Intl.DateTimeFormat('it-IT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Europe/Rome'
      }).format(new Date(date));
  
    }
  
    getEmptyMessage(): string {
  
      switch (this.activeFilter()) {
  
        case 'unread':
          return 'Non hai notifiche da leggere.';
  
        case 'read':
          return 'Non hai ancora notifiche lette.';
  
        default:
          return 'Non hai ancora ricevuto notifiche.';
  
      }
  
    }
  
  }