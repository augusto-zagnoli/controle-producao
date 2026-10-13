import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../authentication/auth.service';

// Token expirado ou revogado: encerra a sessão local e volta ao login.
// Não atua na própria chamada de login nem em requisições anônimas (tablet/TV).
export const unauthorizedInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);

  return next(req).pipe(
    catchError((err: unknown) => {
      const ehApi = req.url.startsWith(environment.apiUrl);
      const ehLogin = req.url.endsWith('/api/auth/login');
      if (err instanceof HttpErrorResponse && err.status === 401 && ehApi && !ehLogin && auth.logado) {
        auth.logout();
      }
      return throwError(() => err);
    })
  );
};
