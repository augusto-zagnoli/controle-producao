export type PastilhaStatus = 'Disponivel' | 'Atencao' | 'Esgotada' | 'Inativa';

export const PASTILHA_STATUS_LABELS: Record<PastilhaStatus, string> = {
  Disponivel: 'Disponível',
  Atencao: 'Atenção',
  Esgotada: 'Esgotada',
  Inativa: 'Inativa'
};

export interface Pastilha {
  id: number;
  codigo: string;
  descricao: string | null;
  marca: string | null;
  modelo: string | null;
  tipo: string | null;
  vidaUtilQuantidade: number;
  quantidadeArestas: number;
  usoAtualQuantidade: number;
  restante: number;
  percentualDesgaste: number;
  status: PastilhaStatus;
  ativa: boolean;
  criadoEm: string;
  atualizadoEm: string;
}

export interface PastilhaCreate {
  codigo: string;
  descricao: string | null;
  marca: string | null;
  modelo: string | null;
  tipo: string | null;
  vidaUtilQuantidade: number;
  quantidadeArestas: number;
  ativa: boolean;
}

export interface PastilhaUpdate extends PastilhaCreate {}

export interface RegistrarUsoPastilha {
  pastilhaId: number;
  ordemServicoId: number;
  operacaoId?: number | null;
  funcionarioId?: number | null;
  quantidadeProduzida: number;
  observacao?: string | null;
}

export interface UsoPastilha {
  id: number;
  pastilhaId: number;
  pastilhaCodigo: string;
  ordemServicoId: number;
  ordemServicoCodigo: number;
  operacaoId: number | null;
  operacaoTipo: string | null;
  funcionarioId: number | null;
  funcionarioNome: string | null;
  quantidadeProduzida: number;
  dataHora: string;
  observacao: string | null;
  pastilha: Pastilha;
}

export interface PastilhaDashboard {
  totalPastilhas: number;
  disponiveis: number;
  emAtencao: number;
  esgotadas: number;
  inativas: number;
  pastilhasAtencao: Pastilha[];
}
