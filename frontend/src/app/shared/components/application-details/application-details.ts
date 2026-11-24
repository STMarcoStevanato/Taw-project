
import {
  Component,
  input,
  model,
  inject,
  signal,
  effect,
  computed
} from '@angular/core';

import { forkJoin, of, catchError, map } from 'rxjs';

import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { AccordionModule } from 'primeng/accordion';
import { TableModule } from 'primeng/table';
import { DividerModule } from 'primeng/divider';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageModule } from 'primeng/message';
import { ButtonModule } from 'primeng/button';

import {
  Application,
  MappingCourse
} from '../../../features/applications/application.model';

import {
  ApplicationService
} from '../../../features/applications/application.service';

@Component({
  selector: 'app-application-details',
  imports: [
    DialogModule,
    TagModule,
    DividerModule,
    ProgressSpinnerModule,
    MessageModule,
    AccordionModule,
    TableModule,
    ButtonModule
  ],
  templateUrl: './application-details.html',
  styleUrl: './application-details.css'
})
export class ApplicationDetails {

  private readonly applicationService = inject(ApplicationService);

  readonly application = input<Application | null>(null);
  readonly visible = model(false);

  readonly mappingsLoading = signal(false);

  readonly mappingCourses = signal<
    Record<string, MappingCourse[]>
  >({});

  readonly failedMappings = signal<string[]>([]);

  readonly downloadingVersionId = signal<number | null>(null);
  readonly downloadError = signal('');

  readonly activeVersionIds = computed(() =>
    (this.application()?.versions ?? [])
      .filter(version => version.is_active)
      .map(version => String(version.version_id))
  );

  constructor() {
    effect((onCleanup) => {
      const application = this.application();
      const visible = this.visible();

      this.mappingCourses.set({});
      this.failedMappings.set([]);
      this.mappingsLoading.set(false);

      if (!application || !visible) {
        return;
      }

      const mappingIds = [
        ...new Set(
          (application.versions ?? []).flatMap(version =>
            (version.mapping ?? []).map(mapping =>
              String(mapping.mapping_id)
            )
          )
        )
      ];

      if (mappingIds.length === 0) {
        return;
      }

      this.mappingsLoading.set(true);

      const requests = mappingIds.map(mappingId =>
        this.applicationService
          .getMappingCourses(mappingId)
          .pipe(
            map(response => ({
              mappingId,
              courses: response.data,
              failed: false
            })),
            catchError(() =>
              of({
                mappingId,
                courses: [] as MappingCourse[],
                failed: true
              })
            )
          )
      );

      const subscription = forkJoin(requests).subscribe({
        next: results => {
          const courses: Record<string, MappingCourse[]> = {};

          for (const result of results) {
            courses[result.mappingId] = result.courses;
          }

          this.mappingCourses.set(courses);

          this.failedMappings.set(
            results
              .filter(result => result.failed)
              .map(result => result.mappingId)
          );

          this.mappingsLoading.set(false);
        }
      });

      onCleanup(() => subscription.unsubscribe());
    });
  }

  getMappingCourses(
    mappingId: number | string,
    courseType: 'cafoscari' | 'foreign'
  ): MappingCourse[] {
    return (
      this.mappingCourses()[String(mappingId)] ?? []
    ).filter(course => course.course_type === courseType);
  }

  hasMappingError(mappingId: number | string): boolean {
    return this.failedMappings().includes(String(mappingId));
  }

  formatDate(date: string | null | undefined): string {
    if (!date) {
      return 'Non ancora disponibile';
    }

    const [year, month, day] = date.split('-');

    return `${day}/${month}/${year}`;
  }

  formatPeriod(
    period: Application['expected_mobility_period']
  ): string {
    switch (period) {
      case 'first_semester':
        return 'Primo semestre';

      case 'second_semester':
        return 'Secondo semestre';

      case 'full_year':
        return 'Intero anno';

      default:
        return 'Non ancora disponibile';
    }
  }

  downloadLearningAgreement(versionId: number): void {

    this.downloadingVersionId.set(versionId);
    this.downloadError.set('');

    this.applicationService
        .downloadLearningAgreement(versionId)
        .subscribe({
          next: (blob) => {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');

            link.href = url;
            link.download = `Learning_Agreement_v${versionId}.pdf`;
            document.body.appendChild(link);

            link.click();
            link.remove();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            this.downloadingVersionId.set(null);
          },
          error: () => {
            this.downloadError.set(
                'Impossibile scaricare il Learning Agreement.'
            );

            this.downloadingVersionId.set(null);
            }
      });
  }
}
