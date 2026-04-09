import { Funcao, Setor } from './ordem-servico.model';

export interface Funcionario {
  id: number;
  nome: string;
  funcao: Funcao;
  setor: Setor;
  ativo: boolean;
  criadoEm: string;
}

export interface FuncionarioCreate {
  nome: string;
  funcao: Funcao;
  setor: Setor;
}

export type PerfilUsuario = 'Administrador' | 'TecnicoCnc';

export interface Usuario {
  id: number;
  nome: string;
  login: string;
  perfil: PerfilUsuario;
  criadoEm: string;
}

export interface UsuarioCreate {
  nome: string;
  login: string;
  senha: string;
  perfil: PerfilUsuario;
}

export interface UsuarioUpdate {
  nome: string;
  login: string;
  senha?: string;
  perfil: PerfilUsuario;
}
