export type OrdemServicoStatus = 'Pendente' | 'EmProducao' | 'Pausada' | 'Finalizada';
export type PerfilUsuario = 'Administrador' | 'TecnicoCnc';

export const STATUS_LABELS: Record<OrdemServicoStatus, string> = {
  Pendente: 'Pendente',
  EmProducao: 'Em Produção',
  Pausada: 'Pausada',
  Finalizada: 'Finalizada'
};

export const STATUS_LIST: OrdemServicoStatus[] = ['Pendente', 'EmProducao', 'Pausada', 'Finalizada'];

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

export interface OrdemServico {
  id: number;
  codigo: number;
  descricaoPeca: string;
  material: string;
  medidas: string | null;
  quantidade: number;
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
  descricaoPeca: string;
  material: string;
  medidas: string | null;
  quantidade: number;
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
