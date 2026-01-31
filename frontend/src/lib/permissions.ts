import type { Usuario, AccessLevel } from '../types';

// Configuração padrão legacy (fallback)
const DEFAULT_PERMISSIONS = {
    admin: {
        menu: ['dashboard', 'obras', 'prestadores', 'equipes', 'kanban', 'relatorios', 'usuarios', 'produtos', 'financeiro', 'configuracoes'],
        defaultLevel: 'gerenciar' as AccessLevel // Admin tem acesso total
    },
    usuario: {
        menu: ['dashboard', 'obras', 'prestadores', 'equipes', 'kanban', 'relatorios', 'produtos'],
        defaultLevel: 'visualizar' as AccessLevel
    },
};

// Helper para obter o nível de acesso de uma página
export const getPagePermission = (page: string, user?: Usuario | null): AccessLevel => {
    if (!user) return 'bloqueado';

    // 0. ADMIN MASTER KEY: Admin tem permissão total irrestrita
    // Isso impede que o admin se bloqueie acidentalmente via permissões customizadas
    if (user.tipo === 'admin') {
        return 'gerenciar';
    }

    // 1. Verificar permissões personalizadas (sobrescrevem tudo p/ não-admins)
    if (user.permissoesCustom && user.permissoesCustom[page]) {
        return user.permissoesCustom[page];
    }

    // 2. Verificar permissões por Role (se houver, pega a maior permissão - lógica simplificada por enquanto)
    // Se o usuário tiver roles, poderiamos somar, mas por enquanto vamos manter simples.
    // Futuro: Implementar hierarquia de roles

    // 3. Fallback para tipo de usuário (admin/usuario)
    const userType = user.tipo || 'usuario';
    const config = DEFAULT_PERMISSIONS[userType] || DEFAULT_PERMISSIONS['usuario'];

    if (config.menu.includes(page)) {
        // Admin sempre pode tudo por padrao se nao tiver sido bloqueado explicitamente
        if (userType === 'admin') return 'gerenciar';
        return config.defaultLevel;
    }

    return 'bloqueado';
};

// Helper para verificar se pode acessar uma página (aparecer no menu)
export const canAccessPage = (page: string, user?: Usuario | null): boolean => {
    const permission = getPagePermission(page, user);
    return permission !== 'bloqueado';
};

// Helper para verificar ações específicas
// Hierarchy:
// - bloqueado: Nenhum acesso
// - visualizar: Apenas ver (Read Only)
// - editar: Ver, Criar e Editar (No Delete)
// - gerenciar (antigo criar): Acesso Total (Ver, Criar, Editar, Excluir)
export const canPerformAction = (page: string, _action: 'criar' | 'editar' | 'excluir', user?: Usuario | null): boolean => {
    // 1. Obter o nível de permissão do usuário para esta página
    const permission = getPagePermission(page, user);

    // 2. Se estiver bloqueado, nega tudo
    if (permission === 'bloqueado') return false;

    // 3. Se for apenas visualizar, nega todas as ações de escrita
    if (permission === 'visualizar') return false;

    // 4. Se tiver permissão 'editar' (Acesso Total), 'gerenciar' ou 'criar', permite tudo
    if (permission === 'editar' || permission === 'gerenciar' || permission === 'criar') return true;

    return false;
};
