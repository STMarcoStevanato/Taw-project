
import {
    Component,
    computed,
    inject,
    input,
    output,
    signal
} from '@angular/core';

import { FormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { TextareaModule } from 'primeng/textarea';
import { MessageModule } from 'primeng/message';

import { ApplicationService } from '../application.service';

import {
    Application,
    ReferentApprovalRequest
} from '../application.model';

import {
    normalizeApplicationState
} from '../application-lifecycle';


@Component({
    selector: 'app-application-review',
    imports: [
        FormsModule,
        ButtonModule,
        DialogModule,
        TextareaModule,
        MessageModule
    ],
    templateUrl: './application-review.html',
    styleUrl: './application-review.css'
})
export class ApplicationReview {

    private readonly applicationService =
        inject(ApplicationService);

    readonly application = input.required<Application>();

    readonly version =
        input.required<Application['versions'][number]>();

    readonly reviewed = output<boolean>();

    readonly visible = signal(false);
    readonly approved = signal(true);
    readonly reason = signal('');
    readonly submitting = signal(false);
    readonly errorMessage = signal('');

    readonly isChangesReview = computed(() => {

        const state = normalizeApplicationState(
            this.application().current_state.name
        );

        return [
            'awaiting changes approval',
            'awaiting la changes approval'
        ].includes(state);
    });


    readonly reviewTitle = computed(() =>

        this.isChangesReview()

            ? 'Valutazione modifiche al Learning Agreement'

            : 'Valutazione Learning Agreement'
    );


    readonly dialogTitle = computed(() =>

        this.approved()

            ? 'Conferma approvazione'

            : 'Conferma rifiuto'
    );


    readonly canSubmit = computed(() =>

        !this.submitting() &&
        (
            this.approved() ||
            this.reason().trim().length > 0
        )
    );

    openReview(approved: boolean): void {

        this.approved.set(approved);

        this.reason.set('');

        this.errorMessage.set('');

        this.visible.set(true);
    }


    closeDialog(): void {

        if (this.submitting()) {
            return;
        }

        this.visible.set(false);
    }


    submitReview(): void {

        if (!this.canSubmit()) {
            return;
        }

        const application = this.application();

        const version = this.version();

        const approved = this.approved();

        const data: ReferentApprovalRequest = {
            approved
        };

        if (!approved) {
            data.reason = this.reason().trim();
        }

        this.submitting.set(true);

        this.errorMessage.set('');

        this.applicationService
            .referentApproval(
                application.application_id,
                version.version_id,
                data
            )
            .subscribe({

                next: () => {

                    this.submitting.set(false);

                    this.visible.set(false);

                    this.reviewed.emit(approved);
                },

                error: error => {

                    this.errorMessage.set(
                        error.error?.message ??
                        'Impossibile completare la valutazione.'
                    );

                    this.submitting.set(false);
                }
            });
    }
}
