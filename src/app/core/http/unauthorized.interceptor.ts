import { HttpContextToken, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../authentication/auth.service';
import { DispositivoService } from '../authentication/dispositivo.service';
import { CREDENCIAL_USADA } from './auth.interceptor';

const JA_RENOVADO = new HttpContextToken<boolean>(() => false);

// 401 da API:
//  - sessão de usuário: token expirado ou acesso revogado → encerra a sessão e volta ao login;
//  - dispositivo: renova o token uma vez com a chave guardada; se a chave foi revogada,
//    leva para a tela de ativação do dispositivo.
export const unauthorizedInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const dispositivo = inject(DispositivoService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((err: unknown) => {
      const ehApi = req.url.startsWith(environment.apiUrl);
      const ehAutenticacao = req.url.includes('/api/auth/');
      if (!(err instanceof HttpErrorResponse) || err.status !== 401 || !ehApi || ehAutenticacao) {
        return throwError(() => err);
      }

      const credencial = req.context.get(CREDENCIAL_USADA);
      if (credencial === 'usuario' && auth.logado) {
        auth.logout();
        return throwError(() => err);
      }

      if (credencial === 'dispositivo' && !req.context.get(JA_RENOVADO)) {
        return dispositivo.garantirSessao(true).pipe(
          switchMap(sessao => {
            if (!sessao) {
              void router.navigate(['/dispositivo/ativar']);
              return throwError(() => err);
            }
            return next(req.clone({
              setHeaders: { Authorization: `Bearer ${sessao.token}` },
              context: req.context.set(JA_RENOVADO, true)
            }));
          })
        );
      }

      return throwError(() => err);
    })
  );
};
