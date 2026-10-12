export interface RelatorioProducaoFiltro {
  dataInicio: string;          // yyyy-MM-dd (data local)
  dataFim: string;             // yyyy-MM-dd (inclusivo)
  maquina?: string | null;
  funcionarioId?: number | null;
  ordemCodigo?: number | null;
  produto?: string | null;
  pastilhaId?: number | null;  // só afeta indicadores de pastilha
}

export interface RelatorioDetalheFiltro extends RelatorioProducaoFiltro {
  pagina: number;
  tamanhoPagina: number;
  ordenarPor?: string | null;
  direcao?: 'asc' | 'desc' | '';
}

export interface OpcaoIdNome {
  id: number;
  nome: string;
}

export interface OpcoesFiltroRelatorio {
  maquinas: string[];
  operadores: OpcaoIdNome[];
  produtos: string[];
  pastilhas: OpcaoIdNome[];
}

export interface FiltrosAplicados {
  dataInicio: string;
  dataFim: string;
  inicioUtc: string;
  fimUtc: string;
  fusoHorario: string;
  maquina: string | null;
  funcionarioId: number | null;
  funcionarioNome: string | null;
  ordemCodigo: number | null;
  produto: string | null;
  pastilhaId: number | null;
  pastilhaCodigo: string | null;
}

export interface ResumoProducao {
  pecasBoas: number;
  pecasRefugadas: number;
  pecasProduzidas: number;
  taxaRefugo: number | null;
  ajusteBoas: number;
  ajusteRefugadas: number;
  saldoLiquidoBoas: number;
  saldoLiquidoRefugadas: number;
  apontamentos: number;
  ordensComApontamento: number;
}

export interface ResumoPastilhas {
  pastilhasUtilizadas: number;
  pecasComPastilha: number;
  rendimentoMedio: number | null;
  pastilhasAtingiramVidaUtil: number;
  coberturaApontamento: number | null;
  usosSemMaquinaIdentificada: number;
}

export interface SerieDiaria {
  data: string;
  pecasBoas: number;
  pecasRefugadas: number;
  pecasComPastilha: number;
  pastilhasUtilizadas: number;
}

export interface ProducaoPorMaquina {
  maquina: string;
  pecasBoas: number;
  pecasRefugadas: number;
  pecasProduzidas: number;
  taxaRefugo: number | null;
  pecasComPastilha: number;
  pastilhasUtilizadas: number;
  rendimentoMedioPastilha: number | null;
}

export interface ProducaoPorOperador {
  funcionarioId: number | null;
  operador: string;
  pecasBoas: number;
  pecasRefugadas: number;
  pecasProduzidas: number;
  taxaRefugo: number | null;
  apontamentos: number;
  maquinas: string[];
}

export interface ProducaoPorProduto {
  produto: string;
  pecasBoas: number;
  pecasRefugadas: number;
  pecasProduzidas: number;
  taxaRefugo: number | null;
}

export interface ProducaoPorOrdem {
  ordemServicoId: number;
  codigo: number;
  produto: string;
  pecasBoas: number;
  pecasRefugadas: number;
  pecasProduzidas: number;
  taxaRefugo: number | null;
}

export interface RendimentoPastilha {
  pastilhaId: number;
  codigo: string;
  descricao: string | null;
  tipo: string | null;
  modelo: string | null;
  vidaUtilQuantidade: number;
  quantidadeArestas: number;
  pecasNoPeriodo: number;
  usoAcumuladoTotal: number;
  percentualVidaUtil: number | null;
  atingiuVidaUtilEm: string | null;
  maquinas: string[];
}

export interface IndicadorIndisponivel {
  indicador: string;
  motivo: string;
}

export interface RelatorioProducao {
  filtros: FiltrosAplicados;
  resumo: ResumoProducao;
  pastilhas: ResumoPastilhas;
  serieDiaria: SerieDiaria[];
  porMaquina: ProducaoPorMaquina[];
  porOperador: ProducaoPorOperador[];
  porProduto: ProducaoPorProduto[];
  porOrdem: ProducaoPorOrdem[];
  porPastilha: RendimentoPastilha[];
  indisponiveis: IndicadorIndisponivel[];
}

export interface Pagina<T> {
  itens: T[];
  total: number;
  pagina: number;
  tamanhoPagina: number;
}

export interface ApontamentoDetalhe {
  historicoId: number;
  dataHora: string;
  ordemServicoId: number;
  ordemCodigo: number;
  produto: string;
  maquina: string;
  funcionarioId: number | null;
  operador: string;
  recebidaAcumulada: number;
  perdidaAcumulada: number;
  deltaBoas: number;
  deltaRefugadas: number;
  tipo: string;
}

export interface UsoPastilhaDetalhe {
  usoId: number;
  dataHora: string;
  pastilhaId: number;
  pastilhaCodigo: string;
  ordemServicoId: number;
  ordemCodigo: number;
  produto: string;
  maquina: string;
  maquinaOrigemHistoricoId: number | null;
  funcionarioId: number | null;
  operador: string;
  quantidade: number;
  usoAcumuladoAposRegistro: number;
}
