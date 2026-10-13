import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from '../authentication/auth.service';
import { DispositivoService } from '../authentication/dispositivo.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.logado) return true;
  return router.createUrlTree(['/login']);
};

// Telas de chão de fábrica (tablet) e painel de TV: aceitam sessão de usuário do tenant
// ou um dispositivo ativado. Sem nenhum dos dois, leva para a ativação do dispositivo.
// "somenteTablet" impede que um painel (somente leitura) abra telas de apontamento.
export function chaoDeFabricaGuard(somenteTablet: boolean): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const dispositivo = inject(DispositivoService);
    const router = inject(Router);

    if (auth.logado) return true;
    if (typeof localStorage === 'undefined') return true; // prerender/SSR: decide no navegador
    if (!dispositivo.possuiChave) return router.createUrlTree(['/dispositivo/ativar']);

    return dispositivo.garantirSessao().pipe(
      map(sessao => {
        if (!sessao) return router.createUrlTree(['/dispositivo/ativar']);
        if (somenteTablet && sessao.papel !== 'DispositivoTablet') return router.createUrlTree(['/dashboard']);
        return true;
      })
    );
  };
}
