
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';

import { AuthService } from '../../features/auth/auth.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.getMe().pipe(
    map((response) => {
      const user = response.user;

      if (
        user.role === 'students' ||
        user.role === 'staff' ||
        user.role === 'referents'
      ) {
        authService.setCurrentUser(user);
        return true;
      }

      return router.createUrlTree(['/']);
    }),
    catchError(() => {
      return of(router.createUrlTree(['/login']));
    })
  );
};
