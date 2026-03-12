export type StatusOP = 'pendente' | 'em_producao' | 'concluida' | 'cancelada';
export type TipoOperacao =
  | '1ª OPERAÇÃO'
  | '2ª OPERAÇÃO'
  | '3ª OPERAÇÃO'
  | '4ª OPERAÇÃO'
  | '5ª OPERAÇÃO'
  | 'COMPLETO';
export type StatusOperacao = 'pendente' | 'em_andamento' | 'concluida';

export interface MedicaoPonto {
  label: string;
  predefinido: string;
  encontrado: string;
}

export interface Operacao {
  id: string;
  numero: number;
  tipoOperacao: TipoOperacao;
  dataHoraInicial?: string;
  dataHoraFinal?: string;
  quantidade?: number;
  maquina?: string;
  programador?: string;
  conferente?: string;
  operador?: string;
  medicoes: MedicaoPonto[];
  pecasRefugadas: number;
  status: StatusOperacao;
  fotoResponsavel?: string;
  observacoes?: string;
}

export interface Apontamento {
  id: string;
  ordemId: string;
  numeroOP: number;
  nomePeca: string;
  operador: string;
  programador?: string;
  maquina?: string;
  quantidade: number;
  tipoOperacao: string;
  data: string;
  horario: string;
  quantidadeRefugada: number;
  horarioConclusao?: string;
  foto: string;
  createdAt: string;
}

export interface OrdemProducao {
  id: string;
  numeroOP: number;
  nomePeca: string;
  material: string;
  quantidade: number;
  prazoEntrega: string;
  cliente?: string;
  observacoes?: string;
  pdfAutocad?: string;
  pdfNome?: string;
  imagens: string[];
  operacoes: Operacao[];
  status: StatusOP;
  criadoEm: string;
  atualizadoEm: string;
}

export const STATUS_OP_LABELS: Record<StatusOP, string> = {
  pendente: 'Pendente',
  em_producao: 'Em produção',
  concluida: 'Concluída',
  cancelada: 'Cancelada'
};

export const STATUS_OPERACAO_LABELS: Record<StatusOperacao, string> = {
  pendente: 'Pendente',
  em_andamento: 'Em andamento',
  concluida: 'Concluída'
};

