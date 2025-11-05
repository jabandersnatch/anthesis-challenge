import { Routes } from '@angular/router';

/**
 * Application routes with lazy loading
 * Each route loads its component on demand for better performance
 */
export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./components/dashboard/dashboard.component').then((m) => m.DashboardComponent),
    title: 'Dashboard - Emissions Data',
  },
  {
    path: 'list',
    loadComponent: () =>
      import('./components/emissions-list/emissions-list.component').then(
        (m) => m.EmissionsListComponent
      ),
    title: 'Emissions List',
  },
  {
    path: 'create',
    loadComponent: () =>
      import('./components/emission-form/emission-form.component').then(
        (m) => m.EmissionFormComponent
      ),
    title: 'Create Emission',
  },
  {
    path: 'edit/:id',
    loadComponent: () =>
      import('./components/emission-form/emission-form.component').then(
        (m) => m.EmissionFormComponent
      ),
    title: 'Edit Emission',
  },
  {
    path: 'globe',
    loadComponent: () =>
      import('./components/globe-dashboard/globe-dashboard.component').then(
        (m) => m.GlobeDashboardComponent
      ),
    title: 'Globe Visualization',
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
