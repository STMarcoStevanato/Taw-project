import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  ApplicationService,
  CreateApplicationPayload
} from '../../../../core/services/application.service';
import {
  CourseOption,
  LookupsService,
  ReferentOption,
  UniversityOption
} from '../../../../core/services/lookups.service';
import { SessionService } from '../../../../core/services/session.service';

@Component({
  selector: 'app-student-create-application-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './student-create-application-page.component.html'
})
export class StudentCreateApplicationPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly session = inject(SessionService);
  private readonly applicationService = inject(ApplicationService);
  private readonly lookupsService = inject(LookupsService);

  readonly currentUser = this.session.currentUser;
  readonly canCreateApplication = computed(() => this.currentUser()?.role === 'students');

  readonly createModalOpen = signal(false);
  readonly createApplicationLoading = signal(false);
  readonly createApplicationError = signal<string | null>(null);
  readonly createApplicationSuccess = signal<string | null>(null);

  readonly referentOptions = signal<ReferentOption[]>([]);
  readonly universityOptions = signal<UniversityOption[]>([]);
  readonly cafoscariCourses = signal<CourseOption[]>([]);
  readonly createModalHostUniversityCourses = signal<CourseOption[]>([]);
  readonly coursesByUniversity = signal<Record<number, CourseOption[]>>({});
  readonly academicYearOptions = this.buildAcademicYearOptions();

  readonly createApplicationForm = this.fb.group({
    referent_id: this.fb.nonNullable.control<number | null>(null, [Validators.required]),
    host_institution_id: this.fb.nonNullable.control<number | null>(null, [Validators.required]),
    academic_year: this.fb.nonNullable.control('', [
      Validators.required,
      Validators.pattern(/^\d{4}\/\d{2}$/)
    ]),
    expected_mobility_period: this.fb.nonNullable.control<
      'first_semester' | 'second_semester' | 'full_year'
    >('first_semester', [Validators.required]),
    mappings: this.fb.array([this.createMappingFormGroup()])
  });

  get mappingsFormArray(): FormArray {
    return this.createApplicationForm.get('mappings') as FormArray;
  }

  formatCourseOption(option: CourseOption): string {
    const codePrefix = option.code ? `${option.code} - ` : '';
    return `${codePrefix}${option.name}`;
  }

  openCreateApplicationModal(): void {
    if (!this.canCreateApplication()) {
      return;
    }
    this.createApplicationError.set(null);
    this.createApplicationSuccess.set(null);
    this.createModalOpen.set(true);
    this.loadModalLookups();
  }

  closeCreateApplicationModal(): void {
    this.createModalOpen.set(false);
    this.createApplicationError.set(null);
  }

  addMappingRow(): void {
    this.mappingsFormArray.push(this.createMappingFormGroup());
  }

  removeMappingRow(index: number): void {
    if (this.mappingsFormArray.length <= 1) {
      return;
    }
    this.mappingsFormArray.removeAt(index);
  }

  onCreateHostUniversityChanged(): void {
    const universityId = Number(this.createApplicationForm.controls.host_institution_id.value);
    if (!universityId) {
      this.createModalHostUniversityCourses.set([]);
      return;
    }

    this.ensureUniversityCourses(universityId, () => {
      this.createModalHostUniversityCourses.set(this.coursesByUniversity()[universityId] ?? []);
    });
  }

  getSelectedForeignCourseId(mappingIndex: number): number | null {
    const control = this.mappingsFormArray.at(mappingIndex);
    const value = control?.get('foreign_course_id')?.value;
    if (value == null || value === '') {
      return null;
    }
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : null;
  }

  getSelectedCafoscariCourseId(mappingIndex: number): number | null {
    const control = this.mappingsFormArray.at(mappingIndex);
    const value = control?.get('cafoscari_course_id')?.value;
    if (value == null || value === '') {
      return null;
    }
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : null;
  }

  submitCreateApplication(): void {
    const user = this.currentUser();
    if (!user || user.role !== 'students') {
      return;
    }

    if (this.createApplicationForm.invalid) {
      this.createApplicationForm.markAllAsTouched();
      this.createApplicationError.set('Please complete all required fields.');
      return;
    }

    const raw = this.createApplicationForm.getRawValue();
    const studentId = Number(user.user_id);
    const referentId = Number(raw.referent_id);
    const hostInstitutionId = Number(raw.host_institution_id);

    if (studentId === referentId) {
      this.createApplicationError.set('Referent cannot be the same user as the student. Choose a different referent.');
      return;
    }

    const mappings = (raw.mappings ?? [])
      .map((m) => ({
        foreign_course_id: m?.foreign_course_id ? Number(m.foreign_course_id) : undefined,
        cafoscari_course_id: m?.cafoscari_course_id ? Number(m.cafoscari_course_id) : undefined
      }))
      .filter((m) => m.foreign_course_id || m.cafoscari_course_id);

    if (mappings.length === 0) {
      this.createApplicationError.set('Add at least one linked exam mapping before creating the application.');
      return;
    }

    const invalidSameIdIndex = mappings.findIndex(
      (mapping) =>
        mapping.foreign_course_id != null &&
        mapping.cafoscari_course_id != null &&
        mapping.foreign_course_id === mapping.cafoscari_course_id
    );
    if (invalidSameIdIndex !== -1) {
      this.createApplicationError.set(
        `Mapping #${invalidSameIdIndex + 1} is invalid: foreign and Ca' Foscari exam IDs cannot be the same.`
      );
      return;
    }

    if (this.hasDuplicateMappingPairs(mappings)) {
      this.createApplicationError.set('Duplicate course mappings are not allowed. Remove repeated pairs and try again.');
      return;
    }

    const payload: CreateApplicationPayload = {
      student_id: studentId,
      referent_id: referentId,
      host_institution_id: hostInstitutionId,
      academic_year: raw.academic_year ?? '',
      expected_mobility_period: raw.expected_mobility_period ?? 'first_semester',
      mappings
    };

    this.createApplicationLoading.set(true);
    this.createApplicationError.set(null);

    this.applicationService.createApplication(payload).subscribe({
      next: () => {
        this.createApplicationLoading.set(false);
        this.createApplicationSuccess.set('Application created successfully.');
        this.closeCreateApplicationModal();
        this.resetCreateApplicationForm();
      },
      error: (error: HttpErrorResponse) => {
        this.createApplicationLoading.set(false);
        this.createApplicationError.set(this.extractErrorMessage(error));
      }
    });
  }

  private loadModalLookups(): void {
    this.ensureUniversityCourses(1);

    if (this.referentOptions().length === 0) {
      this.lookupsService.getReferents().subscribe({
        next: (response) => this.referentOptions.set(response.data.referents ?? []),
        error: () => this.createApplicationError.set('Could not load referents. Try reopening the modal.')
      });
    }

    if (this.universityOptions().length === 0) {
      this.lookupsService.getUniversities().subscribe({
        next: (response) => {
          const options = (response.data.universities ?? []).filter(
            (u) => Number(u.university_id ?? u.host_institution_id ?? 0) !== 1
          );
          this.universityOptions.set(options);
        },
        error: () => this.createApplicationError.set('Could not load universities. Try reopening the modal.')
      });
    }
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

  private createMappingFormGroup() {
    return this.fb.group({
      foreign_course_id: this.fb.nonNullable.control<number | null>(null),
      cafoscari_course_id: this.fb.nonNullable.control<number | null>(null)
    });
  }

  private hasDuplicateMappingPairs(
    mappings: Array<{ foreign_course_id?: number; cafoscari_course_id?: number }>
  ): boolean {
    const seenPairs = new Set<string>();

    for (const mapping of mappings) {
      const pairKey = `${mapping.foreign_course_id ?? 'null'}-${mapping.cafoscari_course_id ?? 'null'}`;
      if (seenPairs.has(pairKey)) {
        return true;
      }
      seenPairs.add(pairKey);
    }

    return false;
  }

  private resetCreateApplicationForm(): void {
    this.createApplicationForm.reset({
      referent_id: null,
      host_institution_id: null,
      academic_year: '',
      expected_mobility_period: 'first_semester',
      mappings: []
    });

    this.createModalHostUniversityCourses.set([]);
    this.mappingsFormArray.clear();
    this.mappingsFormArray.push(this.createMappingFormGroup());
  }

  private extractErrorMessage(error: HttpErrorResponse): string {
    return (error.error?.message as string | undefined) || 'Request failed. Please try again.';
  }

  private buildAcademicYearOptions(): string[] {
    const currentYear = new Date().getFullYear();
    const startYear = currentYear - 1;
    const yearsToShow = 8;

    return Array.from({ length: yearsToShow }, (_, index) => {
      const firstYear = startYear + index;
      const secondYear = String(firstYear + 1).slice(-2);
      return `${firstYear}/${secondYear}`;
    });
  }
}
