import type {
  ApiResponse,
  LoginCredentials,
  RegisterData,
  AuthResponse,
  Usuario,
  Equipe,
  Obra,
  Atribuicao,
  Log,
  Prestador,
  Role,
  TarefaChecklist,
  TarefaAnexo,
  TarefaCompra
} from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// ==================== HELPERS ====================

const getAuthToken = (): string | null => {
  return localStorage.getItem('token');
};

const getAuthHeaders = (): HeadersInit => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || error.message || 'Erro na requisição');
  }

  return response.json();
}

// ==================== AUTENTICAÇÃO ====================

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await fetchApi<AuthResponse['data']>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    // Salvar token no localStorage
    if (response.success && response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }

    return response as AuthResponse;
  },

  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await fetchApi<AuthResponse['data']>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    // Salvar token no localStorage
    if (response.success && response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }

    return response as AuthResponse;
  },

  me: async (): Promise<ApiResponse<Usuario>> => {
    return fetchApi<Usuario>('/auth/me');
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
};

// ==================== EQUIPES ====================

export const equipesApi = {
  getAll: async (): Promise<ApiResponse<Equipe[]>> => {
    return fetchApi<Equipe[]>('/equipes');
  },

  getById: async (id: number): Promise<ApiResponse<Equipe>> => {
    return fetchApi<Equipe>(`/equipes/${id}`);
  },

  create: async (data: Partial<Equipe>): Promise<ApiResponse<Equipe>> => {
    return fetchApi<Equipe>('/equipes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: number, data: Partial<Equipe>): Promise<ApiResponse<Equipe>> => {
    return fetchApi<Equipe>(`/equipes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: number): Promise<ApiResponse<void>> => {
    return fetchApi<void>(`/equipes/${id}`, {
      method: 'DELETE',
    });
  },

  addMembro: async (equipeId: number, data: { usuarioId?: number; prestadorId?: number; papel: string }): Promise<ApiResponse<void>> => {
    return fetchApi<void>(`/equipes/${equipeId}/membros`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  removeMembro: async (equipeId: number, membroId: number): Promise<ApiResponse<void>> => {
    return fetchApi<void>(`/equipes/${equipeId}/membros/${membroId}`, {
      method: 'DELETE',
    });
  },

  updateMembroPapel: async (equipeId: number, membroId: number, papel: string): Promise<ApiResponse<void>> => {
    return fetchApi<void>(`/equipes/${equipeId}/membros/${membroId}`, {
      method: 'PATCH',
      body: JSON.stringify({ papel }),
    });
  },
};

// ==================== OBRAS ====================

export const obrasApi = {
  getAll: async (): Promise<ApiResponse<Obra[]>> => {
    return fetchApi<Obra[]>('/obras');
  },

  getById: async (id: number): Promise<ApiResponse<Obra>> => {
    return fetchApi<Obra>(`/obras/${id}`);
  },

  create: async (data: Partial<Obra>): Promise<ApiResponse<Obra>> => {
    return fetchApi<Obra>('/obras', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: number, data: Partial<Obra>): Promise<ApiResponse<Obra>> => {
    return fetchApi<Obra>(`/obras/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: number): Promise<ApiResponse<void>> => {
    return fetchApi<void>(`/obras/${id}`, {
      method: 'DELETE',
    });
  },

  getKanban: async (id: number): Promise<ApiResponse<Atribuicao[]>> => {
    return fetchApi<Atribuicao[]>(`/obras/${id}/kanban`);
  },
};

// ==================== ATRIBUIÇÕES ====================

export const atribuicoesApi = {
  getAll: async (): Promise<ApiResponse<Atribuicao[]>> => {
    return fetchApi<Atribuicao[]>('/atribuicoes');
  },

  getByObra: async (obraId: number): Promise<ApiResponse<Atribuicao[]>> => {
    return fetchApi<Atribuicao[]>(`/atribuicoes/obra/${obraId}`);
  },

  create: async (data: Partial<Atribuicao>): Promise<ApiResponse<Atribuicao>> => {
    return fetchApi<Atribuicao>('/atribuicoes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: number, data: Partial<Atribuicao>): Promise<ApiResponse<Atribuicao>> => {
    return fetchApi<Atribuicao>(`/atribuicoes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  updateStatus: async (id: number, status: Atribuicao['status'], ordem?: number): Promise<ApiResponse<Atribuicao>> => {
    return fetchApi<Atribuicao>(`/atribuicoes/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, ordem }),
    });
  },

  updateOrdem: async (id: number, ordem: number): Promise<ApiResponse<Atribuicao>> => {
    return fetchApi<Atribuicao>(`/atribuicoes/${id}/ordem`, {
      method: 'PATCH',
      body: JSON.stringify({ ordem }),
    });
  },

  delete: async (id: number): Promise<ApiResponse<void>> => {
    return fetchApi<void>(`/atribuicoes/${id}`, {
      method: 'DELETE',
    });
  },
};

