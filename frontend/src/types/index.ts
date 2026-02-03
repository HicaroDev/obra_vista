// ==================== TIPOS DO SISTEMA ====================

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  tipo: 'admin' | 'usuario';
  telefone?: string;
  cargo?: string;
  avatarUrl?: string;
  ultimoAcesso?: string;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
  roles?: Role[];
  permissoesCustom?: Record<string, AccessLevel>;
}

export type AccessLevel = 'bloqueado' | 'visualizar' | 'editar' | 'gerenciar' | 'criar';

export type PagePermission = 'dashboard' | 'obras' | 'equipes' | 'usuarios' | 'prestadores' | 'produtos' | 'financeiro' | 'relatorios' | 'configuracoes';

export interface Role {
  id: number;
  nome: string;
  descricao?: string;
  nivel: number; // 1=Admin, 2=Gerente, 3=Supervisor, 4=Usuário
  createdAt: string;
  permissoes?: Permissao[];
}

export interface Permissao {
  id: number;
  modulo: 'obras' | 'prestadores' | 'equipes' | 'kanban' | 'relatorios' | 'usuarios';
  acao: 'criar' | 'ler' | 'editar' | 'excluir' | 'gerenciar';
  descricao?: string;
  createdAt: string;
}

export interface UsuarioRole {
  id: number;
  usuarioId: number;
  roleId: number;
  createdAt: string;
  role?: Role;
}

export interface Prestador {
  id: number;
  nome: string;
  especialidade: string;
  telefone?: string;
  email?: string;
  cpf?: string;
  pixTipo?: 'cpf' | 'telefone' | 'email' | 'chave_aleatoria' | 'cnpj';
  pixChave?: string;
  ativo: boolean;

  // Contratação e Pagamento
  tipoContrato?: 'diaria' | 'empreita' | 'clt';
  valorDiaria?: number;
  valorValeRefeicao?: number;
  valorValeTransporte?: number;
  salario?: number;
  bonificacao?: number;

  createdAt: string;
  updatedAt: string;
}

export interface Equipe {
  id: number;
  nome: string;
  descricao?: string;
  cor?: string;
  ativa: boolean;
  createdAt: string;
  updatedAt: string;
  membros?: EquipeMembro[];
}

export interface EquipeMembro {
  id: number;
  equipeId: number;
  usuarioId?: number;
  prestadorId?: number;
  papel: 'lider' | 'membro';
  createdAt: string;
  usuario?: Usuario;
  prestador?: Prestador;
}

export interface Obra {
  id: number;
  nome: string;
  endereco: string;
  descricao?: string;
  status: 'orcamento' | 'aprovado' | 'planejamento' | 'em_andamento' | 'pausado' | 'concluido' | 'cancelado';
  responsavel?: string;
  latitude?: string;
  longitude?: string;
  dataInicio?: string;
  dataFim?: string;
  createdAt: string;
  updatedAt: string;
  atribuicoes?: Atribuicao[];
}

export interface Atribuicao {
  id: number;
  obraId: number;
  equipeId?: number;
  prestadorId?: number;
  tipoAtribuicao: 'equipe' | 'prestador';
  titulo: string;
  descricao?: string;
  status: 'a_fazer' | 'em_progresso' | 'concluido';
  prioridade: 'baixa' | 'media' | 'alta' | 'urgente';
  ordem: number;
  dataInicio?: string;
  dataFim?: string;
  diasSemana?: string[]; // ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom']
  createdAt: string;
  updatedAt: string;
  obra?: Obra;
  equipe?: Equipe;
  prestador?: Prestador;
  checklists?: TarefaChecklist[];
  anexos?: TarefaAnexo[];
  etiquetas?: Etiqueta[];
  compras?: TarefaCompra[];
  ocorrencias?: TarefaOcorrencia[];
}

export interface TarefaChecklist {
  id: number;
  atribuicaoId: number;
  titulo: string;
  concluido: boolean;
  ordem: number;
  createdAt: string;
  updatedAt: string;
}

export interface TarefaAnexo {
  id: number;
  atribuicaoId: number;
  nomeArquivo: string;
  tipo: 'documento' | 'foto' | 'video';
  url: string;
  tamanho?: number;
  createdAt: string;
}

export interface Etiqueta {
  id: number;
  nome: string;
  cor: string;
  createdAt: string;
}

export interface TarefaCompra {
  id: number;
  atribuicaoId: number;
  material: string;
  quantidade: number;
  unidade?: string;
  status: 'pendente' | 'aprovado' | 'comprado';
  observacoes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TarefaOcorrencia {
  id: number;
  atribuicaoId: number;
  titulo: string;
  descricao?: string;
  gravidade: 'baixa' | 'media' | 'alta' | 'critica';
  status: 'aberto' | 'em_analise' | 'resolvido';
  usuarioId?: number;
  createdAt: string;
  updatedAt: string;
  usuario?: Usuario;
  anexos?: OcorrenciaAnexo[];
}

export interface OcorrenciaAnexo {
  id: number;
  ocorrenciaId: number;
  nomeArquivo: string;
  url: string;
  createdAt: string;
}

export interface Log {
  id: number;
  usuarioId: number;
  atribuicaoId?: number;
  acao: string;
  entidade: string;
  detalhes?: string;
  createdAt: string;
  usuario?: Usuario;
  atribuicao?: Atribuicao;
}

// ==================== TIPOS DE AUTENTICAÇÃO ====================

export interface LoginCredentials {
  email: string;
  senha: string;
}

export interface RegisterData {
  nome: string;
  email: string;
  senha: string;
  tipo?: 'admin' | 'usuario';
}

export interface AuthResponse {
  success: boolean;
  data: {
    user: Usuario;
    token: string;
  };
  message?: string;
}

// ==================== TIPOS DE API ====================

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface ApiError {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

// ==================== TIPOS DE KANBAN ====================

export interface KanbanColumn {
  id: string;
  title: string;
  status: Atribuicao['status'];
  cards: Atribuicao[];
}

export interface DragResult {
  source: {
    droppableId: string;
    index: number;
  };
  destination?: {
    droppableId: string;
    index: number;
  };
  draggableId: string;
}

// ==================== TIPOS DE TEMA ====================

export type Theme = 'light' | 'dark' | 'system';

// ==================== TIPOS DE FILTROS ====================

export interface FiltrosObra {
  status?: Obra['status'];
  dataInicio?: string;
  dataFim?: string;
  busca?: string;
}

export interface FiltrosAtribuicao {
  obraId?: number;
  equipeId?: number;
  status?: Atribuicao['status'];
  prioridade?: Atribuicao['prioridade'];
  busca?: string;
}

export interface FrequenciaDiaria {
  prestadorId: number;
  nome: string;
  especialidade: string;
  frequenciaId?: number;
  presente: boolean;
  observacao?: string;
  obraId?: number;
  nomeObra?: string;
}
