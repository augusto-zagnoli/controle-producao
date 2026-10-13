import { HttpErrorResponse } from '@angular/common/http';

// Extrai a mensagem de erro das respostas da API: ProblemDetails (detail/title),
// formato legado ({ erro }) ou erros de validação do ASP.NET (errors).
export function mensagemDeErro(err: unknown, padrao = 'Não foi possível concluir a operação.'): string {
  if (!(err instanceof HttpErrorResponse)) return padrao;
  if (err.status === 0) return 'Sem conexão com o servidor.';
  if (err.status === 403) return err.error?.detail ?? 'Você não tem permissão para esta operação.';
  if (err.status === 429) return 'Muitas tentativas. Aguarde um minuto e tente novamente.';

  const corpo = err.error;
  if (typeof corpo === 'string' && corpo.trim()) return corpo;
  if (corpo?.errors && typeof corpo.errors === 'object') {
    const primeiro = Object.values(corpo.errors as Record<string, string[]>)[0];
    if (primeiro?.length) return primeiro[0];
  }
  return corpo?.detail ?? corpo?.erro ?? corpo?.title ?? padrao;
}
