import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../authentication/auth.service';

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.logado && auth.isAdmin) return true;
  if (auth.logado) return router.createUrlTree(['/producao']);
  return router.createUrlTree(['/login']);
};
