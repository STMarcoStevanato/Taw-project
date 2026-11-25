
import {
    Component,
    computed,
    inject,
    OnInit,
    signal,
} from '@angular/core';

import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { TabsModule } from 'primeng/tabs';
import { DividerModule } from 'primeng/divider';
import { MessageModule } from 'primeng/message';
import { TableModule } from 'primeng/table';
import { SelectModule } from 'primeng/select';
import { FileUploadModule, FileUploadHandlerEvent } from 'primeng/fileupload';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

import { AuthService } from '../../auth/auth.service';
import { ApplicationService } from '../application.service';
import { Application, MappingCourse } from '../application.model';

import { forkJoin, map } from 'rxjs';

import { ApplicationEditMapping } from '../application-edit-mapping/application-edit-mapping';

import { ApplicationReview } from '../application-review/application-review';


import {
    getApplicationStateInfo,
    normalizeApplicationState
} from '../application-lifecycle';

@Component({
    selector: 'app-application-manage',
    imports: [
        ButtonModule,
        CardModule,
        TagModule,
        TabsModule,
        DividerModule,
        MessageModule,
        ProgressSpinnerModule,
        TableModule,
        SelectModule,
        FileUploadModule,
        FormsModule,
        ApplicationEditMapping,
        ApplicationReview
    ],
    templateUrl: './application-manage.html',
    styleUrl: './application-manage.css'
})
export class ApplicationManage implements OnInit {

    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);

    private readonly authService = inject(AuthService);
    private readonly applicationService = inject(ApplicationService);

    readonly application = signal<Application | null>(null);

    readonly loading = signal(true);
    readonly errorMessage = signal('');

    readonly reviewSuccess = signal('');

    readonly activeTab = signal<string | number>('overview');

    readonly currentUser = this.authService.currentUser;

    readonly currentState = computed(() => {

        const application = this.application();

        return application
            ? normalizeApplicationState(application.current_state.name)
            : '';
    });

    readonly stateInfo = computed(() =>
        getApplicationStateInfo(this.currentState())
    );

    readonly isStudent = computed(() =>
        this.currentUser()?.role === 'students'
    );

    readonly isReferent = computed(() =>
        this.currentUser()?.role === 'referents'
    );

    readonly isStaff = computed(() =>
        this.currentUser()?.role === 'staff'
    );

    readonly requiresMyAction = computed(() => {

        const role = this.currentUser()?.role;

        return this.stateInfo().responsibleRole !== null
            && this.stateInfo().responsibleRole === role;
    });

    readonly canUploadLearningAgreement = computed(() =>
        this.isStudent() &&
        this.isLatestVersionSelected() &&
        [
            'created',
            'rejected by referent'
        ].includes(this.currentState())
    );

    readonly mappingCourses = signal<Record<string, MappingCourse[]>>({});

    readonly mappingsLoading = signal(false);
    readonly mappingsError = signal('');
    readonly selectedVersionId = signal<number | null>(null);

    readonly downloadingLA = signal(false);
    readonly uploadingLA = signal(false);

    readonly editDialogVisible = signal(false);

    readonly documentError = signal('');
    readonly documentSuccess = signal('');

    readonly versions = computed(() =>
        this.application()?.versions ?? []
    );

    readonly versionOptions = computed(() =>
        this.versions().map(version => ({
            label: `Versione ${version.version_number}${version.is_active ? ' - Attiva' : ''
                }`,
            value: Number(version.version_id)
        }))
    );

    readonly selectedVersion = computed(() =>
        this.versions().find(
            version =>
                Number(version.version_id) === this.selectedVersionId()
        ) ?? null
    );

    readonly canEditMapping = computed(() => {

        const version = this.selectedVersion();
    
        if (!this.isStudent()) return false;
    
        if (this.mappingsLoading() || this.mappingsError()) return false;
    
        if (this.currentState() === 'rejected by referent') {
            return true;
        }
    
        if (this.currentState() === 'mobility in progress') {
            return !!version && version.is_active;
        }
    
        return false;
    });

    readonly canEditApplicationDetails = computed(() =>
        this.isStudent() &&
        this.currentState() === 'rejected by referent'
    );

    readonly totalCafoscariCredits = computed(() =>
        this.calculateCredits('cafoscari')
    );

    readonly totalForeignCredits = computed(() =>
        this.calculateCredits('foreign')
    );

    private calculateCredits(
        courseType: 'cafoscari' | 'foreign'
    ): number {

        const courses = Object.values(this.mappingCourses())
            .flat()
            .filter(course => course.course_type === courseType);

        const uniqueCourses = new Map(
            courses.map(course => [
                String(course.university_courses_id),
                course
            ])
        );

        return Array.from(uniqueCourses.values()).reduce(
            (total, course) => total + Number(course.credits),
            0
        );
    }

    readonly isLatestVersionSelected = computed(() => {
        const versions = this.versions();
    
        const latestVersion = [...versions].sort(
            (a, b) =>
                Number(b.version_number) - Number(a.version_number)
        )[0];
    
        return !!latestVersion &&
            Number(latestVersion.version_id) === this.selectedVersionId();
    });

    readonly isLearningAgreementReviewState = computed(() => {

        return [
            'awaiting learning agreement approval by referent',
            'awaiting changes approval',
            'awaiting la changes approval'
        ].includes(this.currentState());
    });

    readonly canReviewLearningAgreement = computed(() => {

        const selected = this.selectedVersion();
    
        const pending = this.pendingVersion();
    
        return this.isReferent() &&
            !!selected &&
            !!pending &&
            selected.version_id === pending.version_id &&
            !this.mappingsLoading() &&
            !this.mappingsError();
    });

    readonly canDownloadLearningAgreement = computed(() => {

        return (
            this.isStudent() ||
            this.isReferent() ||
            this.isStaff()
        ) && !!this.selectedVersion();
    
    });

    readonly pendingVersion = computed(() => {

        if (!this.isLearningAgreementReviewState()) {
            return null;
        }
    
        const latestVersion = [...this.versions()].sort(
            (a, b) =>
                Number(b.version_number) -
                Number(a.version_number)
        )[0];
    
        return latestVersion && !latestVersion.is_active
            ? latestVersion
            : null;
    });

    readonly activeVersion = computed(() =>

        this.versions().find(
            version => version.is_active
        ) ?? null
    );

    ngOnInit(): void {

        this.loadApplication();
    }


    loadApplication(): void {

        const applicationId =
            this.route.snapshot.paramMap.get('applicationId');
    
        const user = this.currentUser();
    
        this.loading.set(true);
        this.errorMessage.set('');
    
        if (!applicationId || !user) {
    
            this.errorMessage.set(
                'Impossibile identificare l’Application.'
            );
    
            this.loading.set(false);
    
            return;
        }
    
        if (
            user.role !== 'students' &&
            user.role !== 'referents'
        ) {
    
            this.errorMessage.set(
                'Il recupero delle Application per questo ruolo non è ancora disponibile.'
            );
    
            this.loading.set(false);
    
            return;
        }
    
        const request$ = user.role === 'students'
    
            ? this.applicationService.getStudentApplications(
                user.user_id
            )
    
            : this.applicationService.getReferentApplications(
                user.user_id
            );
    
        request$.subscribe({
    
            next: response => {
    
                const application =
                    response.data.applications.find(
                        item =>
                            String(item.application_id) === applicationId
                    );
    
                if (!application) {
    
                    this.application.set(null);
    
                    this.errorMessage.set(
                        'Application non trovata.'
                    );
    
                } else {
    
                    this.application.set(application);
    
                    this.initializeVersion();
                }
    
                this.loading.set(false);
            },
    
            error: error => {
    
                this.errorMessage.set(
                    error.error?.message ??
                    'Impossibile caricare l’Application.'
                );
    
                this.loading.set(false);
            }
        });
    }


    goBack(): void {
        this.router.navigate([
            '/dashboard',
            'applications'
        ]);
    }


    openDocuments(): void {

        this.activeTab.set('documents');
    }

    openEditApplication(): void {
        this.editDialogVisible.set(true);
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


    formatDate(date: string | null | undefined): string {

        if (!date) {
            return 'Non ancora disponibile';
        }

        return new Intl.DateTimeFormat('it-IT', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            timeZone: 'Europe/Rome'
        }).format(new Date(date));
    }


    formatRole(role: string | null): string {

        switch (role) {

            case 'students':
                return 'Studente';

            case 'referents':
                return 'Referente';

            case 'staff':
                return 'Overseas Office';

            default:
                return 'Nessuno';
        }
    }

    initializeVersion(): void {

        const versions = this.versions();
    
        const activeVersion = versions.find(
            version => version.is_active
        );
    
        const latestVersion = [...versions].sort(
            (a, b) =>
                Number(b.version_number) -
                Number(a.version_number)
        )[0];
    
        const version = this.isLearningAgreementReviewState()
    
            ? latestVersion
    
            : activeVersion ?? latestVersion;
    
        if (version) {
    
            this.selectVersion(
                Number(version.version_id)
            );
    
        } else {
    
            this.selectedVersionId.set(null);
    
            this.mappingCourses.set({});
        }
    }

    selectVersion(versionId: number): void {
        this.selectedVersionId.set(versionId);
        this.loadMappings();
    }

    loadMappings(): void {
        const version = this.selectedVersion();

        this.mappingCourses.set({});
        this.mappingsError.set('');
        this.mappingsLoading.set(false);

        if (!version || !version.mapping.length) {
            return;
        }

        this.mappingsLoading.set(true);

        const requests = version.mapping.map(mapping =>
            this.applicationService
                .getMappingCourses(mapping.mapping_id)
                .pipe(
                    map(response => ({
                        mappingId: String(mapping.mapping_id),
                        courses: response.data
                    }))
                )
        );

        forkJoin(requests).subscribe({
            next: results => {
                const courses: Record<string, MappingCourse[]> = {};

                for (const result of results) {
                    courses[result.mappingId] = result.courses;
                }

                this.mappingCourses.set(courses);
                this.mappingsLoading.set(false);
            },

            error: () => {
                this.mappingsError.set(
                    'Impossibile caricare i mapping.'
                );

                this.mappingsLoading.set(false);
            }
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

    downloadLearningAgreement(): void {
        const version = this.selectedVersion();

        if (!version) {
            return;
        }

        this.downloadingLA.set(true);
        this.documentError.set('');

        this.applicationService
            .downloadLearningAgreement(version.version_id)
            .subscribe({

                next: blob => {
                    const url = URL.createObjectURL(blob);

                    const link = document.createElement('a');

                    link.href = url;
                    link.download =
                        `Learning_Agreement_v${version.version_id}.pdf`;

                    document.body.appendChild(link);
                    link.click();
                    link.remove();

                    setTimeout(() => URL.revokeObjectURL(url), 1000);

                    this.downloadingLA.set(false);
                },

                error: () => {
                    this.documentError.set(
                        'Impossibile scaricare il Learning Agreement.'
                    );

                    this.downloadingLA.set(false);
                }
            });
    }

    uploadLearningAgreement(event: FileUploadHandlerEvent): void {
        const version = this.selectedVersion();
        const file = event.files[0];

        if (
            !version ||
            !file ||
            !this.canUploadLearningAgreement()
        ) {
            return;
        }

        this.uploadingLA.set(true);
        this.documentError.set('');
        this.documentSuccess.set('');

        this.applicationService
            .uploadLearningAgreement(version.version_id, file)
            .subscribe({

                next: () => {
                    this.uploadingLA.set(false);

                    this.documentSuccess.set(
                        'Learning Agreement caricato correttamente.'
                    );

                    this.loadApplication();
                },

                error: () => {
                    this.uploadingLA.set(false);

                    this.documentError.set(
                        'Impossibile caricare il Learning Agreement.'
                    );
                }
            });
    }

    openEditMapping(): void {
        if (this.canEditMapping()) {
            this.editDialogVisible.set(true);
        }
    }
    
    onApplicationUpdated(): void {
        this.editDialogVisible.set(false);
        this.loadApplication();
    }

    onApplicationReviewed(approved: boolean): void {
        this.reviewSuccess.set(
            approved
                ? 'Learning Agreement approvato correttamente.'
                : 'Learning Agreement rifiutato correttamente.'
        );
        this.loadApplication();
    }
}
