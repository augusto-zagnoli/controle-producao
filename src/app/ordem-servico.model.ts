export type StatusOrdem = 'pendente' | 'em_producao' | 'concluida' | 'cancelada';
export type PrioridadeOrdem = 'baixa' | 'media' | 'alta' | 'urgente';

export interface HistoricoAlteracao {
  id: string;
  data: string;
  statusAnterior: StatusOrdem;
  statusNovo: StatusOrdem;
  observacao: string;
  fotoResponsavel: string;
}

export interface OrdemServico {
  id: string;
  numero: string;
  descricao: string;
  cliente: string;
  prioridade: PrioridadeOrdem;
  status: StatusOrdem;
  material: string;
  medidas: string;
  observacoes: string;
  imagens: string[];
  pdfAutocad: string;
  pdfNomeArquivo: string;
  historico: HistoricoAlteracao[];
  dataCriacao: string;
  dataAtualizacao: string;
}

export type OrdemServicoPayload = Omit<
  OrdemServico,
  'id' | 'numero' | 'historico' | 'dataCriacao' | 'dataAtualizacao'
>;

export const STATUS_LABELS: Record<StatusOrdem, string> = {
  pendente: 'Pendente',
  em_producao: 'Em produção',
  concluida: 'Concluída',
  cancelada: 'Cancelada'
};
