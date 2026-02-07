import {
    PiSquaresFour,
    PiHardHat,
    PiUsers,
    PiUserGear,
    PiPackage,
    PiCurrencyDollar,
    PiChartLine,
    PiGear,
    PiWrench,
    PiRuler,
    PiIdentificationCard,
    PiTag
} from 'react-icons/pi';

export interface ModuleDefinition {
    id: string;
    label: string;
    icon: any;
    description: string;
    tools: ToolDefinition[];
}

export interface ToolDefinition {
    id: string;
    label: string;
    description?: string;
    icon?: any;
}

export const SYSTEM_MODULES: ModuleDefinition[] = [
    {
        id: 'operacional',
        label: 'Operacional',
        icon: PiHardHat,
        description: 'Gestão de obras, equipes, ferramentas e diário de obra.',
        tools: [
            { id: 'obras', label: 'Obras', description: 'Cadastro e gestão de obras' },
            { id: 'equipes', label: 'Equipes', description: 'Gestão de equipes e alocações', icon: PiUsers },
            { id: 'kanban', label: 'Kanban', description: 'Gestão visual de tarefas' },
            { id: 'ferramentas', label: 'Ferramentas', description: 'Gestão de patrimônio', icon: PiWrench },
            { id: 'catalogos', label: 'Catálogos', description: 'Gestão de Insumos e Composições', icon: PiPackage }
        ]
    },
    {
        id: 'financeiro',
        label: 'Financeiro & Compras',
        icon: PiCurrencyDollar,
        description: 'Fluxo de caixa, contas a pagar/receber e pedidos.',
        tools: [
            { id: 'financeiro', label: 'Lançamentos', description: 'Contas a pagar e receber' },
            { id: 'produtos', label: 'Produtos', description: 'Catálogo de materiais', icon: PiPackage },
            { id: 'unidades', label: 'Unidades', description: 'Cadastros auxiliares', icon: PiRuler }
        ]
    },
    {
        id: 'crm',
        label: 'CRM & Vendas',
        icon: PiChartLine, // Usando ChartLine temporariamente ou importar Handshake se disponível
        description: 'Pipeline de vendas, orçamentos e gestão de clientes.',
        tools: [
            // Ferramentas futuras ou placeholder
            { id: 'crm', label: 'Pipeline', description: 'Funil de vendas' }
        ]
    },
    {
        id: 'gestao',
        label: 'Gestão & Config',
        icon: PiGear,
        description: 'Cadastro de usuários, permissões e configurações globais.',
        tools: [
            { id: 'dashboard', label: 'Dashboard', description: 'Visualização de indicadores', icon: PiSquaresFour },
            { id: 'relatorios', label: 'Relatórios', description: 'Geração de relatórios gerenciais', icon: PiChartLine },
            { id: 'usuarios', label: 'Usuários', description: 'Gestão de acesso e logins', icon: PiIdentificationCard },
            { id: 'prestadores', label: 'Prestadores', description: 'Cadastro de profissionais', icon: PiUserGear },
            { id: 'configuracoes', label: 'Configurações', description: 'Backups e parâmetros' },
            { id: 'tipos_prestadores', label: 'Tipos de Prestadores', description: 'Cadastro de especialidades', icon: PiTag }
        ]
    }
];

// Helper para pegar todas as chaves de permissão possíveis (flattened)
export const ALL_PERMISSION_KEYS = SYSTEM_MODULES.flatMap(m => m.tools.map(t => t.id));
