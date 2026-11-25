
import {
    Component,
    computed,
    effect,
    inject,
    input,
    model,
    output,
    signal,
    untracked
} from '@angular/core';

import { FormsModule } from '@angular/forms';
import { forkJoin, Subscription } from 'rxjs';

import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { DividerModule } from 'primeng/divider';
import { MessageModule } from 'primeng/message';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

import {
    Application,
    Course,
    University,
    MappingCourse,
    UpdateApplicationRequest
} from '../application.model';

import { ApplicationService } from '../application.service';

import {
    normalizeApplicationState
} from '../application-lifecycle';


interface EditableMapping {
    id: number;
    cafoscari_course_id: string | null;
    foreign_course_id: string | null;
    locked: boolean;
}


@Component({
    selector: 'app-application-edit-mapping',
    imports: [
        FormsModule,
        DialogModule,
        ButtonModule,
        SelectModule,
        InputTextModule,
        DividerModule,
        MessageModule,
        ProgressSpinnerModule
    ],
    templateUrl: './application-edit-mapping.html',
    styleUrl: './application-edit-mapping.css'
})
export class ApplicationEditMapping {

    private readonly applicationService =
        inject(ApplicationService);

    private readonly cafoscariUniversityId = '1';

    readonly application = input<Application | null>(null);

    readonly version = input<
        Application['versions'][number] | null
    >(null);

    readonly mappingCourses =
        input<Record<string, MappingCourse[]>>({});

    readonly visible = model(false);

    readonly updated = output<void>();
    readonly editDialogVisible = signal(false);


    // LOADING

    readonly loading = signal(false);
    readonly saving = signal(false);
    readonly loadingForeignCourses = signal(false);

    readonly errorMessage = signal('');
    readonly coursesError = signal('');


    // DATA

    readonly universities = signal<University[]>([]);
    readonly cafoscariCourses = signal<Course[]>([]);
    readonly foreignCourses = signal<Course[]>([]);


    // FORM

    readonly hostInstitutionId = signal<string | null>(null);

    readonly academicYear = signal('');

    readonly mobilityPeriod = signal<
        Application['expected_mobility_period']
    >('first_semester');

    readonly mappings = signal<EditableMapping[]>([]);

    private nextMappingId = 1;

    private foreignCoursesSubscription?: Subscription;


    readonly mobilityPeriods = [
        {
            label: 'Primo semestre',
            value: 'first_semester'
        },
        {
            label: 'Secondo semestre',
            value: 'second_semester'
        },
        {
            label: 'Intero anno',
            value: 'full_year'
        }
    ];


    // STATE

    readonly currentState = computed(() => {

        const application = this.application();

        return application
            ? normalizeApplicationState(
                application.current_state.name
            )
            : '';
    });


    readonly canEditDetails = computed(() =>
        this.currentState() === 'rejected by referent'
    );


    readonly isMobilityInProgress = computed(() =>
        this.currentState() === 'mobility in progress'
    );


    readonly canEdit = computed(() =>
        this.canEditDetails() ||
        this.isMobilityInProgress()
    );


    // COURSE OPTIONS

    readonly cafoscariCourseOptions = computed(() =>
        this.cafoscariCourses().map(course => ({
            label: `${course.code} - ${course.name} (${course.credits} CFU)`,
            value: String(course.course_id)
        }))
    );


    readonly foreignCourseOptions = computed(() =>
        this.foreignCourses().map(course => ({
            label: `${course.code} - ${course.name} (${course.credits} ECTS)`,
            value: String(course.course_id)
        }))
    );


    readonly universityOptions = computed(() =>
        this.universities().map(university => ({
            label: university.name,
            value: String(university.university_id)
        }))
    );


    // VALIDATION