// ==================== PRESTADORES ====================

export const prestadoresApi = {
  getAll: async (): Promise<ApiResponse<Prestador[]>> => {
    return fetchApi<Prestador[]>('/prestadores');
  },

  getById: async (id: number): Promise<ApiResponse<Prestador>> => {
    return fetchApi<Prestador>(`/prestadores/${id}`);
  },

  create: async (data: Partial<Prestador>): Promise<ApiResponse<Prestador>> => {
    return fetchApi<Prestador>('/prestadores', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: number, data: Partial<Prestador>): Promise<ApiResponse<Prestador>> => {
    return fetchApi<Prestador>(`/prestadores/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: number): Promise<ApiResponse<void>> => {
    return fetchApi<void>(`/prestadores/${id}`, {
      method: 'DELETE',
    });
  },
};

// ==================== ESPECIALIDADES ====================

export const especialidadesApi = {
  getAll: async (): Promise<ApiResponse<Array<{ id: number; nome: string }>>> => {
    return fetchApi<Array<{ id: number; nome: string }>>('/especialidades');
  },

  create: async (nome: string): Promise<ApiResponse<{ id: number; nome: string }>> => {
    return fetchApi<{ id: number; nome: string }>('/especialidades', {
      method: 'POST',
      body: JSON.stringify({ nome }),
    });
  },

  update: async (id: number, nome: string): Promise<ApiResponse<void>> => {
    return fetchApi<void>(`/especialidades/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ nome }),
    });
  },

  delete: async (id: number): Promise<ApiResponse<void>> => {
    return fetchApi<void>(`/especialidades/${id}`, {
      method: 'DELETE',
    });
  },
};

// ==================== USUÁRIOS ====================

