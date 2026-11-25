
import {
    Component,
    computed,
    inject,
    OnInit,
    signal
} from '@angular/core';

import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

import { AuthService } from '../../auth/auth.service';

import { ApplicationService } from '../application.service';
import { Application } from '../application.model';

import {
    getApplicationStateInfo,
    normalizeApplicationState
} from '../application-lifecycle';


type ApplicationFilter =
    | 'all'
    | 'pending'
    | 'learning-agreement'
    | 'changes'
    | 'exams';


@Component({
    selector: 'app-referent-application-list',
    imports: [
        FormsModule,
        CardModule,
        TableModule,
        TagModule,
        ButtonModule,
        SelectModule,
        InputTextModule,
        MessageModule,
        ProgressSpinnerModule
    ],
    templateUrl: './referent-application-list.html',
    styleUrl: './referent-application-list.css'
})
export class ReferentApplicationList implements OnInit {

    private readonly authService = inject(AuthService);

    private readonly applicationService =
        inject(ApplicationService);

    private readonly router = inject(Router);


    // DATA

    readonly applications = signal<Application[]>([]);

    readonly loading = signal(true);

    readonly errorMessage = signal('');


    // FILTERS

    readonly searchTerm = signal('');

    readonly selectedFilter =
        signal<ApplicationFilter>('pending');


    readonly filterOptions = [
        {
            label: 'Tutte le Application',
            value: 'all'
        },
        {
            label: 'Da valutare',
            value: 'pending'
        },
        {
            label: 'Learning Agreement',
            value: 'learning-agreement'
        },
        {
            label: 'Modifiche al LA',
            value: 'changes'
        },
        {
            label: 'Esami da approvare',
            value: 'exams'
        }
    ];


    // STATES

    private readonly learningAgreementState =
        'awaiting learning agreement approval by referent';

    private readonly changesStates = [
        'awaiting changes approval',
        'awaiting la changes approval'
    ];

    private readonly examsState =
        'waiting exam score approval by referent';


    // COUNTERS

    readonly totalApplications = computed(() =>
        this.applications().length
    );


    readonly pendingLearningAgreements = computed(() =>
        this.applications().filter(application =>
            this.getState(application) ===
            this.learningAgreementState
        ).length
    );


    readonly pendingChanges = computed(() =>
        this.applications().filter(application =>
            this.changesStates.includes(
                this.getState(application)
            )
        ).length
    );


    readonly pendingExams = computed(() =>
        this.applications().filter(application =>
            this.getState(application) ===
            this.examsState
        ).length
    );


    readonly totalPending = computed(() =>
        this.pendingLearningAgreements() +
        this.pendingChanges() +
        this.pendingExams()
    );


    // FILTERED APPLICATIONS

    readonly filteredApplications = computed(() => {

        const filter = this.selectedFilter();

        const search = this.searchTerm()
            .trim()
            .toLowerCase();

        return this.applications().filter(application => {

            const state = this.getState(application);

            let matchesFilter = true;

            switch (filter) {

                case 'pending':

                    matchesFilter =
                        this.requiresAction(application);

                    break;

                case 'learning-agreement':

                    matchesFilter =
                        state === this.learningAgreementState;

                    break;

                case 'changes':

                    matchesFilter =
                        this.changesStates.includes(state);

                    break;

                case 'exams':

                    matchesFilter =
                        state === this.examsState;

                    break;
            }

            const searchableText = [
                application.application_id,
                application.student?.name,
                application.student?.lastname,
                application.student?.email,
                application.host_institution.name,
                application.host_institution.city,
                application.host_institution.country_name,
                application.academic_year
            ]
                .join(' ')
                .toLowerCase();

            return matchesFilter &&
                searchableText.includes(search);
        });
    });


    // INITIALIZATION

    ngOnInit(): void {
        this.loadApplications();
    }


    loadApplications(): void {

        const user = this.authService.currentUser();

        this.loading.set(true);
        this.errorMessage.set('');

        if (!user || user.role !== 'referents') {

            this.errorMessage.set(
                'Accesso non autorizzato.'
            );

            this.loading.set(false);

            return;
        }

        this.applicationService
            .getReferentApplications(user.user_id)
            .subscribe({

                next: response => {

                    this.applications.set(
                        response.data.applications
                    );

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


    // HELPERS

    getState(application: Application): string {

        return normalizeApplicationState(
            application.current_state.name
        );
    }


    requiresAction(application: Application): boolean {

        const state = this.getState(application);

        return state === this.learningAgreementState ||
            this.changesStates.includes(state) ||
            state === this.examsState;
    }


    getStateSeverity(application: Application) {

        return getApplicationStateInfo(
            application.current_state.name
        ).severity;
    }


    getStateLabel(application: Application): string {

        const state = this.getState(application);

        if (state === this.learningAgreementState) {
            return 'Learning Agreement da valutare';
        }

        if (this.changesStates.includes(state)) {
            return 'Modifiche da valutare';
        }

        if (state === this.examsState) {
            return 'Esami da approvare';
        }

        return application.current_state.name;
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
                return period;
        }
    }

    setFilter(filter: ApplicationFilter): void {

        this.selectedFilter.set(filter);
    }


    manageApplication(application: Application): void {

        this.router.navigate([
            '/dashboard',
            'applications',
            application.application_id,
            'manage'
        ]);
    }
}