    readonly formValid = computed(() => {

        const mappings = this.mappings();

        return this.canEdit() &&
            !!this.hostInstitutionId() &&
            /^\d{4}\/\d{2}$/.test(this.academicYear()) &&
            mappings.length > 0 &&
            mappings.every(mapping =>
                !!mapping.cafoscari_course_id &&
                !!mapping.foreign_course_id
            );
    });

    // TOTAL CREDITS

    readonly totalCafoscariCredits = computed(() => {

        const selectedIds = new Set(
            this.mappings().map(
                mapping => mapping.cafoscari_course_id
            )
        );

        return this.cafoscariCourses()
            .filter(course =>
                selectedIds.has(String(course.course_id))
            )
            .reduce(
                (total, course) =>
                    total + Number(course.credits),
                0
            );
    });


    readonly totalForeignCredits = computed(() => {

        const selectedIds = new Set(
            this.mappings().map(
                mapping => mapping.foreign_course_id
            )
        );

        return this.foreignCourses()
            .filter(course =>
                selectedIds.has(String(course.course_id))
            )
            .reduce(
                (total, course) =>
                    total + Number(course.credits),
                0
            );
    });


    constructor() {

        effect(onCleanup => {
    
            const application = this.application();
            const version = this.version();
            const visible = this.visible();
            const mappingCourses = this.mappingCourses();
    
            if (!application || !visible) {
                return;
            }
    
            if (this.isMobilityInProgress() && !version) {
                return;
            }
    
            const subscription = untracked(() => {
    
                this.initializeForm(
                    application,
                    version,
                    mappingCourses
                );
    
                return this.loadData(
                    String(
                        application.host_institution.host_institution_id
                    )
                );
    
            });
    
            onCleanup(() => {
                subscription.unsubscribe();
                this.foreignCoursesSubscription?.unsubscribe();
            });
    
        });

    }


    private initializeForm(
        application: Application,
        version: Application['versions'][number] | null,
        mappingCourses: Record<string, MappingCourse[]>
    ): void {
    
        this.errorMessage.set('');
        this.coursesError.set('');
    
        this.hostInstitutionId.set(
            String(
                application.host_institution.host_institution_id
            )
        );
    
        this.academicYear.set(application.academic_year);
    
        this.mobilityPeriod.set(
            application.expected_mobility_period
        );
    
        this.nextMappingId = 1;
    
        const mappings: EditableMapping[] =
            (version?.mapping ?? []).map(mapping => {
    
                const courses =
                    mappingCourses[String(mapping.mapping_id)] ?? [];
    
                const hasRegisteredExam = courses.some(
                    course =>
                        course.foreign_score != null ||
                        course.exam_date != null
                );
    
                return {
                    id: this.nextMappingId++,
    
                    cafoscari_course_id:
                        String(mapping.cafoscari_course_id),
    
                    foreign_course_id:
                        String(mapping.foreign_course_id),
    
                    locked:
                        this.isMobilityInProgress() &&
                        hasRegisteredExam
                };
    
            });
    
        if (this.canEditDetails() && mappings.length === 0) {
    
            mappings.push({
                id: this.nextMappingId++,
                cafoscari_course_id: null,
                foreign_course_id: null,
                locked: false
            });
    
        }
    
        this.mappings.set(mappings);
    
    }


    private loadData(
        hostInstitutionId: string
    ): Subscription {

        this.loading.set(true);
        this.loadingForeignCourses.set(false);

        this.universities.set([]);
        this.cafoscariCourses.set([]);
        this.foreignCourses.set([]);

        return forkJoin({

            universities:
                this.applicationService.getUniversities(),

            cafoscariCourses:
                this.applicationService.getUniversityCourses(
                    this.cafoscariUniversityId
                ),

            foreignCourses:
                this.applicationService.getUniversityCourses(
                    hostInstitutionId
                )

        }).subscribe({

            next: response => {

                this.universities.set(
                    response.universities.data.universities.filter(
                        university =>
                            String(university.university_id) !==
                            this.cafoscariUniversityId
                    )
                );

                this.cafoscariCourses.set(
                    response.cafoscariCourses.data.courses
                );

                this.foreignCourses.set(
                    response.foreignCourses.data.courses
                );

                this.loading.set(false);
            },

            error: () => {

                this.errorMessage.set(
                    'Impossibile caricare i dati del piano di studi.'
                );

                this.loading.set(false);
            }
        });
    }


