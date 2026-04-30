import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Store } from '@ngxs/store';
import { AuthState } from '../state/auth/auth.state';

export const authGuard: CanActivateFn = () => {
  const store = inject(Store);
  const router = inject(Router);
  const isAuthenticated = store.selectSnapshot(AuthState.isAuthenticated);

  if (isAuthenticated) {
    return true;
  }
  return router.createUrlTree(['/login']);
};
