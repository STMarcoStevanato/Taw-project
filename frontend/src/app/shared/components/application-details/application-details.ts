
import { Component, input, model } from '@angular/core';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';

import { Application } from '../../../features/applications/application.model';

@Component({
  selector: 'app-application-details',
  imports: [
    DialogModule,
    TagModule,
    DividerModule
  ],
  templateUrl: './application-details.html',
  styleUrl: './application-details.css'
})
export class ApplicationDetails {

  readonly application = input<Application | null>(null);
  readonly visible = model(false);

  formatDate(date: string | null | undefined): string {
    if (!date) {
      return 'Non ancora disponibile';
    }
  
    const [year, month, day] = date.split('-');
  
    return `${day}/${month}/${year}`;
  }

  formatPeriod(period: Application['expected_mobility_period']): string {
    switch (period) {
      case 'first_semester':
        return 'Primo semestre';
      case 'second_semester':
        return 'Secondo semestre';
      case 'full_year':
        return 'Intero anno';
    }
  }
}