    // HOST INSTITUTION

    changeHostInstitution(
        universityId: string | null
    ): void {

        if (
            !this.canEditDetails() ||
            !universityId ||
            universityId === this.hostInstitutionId()
        ) {
            return;
        }

        this.hostInstitutionId.set(universityId);

        this.foreignCoursesSubscription?.unsubscribe();

        this.foreignCourses.set([]);
        this.coursesError.set('');

        this.mappings.update(mappings =>
            mappings.map(mapping => ({
                ...mapping,
                foreign_course_id: null
            }))
        );

        this.loadingForeignCourses.set(true);

        this.foreignCoursesSubscription =
            this.applicationService
                .getUniversityCourses(universityId)
                .subscribe({

                    next: response => {

                        this.foreignCourses.set(
                            response.data.courses
                        );

                        this.loadingForeignCourses.set(false);
                    },

                    error: () => {

                        this.coursesError.set(
                            'Impossibile caricare i corsi dell’università.'
                        );

                        this.loadingForeignCourses.set(false);
                    }
                });
    }


    // MAPPINGS

    addMapping(): void {

        this.mappings.update(mappings => [
            ...mappings,
            {
                id: this.nextMappingId++,
                cafoscari_course_id: null,
                foreign_course_id: null,
                locked: false
            }
        ]);
    }


    removeMapping(id: number): void {

        this.mappings.update(mappings =>
            mappings.filter(
                mapping =>
                    mapping.id !== id || mapping.locked
            )
        );
    }


    changeCafoscariCourse(
        id: number,
        courseId: string | null
    ): void {

        this.mappings.update(mappings =>
            mappings.map(mapping =>
                mapping.id === id && !mapping.locked
                    ? {
                        ...mapping,
                        cafoscari_course_id: courseId
                    }
                    : mapping
            )
        );
    }


    changeForeignCourse(
        id: number,
        courseId: string | null
    ): void {

        this.mappings.update(mappings =>
            mappings.map(mapping =>
                mapping.id === id && !mapping.locked
                    ? {
                        ...mapping,
                        foreign_course_id: courseId
                    }
                    : mapping
            )
        );
    }
    // SUBMIT

    save(): void {

        const application = this.application();

        if (
            !application ||
            !this.formValid() ||
            this.saving() ||
            this.loading() ||
            this.loadingForeignCourses() ||
            this.coursesError()
        ) {
            return;
        }

        const data: UpdateApplicationRequest = {

            host_institution_id: this.canEditDetails()
                ? Number(this.hostInstitutionId())
                : Number(
                    application.host_institution.host_institution_id
                ),

            academic_year: this.canEditDetails()
                ? this.academicYear()
                : application.academic_year,

            expected_mobility_period: this.canEditDetails()
                ? this.mobilityPeriod()
                : application.expected_mobility_period,

            mappings: this.mappings().map(mapping => ({
                foreign_course_id:
                    Number(mapping.foreign_course_id),

                cafoscari_course_id:
                    Number(mapping.cafoscari_course_id)
            }))
        };

        this.saving.set(true);
        this.errorMessage.set('');

        this.applicationService
            .updateApplication(
                application.application_id,
                data
            )
            .subscribe({

                next: () => {

                    this.saving.set(false);
                    this.visible.set(false);
                    this.updated.emit();
                },

                error: error => {

                    this.errorMessage.set(
                        error.error?.message ??
                        'Impossibile aggiornare l’Application.'
                    );

                    this.saving.set(false);
                }
            });
    }


    close(): void {

        if (!this.saving()) {
            this.visible.set(false);
        }
    }
}
