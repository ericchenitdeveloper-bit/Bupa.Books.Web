import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'books',
    loadComponent: () =>
      import('./features/books/books-list.component').then((m) => m.BooksListComponent),
    canActivate: [authGuard],
  },
  { path: '**', redirectTo: 'login' },
];
