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
    const userType = (user.tipo || 'usuario') as 'admin' | 'usuario'; // Force type assertion se necessário, ou simplifique
    // Se o usuário for admin, ele já retornou 'gerenciar' na linha 22.
    // Portanto, aqui userType provavelmente será 'usuario' ou outro tipo se existir.

    const config = DEFAULT_PERMISSIONS[userType] || DEFAULT_PERMISSIONS['usuario'];

    if (config.menu.includes(page)) {
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
// - editar: Ver, Criar e Editar (Update/Insert) - NÃO PERMITE EXCLUIR
// - gerenciar (antigo criar/admin): Acesso Total (Ver, Criar, Editar, Excluir)
export const canPerformAction = (page: string, action: 'criar' | 'editar' | 'excluir', user?: Usuario | null): boolean => {
    // 1. Obter o nível de permissão do usuário para esta página
    const permission = getPagePermission(page, user);

    // 2. Se estiver bloqueado, nega tudo
    if (permission === 'bloqueado') return false;

    // 3. Admin sempre pode tudo (redundância de segurança)
    if (permission === 'gerenciar') return true;

    // 4. Se for 'visualizar', nega todas as ações de escrita
    if (permission === 'visualizar') return false;

    // 5. Nível 'editar': Permite criar e editar, mas nega excluir
    if (permission === 'editar') {
        if (action === 'excluir') return false;
        return true; // Permite 'criar' e 'editar'
    }

    // 6. Fallback (se for criar ou tiver outros nomes legados)
    if (permission === 'criar') return true; // Legacy: criar costumava ser total

    return false;
};

import { SYSTEM_MODULES } from '../constants/modules';

// Helper para verificar se usuário tem acesso a um módulo inteiro
// Retorna true se pelo menos uma ferramenta do módulo não estiver 'bloqueada'
export const hasModuleAccess = (moduleId: string, user?: Usuario | null): boolean => {
    if (!user) return false;

    // Admin tem acesso a tudo
    if (user.tipo === 'admin' || user.permissoesCustom?.admin) return true;

    // Encontrar definição do módulo
    const moduleDef = SYSTEM_MODULES.find(m => m.id === moduleId);

    // Fallback para legacy: Se o módulo não existe na definição nova mas o usuário tem acesso a página legada
    if (!moduleDef) {
        // Mapeamento simples de legado (ex: 'OPERATIONAL' -> tem acesso a 'obras'?)
        // Mas o ideal é usar o ID correto. Se não achar, bloqueia por padrão.
        return false;
    }

    // Verificar se existe alguma ferramenta neste módulo com acesso > bloqueado
    return moduleDef.tools.some(tool => {
        const permission = getPagePermission(tool.id, user);
        return permission !== 'bloqueado';
    });
};
