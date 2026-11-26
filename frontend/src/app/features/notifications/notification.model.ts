export interface Notification {
    notification_id: string;
    transition_id: string;
    application_id: string;
    host_institution: string | null;
    from_state_id: string | null;
    from_state: string | null;
    to_state_id: string | null;
    to_state: string | null;
    reason: string | null;
    performed_by: string | null;
    read_at: string | null;
    created_at: string;
  }
  
  export interface NotificationsResponse {
    status: string;
    data: {
      unread_count: number;
      total_count: number;
      notifications: Notification[];
    };
  }
  
  export interface ReadNotificationResponse {
    status: string;
    data: {
      notification_id: string;
      read_at: string;
    };
  }
  
  export interface ReadAllNotificationsResponse {
    status: string;
    data: {
      updated_count: number;
    };
  }