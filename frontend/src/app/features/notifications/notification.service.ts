import {
    Injectable,
    inject,
    signal,
    computed
  } from '@angular/core';
  
  import { HttpClient } from '@angular/common/http';
  import { Observable, tap, switchMap, map } from 'rxjs';
  
  import {
    Notification,
    NotificationsResponse,
    ReadNotificationResponse,
    ReadAllNotificationsResponse
  } from './notification.model';
  
  @Injectable({
    providedIn: 'root'
  })
  export class NotificationService {
  
    private readonly http = inject(HttpClient);
  
    private readonly notificationsState = signal<Notification[]>([]);
  
    readonly notifications = this.notificationsState.asReadonly();
  
    readonly unreadNotifications = computed(() =>
      this.notifications().filter(
        notification => notification.read_at === null
      )
    );
  
    readonly readNotifications = computed(() =>
      this.notifications().filter(
        notification => notification.read_at !== null
      )
    );
  
    readonly unreadCount = computed(() =>
      this.unreadNotifications().length
    );
  
    readonly totalCount = computed(() =>
      this.notifications().length
    );
  
    getNotifications(): Observable<NotificationsResponse> {
  
      return this.http.get<NotificationsResponse>(
        '/api/notifications'
      ).pipe(
        tap(response => {
          this.notificationsState.set(
            response.data.notifications
          );
        })
      );
  
    }
  
    markAsRead(
      notificationId: string
    ): Observable<ReadNotificationResponse> {
  
      return this.http.patch<ReadNotificationResponse>(
        `/api/notifications/${notificationId}/read`,
        null
      ).pipe(
        tap(response => {
          this.notificationsState.update(notifications =>
            notifications.map(notification =>
              notification.notification_id === response.data.notification_id
                ? {
                    ...notification,
                    read_at: response.data.read_at
                  }
                : notification
            )
          );
        })
      );
  
    }
  
    markAllAsRead(): Observable<ReadAllNotificationsResponse> {
  
      return this.http.patch<ReadAllNotificationsResponse>(
        '/api/notifications/read-all',
        null
      ).pipe(
        switchMap(response =>
          this.getNotifications().pipe(
            map(() => response)
          )
        )
      );
  
    }
  
    clearNotifications(): void {
      this.notificationsState.set([]);
    }
  
  }