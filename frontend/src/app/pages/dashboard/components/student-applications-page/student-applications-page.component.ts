import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import {
  ApplicationService,
  ApplicationsResponse,
  UpdateApplicationPayload
} from '../../../../core/services/application.service';
import { CourseOption, LookupsService } from '../../../../core/services/lookups.service';
import { SessionService } from '../../../../core/services/session.service';

interface ApplicationListItem {
  id: string;
  stateName: string;
  isClosed: boolean;
  academicYear: string;
  mobilityPeriod: string;
  universityName: string;
  hostUniversityId: number | null;
  mappings: Array<{ foreignCourseId: number | null; cafoscariCourseId: number | null }>;
  raw: any;
}

@Component({
  selector: 'app-student-applications-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './student-applications-page.component.html'
})
export class StudentApplicationsPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly session = inject(SessionService);
  private readonly applicationService = inject(ApplicationService);
  private readonly lookupsService = inject(LookupsService);

  readonly currentUser = this.session.currentUser;

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly applicationCards = signal<ApplicationListItem[]>([]);
  readonly applicationsCount = signal(0);
  readonly expandedApplicationIds = signal<string[]>([]);

  readonly addExamModalOpen = signal(false);
  readonly addExamLoading = signal(false);
  readonly addExamError = signal<string | null>(null);
  readonly selectedApplicationForExam = signal<ApplicationListItem | null>(null);

  readonly cafoscariCourses = signal<CourseOption[]>([]);
  readonly selectedHostUniversityCourses = signal<CourseOption[]>([]);
  readonly coursesByUniversity = signal<Record<number, CourseOption[]>>({});

  readonly addExamForm = this.fb.group({
    foreign_course_id: this.fb.nonNullable.control<number | null>(null),
    cafoscari_course_id: this.fb.nonNullable.control<number | null>(null)
  });

  constructor() {
    this.loadApplicationsForCurrentUser();
  }

  toggleApplicationDetails(applicationId: string): void {
    const expanded = this.expandedApplicationIds();
    if (expanded.includes(applicationId)) {
      this.expandedApplicationIds.set(expanded.filter((id) => id !== applicationId));
      return;
    }

    this.expandedApplicationIds.set([...expanded, applicationId]);
    const application = this.applicationCards().find((card) => card.id === applicationId);
    if (application?.hostUniversityId) {
      this.ensureUniversityCourses(application.hostUniversityId);
    }
    this.ensureUniversityCourses(1);
  }

  isApplicationExpanded(applicationId: string): boolean {
    return this.expandedApplicationIds().includes(applicationId);
  }

  canAddExamToApplication(application: ApplicationListItem): boolean {
    return this.currentUser()?.role === 'students' && !application.isClosed;
  }

  openAddExamModal(application: ApplicationListItem): void {
    if (!this.canAddExamToApplication(application)) {
      return;
    }

    this.selectedApplicationForExam.set(application);
    this.addExamError.set(null);
    this.addExamForm.reset({ foreign_course_id: null, cafoscari_course_id: null });
    this.selectedHostUniversityCourses.set([]);
    this.loadCoursesForAddExamModal(application);
    this.addExamModalOpen.set(true);
  }

  closeAddExamModal(): void {
    this.addExamModalOpen.set(false);
    this.selectedApplicationForExam.set(null);
    this.addExamError.set(null);
  }

  submitAddExamToApplication(): void {
    const application = this.selectedApplicationForExam();
    if (!application) {
      return;
    }

    const raw = this.addExamForm.getRawValue();
    const foreignId = raw.foreign_course_id ? Number(raw.foreign_course_id) : null;
    const cafoscariId = raw.cafoscari_course_id ? Number(raw.cafoscari_course_id) : null;

    if (!foreignId && !cafoscariId) {
      this.addExamError.set('Select at least one exam to create a mapping.');
      return;
    }

    const existingMappings = application.mappings.map((mapping) => ({
      foreign_course_id: mapping.foreignCourseId ?? undefined,
      cafoscari_course_id: mapping.cafoscariCourseId ?? undefined
    }));

    const payload: UpdateApplicationPayload = {
      host_institution_id: Number(
        application.raw.host_institution?.host_institution_id ?? application.raw.host_institution_id
      ),
      academic_year: String(application.raw.academic_year),
      expected_mobility_period: application.raw.expected_mobility_period,
      mappings: [
        ...existingMappings,
        {
          foreign_course_id: foreignId ?? undefined,
          cafoscari_course_id: cafoscariId ?? undefined
        }
      ]
    };

    this.addExamLoading.set(true);
    this.addExamError.set(null);

    this.applicationService.updateApplication(Number(application.id), payload).subscribe({
      next: () => {
        this.addExamLoading.set(false);
        this.closeAddExamModal();
        this.loadApplicationsForCurrentUser();
      },
      error: (error: HttpErrorResponse) => {
        this.addExamLoading.set(false);
        this.addExamError.set(this.extractErrorMessage(error));
      }
    });
  }

  getForeignCourseLabel(application: ApplicationListItem, foreignCourseId: number | null): string {
    if (foreignCourseId == null) {
      return 'N/A';
    }
    return this.getCourseLabel(application.hostUniversityId, foreignCourseId);
  }

  getCafoscariCourseLabel(cafoscariCourseId: number | null): string {
    if (cafoscariCourseId == null) {
      return 'N/A';
    }
    return this.getCourseLabel(1, cafoscariCourseId);
  }

  formatCourseOption(option: CourseOption): string {
    const codePrefix = option.code ? `${option.code} - ` : '';
    return `${codePrefix}${option.name}`;
  }

  private loadApplicationsForCurrentUser(): void {
    const user = this.currentUser();
    if (!user) {
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.expandedApplicationIds.set([]);

    this.applicationService.getStudentApplications(Number(user.user_id)).subscribe({
      next: (response: ApplicationsResponse) => {
        this.loading.set(false);
        const applications = response.data.applications ?? [];
        this.applicationsCount.set(applications.length);
        const cards = this.mapApplicationsToCards(applications);
        this.applicationCards.set(cards);
        this.preloadCoursesForApplications(cards);
      },
      error: (error: HttpErrorResponse) => {
        this.loading.set(false);
        this.error.set(this.extractErrorMessage(error));
      }
    });
  }

  private mapApplicationsToCards(applications: any[]): ApplicationListItem[] {
    return applications.map((application) => ({
      id: String(application.application_id ?? 'N/A'),
      stateName: String(application.current_state?.name ?? 'Unknown state'),
      isClosed: String(application.current_state?.name ?? '').toLowerCase().includes('closed'),
      academicYear: String(application.academic_year ?? '-'),
      mobilityPeriod: String(application.expected_mobility_period ?? '-'),
      universityName: String(
        application.host_institution?.name ?? application.host_institution_name ?? 'Unknown university'
      ),
      hostUniversityId: this.extractHostUniversityId(application),
      mappings: this.extractMappingsFromApplication(application),
      raw: application
    }));
  }

  private extractMappingsFromApplication(application: any): Array<{
    foreignCourseId: number | null;
    cafoscariCourseId: number | null;
  }> {
    const versions = Array.isArray(application.versions) ? application.versions : [];
    if (versions.length === 0) {
      return [];
    }

    const activeVersion =
      versions.find((version: any) => version?.is_active === true) ?? versions[versions.length - 1];
    const mappings = Array.isArray(activeVersion?.mapping) ? activeVersion.mapping : [];

    return mappings.map((mapping: any) => ({
      foreignCourseId: mapping?.foreign_course_id != null ? Number(mapping.foreign_course_id) : null,
      cafoscariCourseId: mapping?.cafoscari_course_id != null ? Number(mapping.cafoscari_course_id) : null
    }));
  }

  private extractHostUniversityId(application: any): number | null {
    const rawId = application.host_institution?.host_institution_id ?? application.host_institution_id;
    if (rawId == null) {
      return null;
    }

    const numericId = Number(rawId);
    return Number.isFinite(numericId) ? numericId : null;
  }

  private preloadCoursesForApplications(cards: ApplicationListItem[]): void {
    this.ensureUniversityCourses(1);

    const uniqueHostIds = new Set<number>();
    cards.forEach((card) => {
      if (card.hostUniversityId) {
        uniqueHostIds.add(card.hostUniversityId);
      }
    });

    uniqueHostIds.forEach((id) => this.ensureUniversityCourses(id));
  }

  private ensureUniversityCourses(universityId: number, onDone?: () => void): void {
    const cached = this.coursesByUniversity()[universityId];
    if (cached) {
      onDone?.();
      return;
    }

    this.lookupsService.getUniversityCourses(universityId).subscribe({
      next: (response) => {
        const options = response.data.courses ?? [];
        this.coursesByUniversity.set({
          ...this.coursesByUniversity(),
          [universityId]: options
        });

        if (universityId === 1) {
          this.cafoscariCourses.set(options);
        }

        onDone?.();
      },
      error: () => {
        if (universityId === 1) {
          this.cafoscariCourses.set([]);
        }
      }
    });
  }

  private loadCoursesForAddExamModal(application: ApplicationListItem): void {
    this.ensureUniversityCourses(1, () => {
      this.cafoscariCourses.set(this.coursesByUniversity()[1] ?? []);
    });

    if (!application.hostUniversityId) {
      this.selectedHostUniversityCourses.set([]);
      return;
    }

    this.ensureUniversityCourses(application.hostUniversityId, () => {
      this.selectedHostUniversityCourses.set(
        this.coursesByUniversity()[application.hostUniversityId as number] ?? []
      );
    });
  }

  private getCourseLabel(universityId: number | null, courseId: number): string {
    const defaultLabel = `#${courseId}`;
    if (!universityId) {
      return defaultLabel;
    }

    const options = this.coursesByUniversity()[universityId] ?? [];
    const match = options.find((option) => Number(option.course_id) === Number(courseId));
    if (!match) {
      return defaultLabel;
    }

    return this.formatCourseOption(match);
  }

  private extractErrorMessage(error: HttpErrorResponse): string {
    return (error.error?.message as string | undefined) || 'Request failed. Please try again.';
  }
}
