import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { ApplicationService, ApplicationsResponse } from '../../../../core/services/application.service';
import { CourseOption, LookupsService } from '../../../../core/services/lookups.service';
import { SessionService } from '../../../../core/services/session.service';

interface ApplicationListItem {
  id: string;
  stateName: string;
  isClosed: boolean;
  academicYear: string;
  mobilityPeriod: string;
  universityName: string;
  studentName: string | null;
  studentLastname: string | null;
  hostUniversityId: number | null;
  mappings: Array<{ foreignCourseId: number | null; cafoscariCourseId: number | null }>;
  raw: any;
}

@Component({
  selector: 'app-referent-staff-applications-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './referent-staff-applications-page.component.html'
})
export class ReferentStaffApplicationsPageComponent {
  private readonly session = inject(SessionService);
  private readonly applicationService = inject(ApplicationService);
  private readonly lookupsService = inject(LookupsService);

  readonly currentUser = this.session.currentUser;

  readonly staffScopeNote = signal<string | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly applicationCards = signal<ApplicationListItem[]>([]);
  readonly applicationsCount = signal(0);
  readonly expandedApplicationIds = signal<string[]>([]);
  readonly coursesByUniversity = signal<Record<number, CourseOption[]>>({});

  constructor() {
    this.loadApplicationsForCurrentRole();
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

  private loadApplicationsForCurrentRole(): void {
    const user = this.currentUser();
    if (!user) {
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.staffScopeNote.set(null);
    this.expandedApplicationIds.set([]);

    if (user.role === 'referents') {
      this.applicationService.getReferentApplications(Number(user.user_id)).subscribe({
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
      return;
    }

    this.applicationService.getAllApplications().subscribe({
      next: (response: ApplicationsResponse) => {
        this.loading.set(false);
        const applications = response.data.applications ?? [];
        this.applicationsCount.set(applications.length);
        const cards = this.mapApplicationsToCards(applications);
        this.applicationCards.set(cards);
        this.preloadCoursesForApplications(cards);
        this.staffScopeNote.set('Staff view currently uses the global applications endpoint from backend.');
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
      studentName: application.student?.name != null ? String(application.student.name) : null,
      studentLastname:
        application.student?.lastname != null ? String(application.student.lastname) : null,
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
        onDone?.();
      },
      error: () => {
      }
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

    const codePrefix = match.code ? `${match.code} - ` : '';
    return `${codePrefix}${match.name}`;
  }

  private extractErrorMessage(error: HttpErrorResponse): string {
    return (error.error?.message as string | undefined) || 'Request failed. Please try again.';
  }
}
