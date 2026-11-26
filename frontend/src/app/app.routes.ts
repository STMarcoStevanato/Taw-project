import { Routes } from '@angular/router';

import { Home } from './features/home/home';
import { Login } from './features/auth/login/login';
import { Register } from './features/auth/register/register';
import { Dashboard } from './features/dashboard/dashboard';

import { authGuard } from './core/guards/auth-guard';

import { ApplicationPage } from './features/applications/application-page/application-page';
import { ApplicationManage } from './features/applications/application-manage/application-manage';

import { NotificationList } from './features/notifications/notification-list/notification-list';

export const routes: Routes = [
    {
        path: '',
        component: Home
    },
    {
        path: 'login',
        component: Login
    },
    {
        path: 'register',
        component: Register
    },
    {
        path: 'dashboard',
        component: Dashboard,
        canActivate: [authGuard],
        children: [
            {
                path: '',
                redirectTo: 'applications',
                pathMatch: 'full'
            },
            {
                path: 'applications',
                component: ApplicationPage
            },
            {
                path: 'applications/:applicationId/manage',
                component: ApplicationManage
            },
            {
                path: 'notifications',
                component: NotificationList
            }
        ]
    }
];