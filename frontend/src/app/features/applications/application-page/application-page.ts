import { Component, computed, inject } from '@angular/core';

import { AuthService } from '../../auth/auth.service';

import { ApplicationList } from '../application-list/application-list';

import { ReferentApplicationList } from '../referent-application-list/referent-application-list';

@Component({
    selector: 'app-application-page',
    imports: [
        ApplicationList,
        ReferentApplicationList
    ],
    templateUrl: './application-page.html',
    styleUrl: './application-page.css'
})
export class ApplicationPage {

    private readonly authService = inject(AuthService);

    readonly role = computed(
        () => this.authService.currentUser()?.role
    );
}