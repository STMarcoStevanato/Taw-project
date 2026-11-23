
import {
    Component,
    inject,
    model,
    OnInit,
    signal
  } from '@angular/core';
  
  import {
    FormArray,
    FormControl,
    FormGroup,
    ReactiveFormsModule,
    Validators
  } from '@angular/forms';
  
  import { InputTextModule } from 'primeng/inputtext';
  import { DialogModule } from 'primeng/dialog';
  import { ButtonModule } from 'primeng/button';
  import { SelectModule } from 'primeng/select';
  import { MessageModule } from 'primeng/message';
  import { AuthService } from '../../auth/auth.service';
  
  import { ApplicationService } from '../application.service';
  import {
    Referent,
    University,
    Course,
    CreateApplicationRequest
  } from '../application.model';
  
  type MappingForm = FormGroup<{
    foreign_course_id: FormControl<string | null>;
    cafoscari_course_id: FormControl<string | null>;
  }>;
  
  @Component({
    selector: 'app-application-create',
    imports: [
      ReactiveFormsModule,
      DialogModule,
      ButtonModule,
      SelectModule,
      MessageModule,
      InputTextModule
    ],
    templateUrl: './application-create.html',
    styleUrl: './application-create.css'
  })
  export class ApplicationCreate implements OnInit {
  
    private readonly applicationService = inject(ApplicationService);

    private readonly authService = inject(AuthService);
    readonly saving = signal(false);
  
    readonly visible = model(false);
  
    readonly referents = signal<
      (Referent & { fullName: string })[]
    >([]);
    readonly loading = signal(false);
  
    readonly universities = signal<University[]>([]);
    readonly universitiesLoading = signal(false);
  
    readonly foreignCourses = signal<
      (Course & { displayName: string })[]
    >([]);
  
    readonly cafoscariCourses = signal<
      (Course & { displayName: string })[]
    >([]);
  
    readonly foreignCoursesLoading = signal(false);
    readonly cafoscariCoursesLoading = signal(false);
  
    readonly errorMessage = signal('');
  
    readonly form = new FormGroup({
  
      referent_id: new FormControl<string | null>(
        null,
        Validators.required
      ),
  
      host_institution_id: new FormControl<string | null>(
        null,
        Validators.required
      ),
  
      academic_year: new FormControl('', {
        nonNullable: true,
        validators: [
          Validators.required,
          Validators.pattern(/^\d{4}\/\d{2}$/)
        ]
      }),
  
      expected_mobility_period: new FormControl<
        'first_semester' | 'second_semester' | 'full_year' | null
      >(null, Validators.required),
  
      mappings: new FormArray<MappingForm>([])
    });
  
    readonly periods = [
      { label: 'Primo semestre', value: 'first_semester' },
      { label: 'Secondo semestre', value: 'second_semester' },
      { label: 'Intero anno', value: 'full_year' }
    ];
  
    get mappings(): FormArray<MappingForm> {
      return this.form.controls.mappings;
    }
  
    ngOnInit(): void {
        this.loadReferents();
        this.loadUniversities();
        this.loadCafoscariCourses();
      
        this.form.controls.host_institution_id.valueChanges
          .subscribe(universityId => {
      
            this.foreignCourses.set([]);
      
            this.mappings.clear();
            this.addMapping();
      
            this.foreignCoursesLoading.set(!!universityId);
      
            if (universityId) {
              this.loadForeignCourses(universityId);
            }
          });
      
        this.addMapping();
      }
  
    loadReferents(): void {
      this.loading.set(true);
      this.errorMessage.set('');
  
      this.applicationService.getReferents().subscribe({
        next: response => {
          this.referents.set(
            response.data.referents.map(referent => ({
              ...referent,
              fullName: `${referent.name} ${referent.lastname}`
            }))
          );
          this.loading.set(false);
        },
        error: () => {
          this.errorMessage.set(
            'Impossibile caricare i referenti.'
          );
          this.loading.set(false);
        }
      });
    }
  
    loadUniversities(): void {
      this.universitiesLoading.set(true);
  
      this.applicationService.getUniversities().subscribe({
        next: response => {
          this.universities.set(
            response.data.universities.filter(
              university => university.university_id !== '1'
            )
          );
          this.universitiesLoading.set(false);
        },
        error: () => {
          this.errorMessage.set(
            'Impossibile caricare le università.'
          );
          this.universitiesLoading.set(false);
        }
      });
    }
  
    loadCafoscariCourses(): void {
      this.cafoscariCoursesLoading.set(true);
  
      this.applicationService.getUniversityCourses('1').subscribe({
        next: response => {
          this.cafoscariCourses.set(
            response.data.courses.map(course => ({
              ...course,
              displayName: `${course.code} - ${course.name}`
            }))
          );
          this.cafoscariCoursesLoading.set(false);
        },
        error: () => {
          this.errorMessage.set(
            'Impossibile caricare i corsi di Ca Foscari.'
          );
          this.cafoscariCoursesLoading.set(false);
        }
      });
    }
  
    loadForeignCourses(universityId: string): void {
      this.foreignCoursesLoading.set(true);
  
      this.applicationService
        .getUniversityCourses(universityId)
        .subscribe({
          next: response => {
            if (
              this.form.controls.host_institution_id.value
              !== universityId
            ) {
              return;
            }
  
            this.foreignCourses.set(
              response.data.courses.map(course => ({
                ...course,
                displayName: `${course.code} - ${course.name}`
              }))
            );
            this.foreignCoursesLoading.set(false);
          },
          error: () => {
            if (
              this.form.controls.host_institution_id.value
              !== universityId
            ) {
              return;
            }
  
            this.errorMessage.set(
              'Impossibile caricare i corsi esteri.'
            );
            this.foreignCoursesLoading.set(false);
          }
        });
    }
  
    private createMappingGroup(): MappingForm {
      return new FormGroup({
        foreign_course_id: new FormControl<string | null>(
          null,
          Validators.required
        ),
        cafoscari_course_id: new FormControl<string | null>(
          null,
          Validators.required
        )
      });
    }
  
    addMapping(): void {
      this.mappings.push(this.createMappingGroup());
    }
  
    removeMapping(index: number): void {
      if (this.mappings.length > 1) {
        this.mappings.removeAt(index);
      }
    }
  
    close(): void {
      this.visible.set(false);
    }


submit(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }
  
    const user = this.authService.currentUser();
  
    if (!user) {
      this.errorMessage.set('Utente non autenticato.');
      return;
    }
  
    const value = this.form.getRawValue();
  
    if (
      !value.referent_id ||
      !value.host_institution_id ||
      !value.expected_mobility_period ||
      value.mappings.length === 0
    ) {
      this.errorMessage.set('Compila tutti i campi obbligatori.');
      return;
    }
  
    const payload: CreateApplicationRequest = {
      student_id: Number(user.user_id),
      referent_id: Number(value.referent_id),
      host_institution_id: Number(value.host_institution_id),
      academic_year: value.academic_year,
      expected_mobility_period: value.expected_mobility_period,
      mappings: value.mappings.map(mapping => ({
        foreign_course_id: Number(mapping.foreign_course_id),
        cafoscari_course_id: Number(mapping.cafoscari_course_id)
      }))
    };
    console.log(payload)
  
    this.errorMessage.set('');
    this.saving.set(true);
  
    this.applicationService.createApplication(payload).subscribe({
      next: () => {
        this.saving.set(false);
        this.form.reset();
        this.mappings.clear();
        this.addMapping();
        this.close();
      },
      error: () => {
        this.saving.set(false);
        this.errorMessage.set(
          'Errore durante la creazione dell\'Application.'
        );
      }
    });
  }
  
  }
  