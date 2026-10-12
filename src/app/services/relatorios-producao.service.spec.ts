import { formatarValor } from '../shared/tabela-analitica/tabela-analitica.component';
import { paramsDe } from './relatorios-producao.service';

describe('Relatórios de produção — utilitários', () => {
  it('omite filtros vazios dos parâmetros da API', () => {
    const params = paramsDe({ dataInicio: '2026-06-01', dataFim: '2026-06-30', maquina: null, funcionarioId: 3, produto: '' });
    expect(params.keys().sort()).toEqual(['dataFim', 'dataInicio', 'funcionarioId']);
    expect(params.get('funcionarioId')).toBe('3');
  });

  it('exibe indicador não calculável em vez de zero', () => {
    expect(formatarValor(null, 'percentual')).toBe('n/c');
    expect(formatarValor(null, 'decimal')).toBe('n/c');
    expect(formatarValor(null, 'texto')).toBe('—');
  });

  it('formata percentuais e decimais em pt-BR', () => {
    expect(formatarValor(9.0909, 'percentual')).toBe('9,09%');
    expect(formatarValor(25, 'decimal')).toBe('25,00');
    expect(formatarValor(1500, 'numero')).toBe('1.500');
  });
});
