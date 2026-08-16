import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
	{
		path: '',
		loadComponent: () => import('./pages/landing/landing.component').then((m) => m.LandingComponent)
	},
	{
		path: 'dashboard',
		canActivate: [authGuard],
		loadComponent: () => import('./pages/dashboard/dashboard.component').then((m) => m.DashboardComponent)
	},
	{
		path: '**',
		redirectTo: ''
	}
];
