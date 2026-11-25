import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';

import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageModule } from 'primeng/message';
import { ApplicationCreate } from '../application-create/application-create';

import { AuthService } from '../../auth/auth.service';
import { ApplicationService } from '../application.service';
import { Application } from '../application.model';

import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';

import { ApplicationDetails } from '../../../shared/components/application-details/application-details';

@Component({
  selector: 'app-application-list',
  imports: [
    CardModule,
    TagModule,
    ProgressSpinnerModule,
    MessageModule,
    ButtonModule,
    DividerModule,
    ApplicationCreate,
    ApplicationDetails
  ],
  templateUrl: './application-list.html',
  styleUrl: './application-list.css'
})
export class ApplicationList implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly applicationService = inject(ApplicationService);

  readonly applications = signal<Application[]>([]);
  readonly loading = signal(true);
  readonly errorMessage = signal('');
  readonly createDialogVisible = signal(false);

  readonly selectedApplication = signal<Application | null>(null);
  readonly detailsDialogVisible = signal(false);

  private readonly router = inject(Router);

openDetails(application: Application): void {
  console.log('Application selezionata:', application);

  this.selectedApplication.set(application);
  this.detailsDialogVisible.set(true);

  console.log('Dialog visibile:', this.detailsDialogVisible());
}

manageApplication(application: Application): void {
  this.router.navigate([
      '/dashboard',
      'applications',
      application.application_id,
      'manage'
  ]);
}

  ngOnInit(): void {
    const user = this.authService.currentUser();

    if (!user || user.role !== 'students') {
      this.loading.set(false);
      this.errorMessage.set('Accesso non autorizzato.');
      return;
    }

    this.applicationService
      .getStudentApplications(user.user_id)
      .subscribe({
        next: (response) => {
          this.applications.set(response.data.applications);
          this.loading.set(false);
        },
        error: () => {
          this.errorMessage.set(
            'Impossibile caricare le Application.'
          );
          this.loading.set(false);
        }
      });
  }

  formatPeriod(period: string): string {
    switch (period) {
      case 'first_semester':
        return 'Primo semestre';
      case 'second_semester':
        return 'Secondo semestre';
      case 'full_year':
        return 'Intero anno';
      default:
        return period;
    }
  }

  
getStateSeverity(
  state: string
): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {

  const normalizedState = state
    .trim()
    .replace(/;+$/, '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();

  switch (normalizedState) {

    case 'created':
    case 'getting exam score':
      return 'info';

    case 'mobility in progress':
    case 'pre departure completed':
      return 'success';

    case 'awaiting learning agreement approval by referent':
    case 'awaiting learning agreement approval by staff':
    case 'awaiting changes approval':
    case 'waiting exam score approval by referent':
    case 'waiting exam score approval by staff':
      return 'warn';

    case 'canceled':
    case 'rejected by referent':
      return 'danger';


    case 'closed':
      return 'secondary';

    default:
      return 'secondary';
  }
}

}
