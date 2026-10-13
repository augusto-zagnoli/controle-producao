import { HttpContextToken, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AuthService } from '../authentication/auth.service';
import { DispositivoService } from '../authentication/dispositivo.service';

// Marca qual credencial foi anexada, para o tratamento de 401.
export const CREDENCIAL_USADA = new HttpContextToken<'usuario' | 'dispositivo' | null>(() => null);

// Anexa o token apenas a requisições para a API do ERP. Prioridade: sessão de usuário;
// sem ela, sessão do dispositivo (tablet/painel). Chamadas que já trazem Authorization
// (token de seleção de tenant) não são alteradas.
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(environment.apiUrl) || req.headers.has('Authorization')) return next(req);

  const auth = inject(AuthService);
  const dispositivo = inject(DispositivoService);

  if (auth.logado && auth.token) {
    return next(req.clone({
      setHeaders: { Authorization: `Bearer ${auth.token}` },
      context: req.context.set(CREDENCIAL_USADA, 'usuario')
    }));
  }

  const tokenDispositivo = dispositivo.token;
  if (tokenDispositivo) {
    return next(req.clone({
      setHeaders: { Authorization: `Bearer ${tokenDispositivo}` },
      context: req.context.set(CREDENCIAL_USADA, 'dispositivo')
    }));
  }

  return next(req);
};