export const usuariosApi = {
  getAll: async (): Promise<ApiResponse<Usuario[]>> => {
    return fetchApi<Usuario[]>('/usuarios');
  },

  getById: async (id: number): Promise<ApiResponse<Usuario>> => {
    return fetchApi<Usuario>(`/usuarios/${id}`);
  },

  create: async (data: Partial<Usuario> & { senha: string; roleIds?: number[] }): Promise<ApiResponse<Usuario>> => {
    return fetchApi<Usuario>('/usuarios', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: number, data: Partial<Usuario> & { senha?: string; roleIds?: number[] }): Promise<ApiResponse<Usuario>> => {
    return fetchApi<Usuario>(`/usuarios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: number): Promise<ApiResponse<void>> => {
    return fetchApi<void>(`/usuarios/${id}`, {
      method: 'DELETE',
    });
  },
};

// ==================== ROLES ====================

export const rolesApi = {
  getAll: async (): Promise<ApiResponse<Role[]>> => {
    return fetchApi<Role[]>('/roles');
  },

  getById: async (id: number): Promise<ApiResponse<Role>> => {
    return fetchApi<Role>(`/roles/${id}`);
  },
};

// ==================== DASHBOARD ====================

export const dashboardApi = {
  getStats: async (): Promise<ApiResponse<{
    obrasAtivas: number;
    equipes: number;
    tarefasPendentes: number;
    progressoGeral: number;
  }>> => {
    return fetchApi('/dashboard/stats');
  },

  getAtividades: async (): Promise<ApiResponse<Array<{
    id: number;
    titulo: string;
    status: string;
    updatedAt: string;
    obraNome: string;
  }>>> => {
    return fetchApi('/dashboard/atividades');
  },
};

// ==================== LOGS ====================

export const logsApi = {
  getAll: async (): Promise<ApiResponse<Log[]>> => {
    return fetchApi<Log[]>('/logs');
  },

  getByUsuario: async (usuarioId: number): Promise<ApiResponse<Log[]>> => {
    return fetchApi<Log[]>(`/logs/usuario/${usuarioId}`);
  },

  getByAtribuicao: async (atribuicaoId: number): Promise<ApiResponse<Log[]>> => {
    return fetchApi<Log[]>(`/logs/atribuicao/${atribuicaoId}`);
  },
};
// ==================== ORÇAMENTO ====================

export const orcamentoApi = {
  get: async (obraId: number | string): Promise<ApiResponse<any>> => {
    return fetchApi(`/orcamentos/${obraId}`);
  },

  importar: async (obraId: number | string, file: File): Promise<ApiResponse<any>> => {
    const formData = new FormData();
    formData.append('file', file);

    const token = getAuthToken();
    // Não usamos getAuthHeaders() padrão pois não queremos 'Content-Type': 'application/json'
    // O browser setará o boundary do multipart automaticamente
    const headers: HeadersInit = {
      ...(token && { Authorization: `Bearer ${token}` }),
    };

    const response = await fetch(`${API_URL}/orcamentos/${obraId}/importar`, {
      method: 'POST',
      body: formData,
      headers: headers
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Erro na requisição' }));
      throw new Error(error.error || error.message || 'Erro na requisição');
    }

    return response.json();
  },

  getTemplates: async (): Promise<ApiResponse<any[]>> => {
    return fetchApi('/orcamentos/templates');
  },

  saveAsTemplate: async (data: { orcamentoId: number; nome?: string }): Promise<ApiResponse<any>> => {
    return fetchApi('/orcamentos/templates/save-as', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  createFromTemplate: async (data: { obraId: number; templateId: number }): Promise<ApiResponse<any>> => {
    return fetchApi('/orcamentos/templates/create-from-template', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// ==================== CRM ====================

export const crmApi = {
  leads: {
    getAll: async (): Promise<ApiResponse<any[]>> => fetchApi('/crm/leads'),
    getById: async (id: number): Promise<ApiResponse<any>> => fetchApi(`/crm/leads/${id}`),
    create: async (data: any): Promise<ApiResponse<any>> => fetchApi('/crm/leads', { method: 'POST', body: JSON.stringify(data) }),
    update: async (id: number, data: any): Promise<ApiResponse<any>> => fetchApi(`/crm/leads/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: async (id: number): Promise<ApiResponse<void>> => fetchApi(`/crm/leads/${id}`, { method: 'DELETE' }),
  },
  deals: {
    getAll: async (): Promise<ApiResponse<any[]>> => fetchApi('/crm/deals'),
    getById: async (id: number): Promise<ApiResponse<any>> => fetchApi(`/crm/deals/${id}`),
    create: async (data: any): Promise<ApiResponse<any>> => fetchApi('/crm/deals', { method: 'POST', body: JSON.stringify(data) }),
    update: async (id: number, data: any): Promise<ApiResponse<any>> => fetchApi(`/crm/deals/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: async (id: number): Promise<ApiResponse<void>> => fetchApi(`/crm/deals/${id}`, { method: 'DELETE' }),
    updateStage: async (id: number, estagio: string): Promise<ApiResponse<any>> => fetchApi(`/crm/deals/${id}/estagio`, { method: 'PATCH', body: JSON.stringify({ estagio }) }),
    win: async (id: number, data?: { dataInicio?: string }): Promise<ApiResponse<any>> => fetchApi(`/crm/deals/${id}/win`, { method: 'PATCH', body: JSON.stringify(data || {}) }),
    lose: async (id: number, data: { motivo: string }): Promise<ApiResponse<any>> => fetchApi(`/crm/deals/${id}/lose`, { method: 'PATCH', body: JSON.stringify(data) }),
  },
  propostas: {
    create: async (data: any): Promise<ApiResponse<any>> => fetchApi('/crm/propostas', { method: 'POST', body: JSON.stringify(data) }),
    getByDeal: async (dealId: number): Promise<ApiResponse<any[]>> => fetchApi(`/crm/deals/${dealId}/propostas`),
    getPdfUrl: (id: number) => `${API_URL}/crm/propostas/${id}/pdf`,
  },
  stats: {
    get: async (): Promise<ApiResponse<any>> => fetchApi('/crm/stats'),
  },
  interacoes: {
    create: async (data: { dealId: number; tipo: string; descricao: string; data?: string }): Promise<ApiResponse<any>> => fetchApi('/crm/interacoes', { method: 'POST', body: JSON.stringify(data) }),
    getByDeal: async (dealId: number): Promise<ApiResponse<any[]>> => fetchApi(`/crm/deals/${dealId}/interacoes`),
  },
  vistoria: {
    getPerguntas: async (): Promise<ApiResponse<any[]>> => fetchApi('/crm/perguntas'),
    getByDeal: async (dealId: number): Promise<ApiResponse<any>> => fetchApi(`/crm/deals/${dealId}/vistoria`),
    save: async (data: { dealId: number; respostas: any }): Promise<ApiResponse<any>> => fetchApi('/crm/vistoria', { method: 'POST', body: JSON.stringify(data) }),
  }
};

// ==================== CHECKLISTS ====================

export const checklistsApi = {
  getByTarefa: async (atribuicaoId: number): Promise<ApiResponse<TarefaChecklist[]>> => {
    return fetchApi<TarefaChecklist[]>(`/checklists/tarefa/${atribuicaoId}`);
  },

  create: async (atribuicaoId: number, data: { titulo: string; concluido?: boolean; ordem?: number }): Promise<ApiResponse<TarefaChecklist>> => {
    return fetchApi<TarefaChecklist>(`/checklists/tarefa/${atribuicaoId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: number, data: Partial<TarefaChecklist>): Promise<ApiResponse<TarefaChecklist>> => {
    return fetchApi<TarefaChecklist>(`/checklists/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: number): Promise<ApiResponse<void>> => {
    return fetchApi<void>(`/checklists/${id}`, {
      method: 'DELETE',
    });
  },
};

// ==================== ANEXOS ====================

export const anexosApi = {
  getByTarefa: async (atribuicaoId: number): Promise<ApiResponse<TarefaAnexo[]>> => {
    return fetchApi<TarefaAnexo[]>(`/atribuicoes/${atribuicaoId}/anexos`);
  },

  upload: async (atribuicaoId: number, file: File): Promise<ApiResponse<TarefaAnexo>> => {
    const formData = new FormData();
    formData.append('file', file);

    const token = getAuthToken();
    const response = await fetch(`${API_URL}/atribuicoes/${atribuicaoId}/anexos`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro no upload');
    }

    return response.json();
  },

  delete: async (id: number): Promise<ApiResponse<void>> => {
    return fetchApi<void>(`/anexos/${id}`, {
      method: 'DELETE',
    });
  },
};

// ==================== ETIQUETAS ====================

export const etiquetasApi = {
  getAll: async (): Promise<ApiResponse<{ id: number; nome: string; cor: string }[]>> => {
    return fetchApi('/etiquetas');
  },

  create: async (data: { nome: string; cor?: string }): Promise<ApiResponse<{ id: number; nome: string; cor: string }>> => {
    return fetchApi('/etiquetas', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: number): Promise<ApiResponse<void>> => {
    return fetchApi<void>(`/etiquetas/${id}`, {
      method: 'DELETE',
    });
  },

  getByTarefa: async (atribuicaoId: number): Promise<ApiResponse<{ id: number; nome: string; cor: string }[]>> => {
    return fetchApi(`/etiquetas/tarefa/${atribuicaoId}`);
  },

  addToTarefa: async (atribuicaoId: number, etiquetaId: number): Promise<ApiResponse<void>> => {
    return fetchApi<void>(`/etiquetas/tarefa/${atribuicaoId}`, {
      method: 'POST',
      body: JSON.stringify({ etiquetaId }),
    });
  },

  removeFromTarefa: async (atribuicaoId: number, etiquetaId: number): Promise<ApiResponse<void>> => {
    return fetchApi<void>(`/etiquetas/tarefa/${atribuicaoId}/${etiquetaId}`, {
      method: 'DELETE',
    });
  },
};

// ==================== COMPRAS ====================

export const comprasApi = {
  getByTarefa: async (atribuicaoId: number): Promise<ApiResponse<{
    id: number;
    material: string;
    quantidade: string;
    unidade: string;
    status: string;
    observacoes?: string;
  }[]>> => {
    return fetchApi(`/compras/tarefa/${atribuicaoId}`);
  },

  create: async (atribuicaoId: number, data: { material: string; quantidade: number; unidade: string; observacoes?: string }): Promise<ApiResponse<TarefaCompra>> => {
    return fetchApi(`/compras/tarefa/${atribuicaoId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: number, data: { material: string; quantidade: number; unidade: string; observacoes?: string; status?: string }): Promise<ApiResponse<TarefaCompra>> => {
    return fetchApi(`/compras/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: number): Promise<ApiResponse<void>> => {
    return fetchApi<void>(`/compras/${id}`, {
      method: 'DELETE',
    });
  },

  updateStatus: async (id: number, status: string): Promise<ApiResponse<TarefaCompra>> => {
    return fetchApi(`/compras/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },
};

// ==================== PRODUTOS ====================

export const produtosApi = {
  getAll: async (): Promise<ApiResponse<{ id: number; nome: string; unidade: string }[]>> => {
    return fetchApi('/produtos');
  },

  search: async (query: string): Promise<ApiResponse<{ id: number; nome: string; unidade: string }[]>> => {
    return fetchApi(`/produtos/search?q=${encodeURIComponent(query)}`);
  },

  create: async (data: { nome: string; unidade?: string }): Promise<ApiResponse<{ id: number; nome: string; unidade: string }>> => {
    return fetchApi('/produtos', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: number, data: { nome: string; unidade?: string }): Promise<ApiResponse<{ id: number; nome: string; unidade: string }>> => {
    return fetchApi(`/produtos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: number): Promise<ApiResponse<void>> => {
    return fetchApi<void>(`/produtos/${id}`, {
      method: 'DELETE',
    });
  },
};

// ==================== UNIDADES ====================

export const unidadesApi = {
  getAll: async (): Promise<ApiResponse<{ id: number; nome: string; sigla: string }[]>> => {
    return fetchApi('/unidades');
  },

  create: async (data: { nome: string; sigla: string }): Promise<ApiResponse<{ id: number; nome: string; sigla: string }>> => {
    return fetchApi('/unidades', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: number, data: { nome: string; sigla: string }): Promise<ApiResponse<{ id: number; nome: string; sigla: string }>> => {
    return fetchApi(`/unidades/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: number): Promise<ApiResponse<void>> => {
    return fetchApi<void>(`/unidades/${id}`, {
      method: 'DELETE',
    });
  },
};

// ==================== FREQUÊNCIA (PONTO VIRTUAL) ====================

export const frequenciaApi = {
  getByData: async (data: string): Promise<ApiResponse<import('../types').FrequenciaDiaria[]>> => {
    return fetchApi<import('../types').FrequenciaDiaria[]>(`/frequencia?data=${data}`);
  },

  getRelatorio: async (inicio: string, fim: string): Promise<ApiResponse<any[]>> => {
    return fetchApi<any[]>(`/frequencia/relatorio?inicio=${inicio}&fim=${fim}`);
  },

  addDesconto: async (data: { prestadorId: number; data: string; valor: number; descricao: string }): Promise<ApiResponse<any>> => {
    return fetchApi('/frequencia/desconto', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getDescontos: async (prestadorId: number, inicio?: string, fim?: string): Promise<ApiResponse<any>> => {
    return fetchApi(`/frequencia/descontos?prestadorId=${prestadorId}${inicio && fim ? `&inicio=${inicio}&fim=${fim}` : ''}`);
  },

  salvar: async (data: {
    data: string;
    prestadorId: number;
    obraId?: number | null;
    presente: boolean;
    observacao?: string;
  }): Promise<ApiResponse<any>> => {
    return fetchApi('/frequencia', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// ==================== FERRAMENTAS ====================

export interface Ferramenta {
  id: number;
  nome: string;
  marca?: string;
  codigo?: string;
  status: 'disponivel' | 'em_uso' | 'manutencao' | 'extraviada';
  localizacao_atual?: {
    obra?: { id: number; nome: string };
    responsavel?: { id: number; nome: string };
    dataSaida?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface MovimentacaoFerramenta {
  id: number;
  ferramentaId: number;
  obraId?: number;
  responsavelId?: number;
  dataSaida: string;
  dataDevolucao?: string;
  status: string;
  observacao?: string;
  obraNome?: string;
  responsavelNome?: string;
}

export const ferramentasApi = {
  getAll: async (): Promise<ApiResponse<Ferramenta[]>> => {
    return fetchApi<Ferramenta[]>('/ferramentas');
  },

  getById: async (id: number): Promise<ApiResponse<Ferramenta>> => {
    return fetchApi<Ferramenta>(`/ferramentas/${id}`);
  },

  create: async (data: Partial<Ferramenta>): Promise<ApiResponse<Ferramenta>> => {
    return fetchApi<Ferramenta>('/ferramentas', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: number, data: Partial<Ferramenta>): Promise<ApiResponse<Ferramenta>> => {
    return fetchApi<Ferramenta>(`/ferramentas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: number): Promise<ApiResponse<void>> => {
    return fetchApi<void>(`/ferramentas/${id}`, {
      method: 'DELETE',
    });
  },

  registrarMovimentacao: async (data: {
    ferramentaId: number;
    acao: 'saida' | 'devolucao';
    obraId?: number;
    responsavelId?: number;
    observacao?: string;
  }): Promise<ApiResponse<void>> => {
    return fetchApi<void>('/ferramentas/movimentacao', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getHistorico: async (id: number): Promise<ApiResponse<MovimentacaoFerramenta[]>> => {
    return fetchApi<MovimentacaoFerramenta[]>(`/ferramentas/${id}/historico`);
  },

  getStats: async (): Promise<ApiResponse<any>> => {
    return fetchApi<any>('/ferramentas/dashboard/stats');
  }
};

// ==================== BACKUP ====================

export const backupApi = {
  create: async (): Promise<ApiResponse<{ message: string; logs: string }>> => {
    return fetchApi('/backup', {
      method: 'POST',
    });
  },

  list: async (): Promise<ApiResponse<{ name: string; size: number; createdAt: string }[]>> => {
    return fetchApi('/backup');
  },

  restore: async (filename: string): Promise<ApiResponse<{ message: string; logs: string }>> => {
    return fetchApi(`/backup/${filename}/restore`, {
      method: 'POST',
    });
  },

  getDownloadUrl: (filename: string) => {
    return `http://localhost:3001/api/backup/${filename}`;
  }
};

// ==================== ENGENHARIA (BANCO DE DADOS) ====================

export const insumosApi = {
  getAll: async (params?: { tipo?: string; busca?: string; origem?: string }): Promise<ApiResponse<any[]>> => {
    const query = new URLSearchParams(params as any).toString();
    return fetchApi(`/insumos?${query}`);
  },

  getById: async (id: number): Promise<ApiResponse<any>> => {
    return fetchApi(`/insumos/${id}`);
  },

  create: async (data: any): Promise<ApiResponse<any>> => {
    return fetchApi('/insumos', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: number, data: any): Promise<ApiResponse<any>> => {
    return fetchApi(`/insumos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: number): Promise<ApiResponse<void>> => {
    return fetchApi<void>(`/insumos/${id}`, {
      method: 'DELETE',
    });
  },
};

export const composicoesApi = {
  getAll: async (params?: { busca?: string; unidade?: string }): Promise<ApiResponse<any[]>> => {
    const query = new URLSearchParams(params as any).toString();
    return fetchApi(`/composicoes?${query}`);
  },

  getById: async (id: number): Promise<ApiResponse<any>> => {
    return fetchApi(`/composicoes/${id}`);
  },

  create: async (data: any): Promise<ApiResponse<any>> => {
    return fetchApi('/composicoes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: number, data: any): Promise<ApiResponse<any>> => {
    return fetchApi(`/composicoes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: number): Promise<ApiResponse<void>> => {
    return fetchApi<void>(`/composicoes/${id}`, {
      method: 'DELETE',
    });
  },
};
