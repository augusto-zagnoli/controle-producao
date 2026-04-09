export type OrdemServicoStatus = 'Pendente' | 'EmProducao' | 'Pausada' | 'Finalizada';
export type PerfilUsuario = 'Administrador' | 'TecnicoCnc';

export type Prioridade = 'Baixa' | 'Media' | 'Alta' | 'Urgente';
export type Funcao = 'Programador' | 'Conferente' | 'Operador';
export type Setor = 'Usinagem' | 'Estamparia' | 'Fresagem' | 'Solda';
export type TipoOperacao = 'Preparacao' | 'UsinagemLado1' | 'UsinagemLado2' | 'Fresa' | 'Tratamento';

export const STATUS_LABELS: Record<OrdemServicoStatus, string> = {
  Pendente: 'Pendente',
  EmProducao: 'Em Produção',
  Pausada: 'Pausada',
  Finalizada: 'Finalizada'
};

export const STATUS_LIST: OrdemServicoStatus[] = ['Pendente', 'EmProducao', 'Pausada', 'Finalizada'];

export const PRIORIDADE_LABELS: Record<Prioridade, string> = {
  Baixa: 'Baixa', Media: 'Média', Alta: 'Alta', Urgente: 'Urgente'
};

export const FUNCAO_LABELS: Record<Funcao, string> = {
  Programador: 'Programador', Conferente: 'Conferente', Operador: 'Operador'
};

export const SETOR_LABELS: Record<Setor, string> = {
  Usinagem: 'Usinagem', Estamparia: 'Estamparia', Fresagem: 'Fresagem', Solda: 'Solda'
};

export const OPERACAO_LABELS: Record<TipoOperacao, string> = {
  Preparacao: 'Preparação',
  UsinagemLado1: 'Usinagem Lado 1',
  UsinagemLado2: 'Usinagem Lado 2',
  Fresa: 'Fresa',
  Tratamento: 'Tratamento'
};

export const PRIORIDADE_LIST: Prioridade[] = ['Baixa', 'Media', 'Alta', 'Urgente'];
export const FUNCAO_LIST: Funcao[] = ['Programador', 'Conferente', 'Operador'];
export const SETOR_LIST: Setor[] = ['Usinagem', 'Estamparia', 'Fresagem', 'Solda'];
export const OPERACAO_LIST: TipoOperacao[] = ['Preparacao', 'UsinagemLado1', 'UsinagemLado2', 'Fresa', 'Tratamento'];

export interface UsuarioResumo {
  id: number;
  nome: string;
}

export interface Imagem {
  id: number;
  nomeArquivo: string;
  url: string;
}

export interface Documento {
  id: number;
  nomeArquivo: string;
  url: string;
}

export interface FuncionarioResumo {
  id: number;
  nome: string;
  funcao: Funcao;
  setor: Setor;
}

export interface OperacaoItem {
  id: number;
  tipo: TipoOperacao;
}

export interface OrdemServico {
  id: number;
  codigo: number;
  // Produto
  nomeProduto: string;
  descricao: string | null;
  quantidade: number;
  unidade: string | null;
  // Prioridade
  prioridade: Prioridade;
  // Responsável
  funcionarioId: number;
  funcionario: FuncionarioResumo | null;
  funcao: Funcao;
  setor: Setor;
  // Operações
  operacoes: OperacaoItem[];
  // Datas
  dataInicio: string | null;
  prazoPrevisto: string;
  // Geral
  observacoes: string | null;
  status: OrdemServicoStatus;
  dataCriacao: string;
  dataAtualizacao: string;
  usuarioCriacaoId: number;
  usuarioCriacao: UsuarioResumo;
  imagens: Imagem[];
  documentos: Documento[];
}

export interface OrdemServicoCreate {
  nomeProduto: string;
  descricao: string | null;
  quantidade: number;
  unidade: string | null;
  prioridade: Prioridade;
  funcionarioId: number;
  funcao: Funcao;
  setor: Setor;
  operacoes: TipoOperacao[];
  dataInicio: string | null;
  prazoPrevisto: string;
  observacoes: string | null;
}

export interface OrdemServicoUpdate extends OrdemServicoCreate {}

export interface HistoricoItem {
  id: number;
  ordemServicoId: number;
  acao: string;
  statusAnterior: OrdemServicoStatus | null;
  statusNovo: OrdemServicoStatus | null;
  observacao: string | null;
  usuarioId: number;
  nomeUsuario: string;
  funcionarioId: number | null;
  nomeFuncionario: string | null;
  dataHora: string;
  fotoOperadorUrl: string | null;
  origemAlteracao: 'Admin' | 'Tablet';
}

export interface UsuarioLogado {
  id: number;
  nome: string;
  login: string;
  perfil: PerfilUsuario;
}
