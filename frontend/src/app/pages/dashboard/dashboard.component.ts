import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, ViewEncapsulation, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { SessionService } from '../../core/services/session.service';
import { ReferentStaffApplicationsPageComponent } from './components/referent-staff-applications-page/referent-staff-applications-page.component';
import { StudentCreateApplicationPageComponent } from './components/student-create-application-page/student-create-application-page.component';
import { StudentApplicationsPageComponent } from './components/student-applications-page/student-applications-page.component';

type DashboardAction = 'student-view' | 'student-create' | 'review-student';

interface DashboardMenuItem {
  key: DashboardAction;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    StudentApplicationsPageComponent,
    StudentCreateApplicationPageComponent,
    ReferentStaffApplicationsPageComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
  encapsulation: ViewEncapsulation.None
})
export class DashboardComponent {
  private readonly router = inject(Router);
  private readonly session = inject(SessionService);

  readonly loading = signal(false);
  readonly feedback = signal<string | null>(null);
  readonly feedbackType = signal<'success' | 'error' | null>(null);
  readonly profileMenuOpen = signal(false);
  readonly dashboardMenuCollapsed = signal(false);
  readonly currentUser = this.session.currentUser;
  readonly isAuthenticated = this.session.isAuthenticated;
  readonly dashboardAction = signal<DashboardAction>(this.getInitialDashboardAction());

  readonly dashboardMenuItems = computed<DashboardMenuItem[]>(() => {
    const role = this.currentUser()?.role;

    if (role === 'students') {
      return [
        { key: 'student-view', label: 'View my applications', icon: 'VA' },
        { key: 'student-create', label: 'Create new application', icon: 'CA' }
      ];
    }

    if (role === 'referents' || role === 'staff') {
      return [{ key: 'review-student', label: 'View student applications', icon: 'SA' }];
    }

    return [];
  });

  setDashboardAction(action: DashboardAction): void {
    this.dashboardAction.set(action);
  }

  toggleDashboardMenu(): void {
    this.dashboardMenuCollapsed.set(!this.dashboardMenuCollapsed());
  }

  toggleProfileMenu(): void {
    this.profileMenuOpen.set(!this.profileMenuOpen());
  }

  closeProfileMenu(): void {
    this.profileMenuOpen.set(false);
  }

  prettifyRole(role: string | undefined): string {
    if (!role) {
      return 'N/A';
    }
    return role.charAt(0).toUpperCase() + role.slice(1);
  }

  navigateToLanding(): void {
    this.router.navigateByUrl('/');
  }

  submitLogout(): void {
    if (this.loading()) {
      return;
    }

    this.loading.set(true);
    this.session.logout().subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigateByUrl('/');
      },
      error: (error: HttpErrorResponse) => {
        this.loading.set(false);
        this.feedbackType.set('error');
        this.feedback.set(this.extractErrorMessage(error));
      }
    });
  }

  private getInitialDashboardAction(): DashboardAction {
    const role = this.currentUser()?.role;
    return role === 'students' ? 'student-view' : 'review-student';
  }

  private extractErrorMessage(error: HttpErrorResponse): string {
    return (error.error?.message as string | undefined) || 'Request failed. Please try again.';
  }
}
