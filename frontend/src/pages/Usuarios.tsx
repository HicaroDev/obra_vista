import { useState, useEffect } from 'react';
import type { Usuario, Role } from '../types';
import { usuariosApi, rolesApi } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { canPerformAction } from '../lib/permissions';
import {
    PiUsers as Users,
    PiPlus as Plus,
    PiMagnifyingGlass as Search,
    PiPencilSimple as Edit2,
    PiTrash as Trash2,
    PiShield as Shield,
    PiEnvelope as Mail,
    PiPhone as Phone,
    PiBriefcase as Briefcase,
    PiCalendarBlank as Calendar,
    PiX as X,
    PiWarningCircle as AlertCircle
} from 'react-icons/pi';
import { SYSTEM_MODULES } from '../constants/modules';

export function Usuarios() {
    const { user } = useAuthStore();
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingUsuario, setEditingUsuario] = useState<Usuario | null>(null);
    const [formData, setFormData] = useState({
        nome: '',
        email: '',
        senha: '',
        telefone: '',
        cargo: '',
        roleIds: [] as number[],
        permissoesCustom: {} as Record<string, any>,
        ativo: true
    });

    useEffect(() => {
        loadUsuarios();
        loadRoles();
    }, []);

    const loadUsuarios = async () => {
        try {
            setLoading(true);
            const response = await usuariosApi.getAll();
            setUsuarios(response.data || []);
        } catch (error) {
            console.error('Erro ao carregar usuários:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadRoles = async () => {
        try {
            const response = await rolesApi.getAll();
            setRoles(response.data || []);
        } catch (error) {
            console.error('Erro ao carregar roles:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            if (editingUsuario) {
                await usuariosApi.update(editingUsuario.id, formData);
            } else {
                await usuariosApi.create(formData);
            }

            await loadUsuarios();
            handleCloseModal();
        } catch (error) {
            console.error('Erro ao salvar usuário:', error);
            alert('Erro ao salvar usuário. Verifique os dados e tente novamente.');
        }
    };

    const handleEdit = (usuario: Usuario) => {
        setEditingUsuario(usuario);
        setFormData({
            nome: usuario.nome,
            email: usuario.email,
            senha: '',
            telefone: usuario.telefone || '',
            cargo: usuario.cargo || '',
            roleIds: usuario.roles?.map(r => r.id) || [],
            permissoesCustom: usuario.permissoesCustom || {},
            ativo: usuario.ativo
        });
        setShowModal(true);
    };

    const handleDelete = async (id: number) => {
        if (confirm('Tem certeza que deseja excluir este usuário?')) {
            try {
                await usuariosApi.delete(id);
                await loadUsuarios();
            } catch (error) {
                console.error('Erro ao excluir usuário:', error);
                alert('Erro ao excluir usuário.');
            }
        }
    };

    const [activeTab, setActiveTab] = useState<'dados' | 'permissoes'>('dados');
    const [activeModuleTab, setActiveModuleTab] = useState<string>(SYSTEM_MODULES[0].id);

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingUsuario(null);
        setActiveTab('dados'); // Reset tab
        setFormData({
            nome: '',
            email: '',
            senha: '',
            telefone: '',
            cargo: '',
            roleIds: [],
            permissoesCustom: {},
            ativo: true
        });
    };

    const toggleRole = (roleId: number) => {
        setFormData(prev => ({
            ...prev,
            roleIds: prev.roleIds.includes(roleId)
                ? prev.roleIds.filter(id => id !== roleId)
                : [...prev.roleIds, roleId]
        }));
    };

    const getRoleBadgeColor = (nivel: number) => {
        const colors = {
            1: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
            2: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
            3: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
            4: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
        };
        return colors[nivel as keyof typeof colors] || colors[4];
    };

    const filteredUsuarios = usuarios.filter(usuario =>
        usuario.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        usuario.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        usuario.cargo?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-muted-foreground">Carregando usuários...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            {/* Header */}
            <div className="mb-6 sm:mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-3">
                            <Users className="text-primary" size={32} />
                            Usuários
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Gerencie usuários e permissões do sistema
                        </p>
                    </div>
                    {canPerformAction('usuarios', 'criar', user) && (
                        <button
                            onClick={() => setShowModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                        >
                            <Plus size={20} />
                            <span>Novo Usuário</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Search */}
            <div className="mb-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por nome, email ou cargo..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground"
                    />
                </div>
            </div>

            {/* Lista de Usuários */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredUsuarios.map((usuario) => (
                    <div
                        key={usuario.id}
                        className="bg-card border-2 border-border rounded-xl p-6 hover:shadow-lg transition-shadow"
                    >
                        {/* Header do Card */}
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
                                    {usuario.nome.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="font-semibold text-foreground">{usuario.nome}</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${usuario.permissoesCustom?.admin
                                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 border border-purple-200'
                                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400 border border-gray-200'
                                            }`}>
                                            {usuario.permissoesCustom?.admin ? 'Administrador' : 'Usuário Padrão'}
                                        </span>
                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${usuario.ativo
                                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                            }`}>
                                            {usuario.ativo ? 'Ativo' : 'Inativo'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Informações */}
                        <div className="space-y-2 mb-4">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Mail size={16} />
                                <span className="truncate">{usuario.email}</span>
                            </div>

                            {usuario.telefone && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Phone size={16} />
                                    <span>{usuario.telefone}</span>
                                </div>
                            )}

                            {usuario.cargo && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Briefcase size={16} />
                                    <span>{usuario.cargo}</span>
                                </div>
                            )}

                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Calendar size={16} />
                                <span className="truncate">Desde {new Date(usuario.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>

                        {/* Roles */}
                        {usuario.roles && usuario.roles.length > 0 && (
                            <div className="mb-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Shield size={16} className="text-muted-foreground" />
                                    <span className="text-sm font-medium text-muted-foreground">Permissões:</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {usuario.roles.map((role) => (
                                        <span
                                            key={role.id}
                                            className={`px-2 py-1 rounded text-xs font-medium ${getRoleBadgeColor(role.nivel)}`}
                                        >
                                            {role.nome}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Ações */}
                        <div className="flex gap-2 pt-4 border-t border-border">
                            {canPerformAction('usuarios', 'editar', user) && (
                                <button
                                    onClick={() => handleEdit(usuario)}
                                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-accent hover:bg-accent/80 text-foreground rounded-lg transition-colors"
                                >
                                    <Edit2 size={16} />
                                    <span>Editar</span>
                                </button>
                            )}
                            {canPerformAction('usuarios', 'excluir', user) && (
                                <button
                                    onClick={() => handleDelete(usuario.id)}
                                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-destructive/10 hover:bg-destructive/20 text-destructive rounded-lg transition-colors"
                                >
                                    <Trash2 size={16} />
                                    <span>Excluir</span>
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {filteredUsuarios.length === 0 && (
                <div className="text-center py-12">
                    <AlertCircle className="mx-auto text-muted-foreground mb-4" size={48} />
                    <p className="text-muted-foreground">Nenhum usuário encontrado</p>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50">
                    <div className="bg-background border border-border rounded-2xl w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                        {/* Header Modal */}
                        <div className="bg-background border-b border-border px-6 py-4 flex items-center justify-between shrink-0">
                            <div>
                                <h2 className="text-xl font-bold text-foreground">
                                    {editingUsuario ? 'Editar Usuário' : 'Cadastrar Novo Usuário'}
                                </h2>
                                <p className="text-sm text-muted-foreground">Preencha os dados e defina os acessos</p>
                            </div>
                            <button
                                onClick={handleCloseModal}
                                className="p-2 hover:bg-accent rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Tabs Principais */}
                        <div className="px-6 border-b border-border bg-muted/10 shrink-0">
                            <div className="flex gap-6">
                                <button
                                    onClick={() => setActiveTab('dados')}
                                    className={`py-3 px-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'dados'
                                        ? 'border-primary text-primary'
                                        : 'border-transparent text-muted-foreground hover:text-foreground'
                                        }`}
                                >
                                    <Users size={18} />
                                    Dados Pessoais
                                </button>
                                <button
                                    onClick={() => setActiveTab('permissoes')}
                                    className={`py-3 px-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'permissoes'
                                        ? 'border-primary text-primary'
                                        : 'border-transparent text-muted-foreground hover:text-foreground'
                                        }`}
                                >
                                    <Shield size={18} />
                                    Permissões de Acesso
                                </button>
                            </div>
                        </div>

                        {/* Corpo do Modal (Scrollável) */}
                        <div className="flex-1 overflow-hidden">
                            <form onSubmit={handleSubmit} className="h-full flex flex-col">
                                <div className="flex-1 overflow-y-auto p-6">

                                    {/* ABA: DADOS PESSOAIS */}
                                    {activeTab === 'dados' && (
                                        <div className="max-w-3xl mx-auto space-y-6 animate-in slide-in-from-left-4 duration-300">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    <label className="text-sm text-foreground">Nome Completo *</label>
                                                    <input
                                                        type="text"
                                                        value={formData.nome}
                                                        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                                                        className="w-full px-4 py-2.5 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground"
                                                        placeholder="Ex: João Silva"
                                                        required
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-sm text-foreground">Email de Acesso *</label>
                                                    <input
                                                        type="email"
                                                        value={formData.email}
                                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                        className="w-full px-4 py-2.5 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground"
                                                        placeholder="joao@exemplo.com"
                                                        required
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-sm text-foreground">
                                                        Senha {editingUsuario ? '(opcional)' : '*'}
                                                    </label>
                                                    <input
                                                        type="password"
                                                        value={formData.senha}
                                                        onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                                                        className="w-full px-4 py-2.5 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground"
                                                        placeholder={editingUsuario ? 'Manter senha atual' : 'Defina uma senha segura'}
                                                        required={!editingUsuario}
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-sm text-foreground">Telefone / WhatsApp</label>
                                                    <input
                                                        type="tel"
                                                        value={formData.telefone}
                                                        onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                                                        className="w-full px-4 py-2.5 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground"
                                                        placeholder="(11) 99999-9999"
                                                    />
                                                </div>

                                                <div className="space-y-2 md:col-span-2">
                                                    <label className="text-sm text-foreground">Cargo / Função</label>
                                                    <input
                                                        type="text"
                                                        value={formData.cargo}
                                                        onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                                                        className="w-full px-4 py-2.5 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground"
                                                        placeholder="Ex: Mestre de Obras"
                                                    />
                                                </div>
                                            </div>

                                            <div className="pt-6 border-t border-border">
                                                <div className="bg-muted/30 p-4 rounded-xl border border-border flex items-center gap-4">
                                                    <div className="bg-background border border-border p-2 rounded-lg">
                                                        <Users size={24} className="text-primary" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <h4 className="text-foreground">Status do Usuário</h4>
                                                        <p className="text-xs text-muted-foreground">Define se o usuário pode realizar login no sistema</p>
                                                    </div>
                                                    <label className="relative inline-flex items-center cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            className="sr-only peer"
                                                            checked={formData.ativo}
                                                            onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                                                        />
                                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/30 dark:peer-focus:ring-primary/80 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* ABA: PERMISSÕES */}
                                    {activeTab === 'permissoes' && (
                                        <div className="h-full flex flex-col md:flex-row gap-6 animate-in slide-in-from-right-4 duration-300">

                                            {/* Painel Esquerdo: Tipo de Conta e Navegação de Módulos */}
                                            <div className="w-full md:w-64 shrink-0 space-y-6">
                                                {/* Tipo de Conta */}
                                                <div className="bg-muted/30 p-4 rounded-xl border border-border">
                                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 block">
                                                        Tipo de Acesso
                                                    </label>
                                                    <div className="space-y-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const allKeys = SYSTEM_MODULES.flatMap(m => m.tools.map(t => t.id));
                                                                const allPermissions = allKeys.reduce((acc, key) => ({ ...acc, [key]: 'gerenciar' }), {});
                                                                setFormData(prev => ({ ...prev, permissoesCustom: { ...allPermissions, admin: true } }));
                                                            }}
                                                            className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${formData.permissoesCustom?.admin
                                                                ? 'bg-primary/10 border-primary text-primary'
                                                                : 'bg-background border-border hover:border-border/80 text-foreground'
                                                                }`}
                                                        >
                                                            <Shield size={20} />
                                                            <div>
                                                                <div className="font-semibold text-sm">Administrador</div>
                                                                <div className="text-[10px] opacity-80">Acesso Total</div>
                                                            </div>
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setFormData(prev => {
                                                                    const newPerms = { ...prev.permissoesCustom };
                                                                    delete newPerms.admin;
                                                                    return { ...prev, permissoesCustom: newPerms };
                                                                });
                                                            }}
                                                            className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${!formData.permissoesCustom?.admin
                                                                ? 'bg-primary/10 border-primary text-primary'
                                                                : 'bg-background border-border hover:border-border/80 text-foreground'
                                                                }`}
                                                        >
                                                            <Users size={20} />
                                                            <div>
                                                                <div className="font-semibold text-sm">Usuário Padrão</div>
                                                                <div className="text-[10px] opacity-80">Personalizado</div>
                                                            </div>
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Navegação por Módulos (Só se for Padrão) */}
                                                {!formData.permissoesCustom?.admin && (
                                                    <div className="space-y-1">
                                                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block px-1">
                                                            Módulos do Sistema
                                                        </label>
                                                        {SYSTEM_MODULES.map((modulo) => (
                                                            <button
                                                                key={modulo.id}
                                                                type="button"
                                                                onClick={() => setActiveModuleTab(modulo.id)}
                                                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeModuleTab === modulo.id
                                                                    ? 'bg-primary text-primary-foreground'
                                                                    : 'text-muted-foreground hover:bg-accent/50'
                                                                    }`}
                                                            >
                                                                <modulo.icon size={18} />
                                                                {modulo.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Painel Direito: Conteúdo do Módulo */}
                                            <div className="flex-1 bg-card border border-border rounded-xl p-6 overflow-hidden flex flex-col">
                                                {formData.permissoesCustom?.admin ? (
                                                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 opacity-60">
                                                        <div className="bg-primary/10 p-4 rounded-full mb-4">
                                                            <Shield size={48} className="text-primary" />
                                                        </div>
                                                        <h3 className="text-xl font-bold text-foreground mb-2">Acesso de Administrador</h3>
                                                        <p className="text-muted-foreground max-w-sm">
                                                            Este usuário tem permissão total e irrestrita a todos os módulos e ferramentas do sistema. Não é necessário configurar permissões individuais.
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <div className="h-full flex flex-col">
                                                        {(() => {
                                                            const activeModule = SYSTEM_MODULES.find(m => m.id === activeModuleTab) || SYSTEM_MODULES[0];
                                                            return (
                                                                <>
                                                                    <div className="mb-6 pb-6 border-b border-border">
                                                                        <div className="flex items-center gap-3 mb-2">
                                                                            <activeModule.icon className="text-primary" size={28} />
                                                                            <h3 className="text-xl font-bold text-foreground">{activeModule.label}</h3>
                                                                        </div>
                                                                        <p className="text-muted-foreground">{activeModule.description}</p>
                                                                    </div>

                                                                    <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                                                                        {activeModule.tools.map(tool => (
                                                                            <div key={tool.id} className="flex items-center justify-between p-4 rounded-xl border border-border hover:bg-accent/20 transition-colors">
                                                                                <div className="flex-1 mr-4">
                                                                                    <div className="font-semibold text-foreground mb-1">{tool.label}</div>
                                                                                    <div className="text-sm text-muted-foreground">{tool.description}</div>
                                                                                </div>
                                                                                <div className="w-56 shrink-0">
                                                                                    <select
                                                                                        value={formData.permissoesCustom?.[tool.id] || 'bloqueado'}
                                                                                        onChange={(e) => setFormData(prev => ({
                                                                                            ...prev,
                                                                                            permissoesCustom: {
                                                                                                ...prev.permissoesCustom,
                                                                                                [tool.id]: e.target.value
                                                                                            }
                                                                                        }))}
                                                                                        className={`w-full text-sm rounded-lg border-2 px-3 py-2 focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium ${(formData.permissoesCustom?.[tool.id] === 'bloqueado' || !formData.permissoesCustom?.[tool.id])
                                                                                            ? 'bg-red-50 text-red-700 border-red-100'
                                                                                            : formData.permissoesCustom?.[tool.id] === 'visualizar'
                                                                                                ? 'bg-blue-50 text-blue-700 border-blue-100'
                                                                                                : formData.permissoesCustom?.[tool.id] === 'editar'
                                                                                                    ? 'bg-green-50 text-green-700 border-green-100'
                                                                                                    : 'bg-purple-50 text-purple-700 border-purple-100'
                                                                                            }`}
                                                                                    >
                                                                                        <option value="bloqueado">🔒 Bloqueado</option>
                                                                                        <option value="visualizar">👁️ Visualizar</option>
                                                                                        <option value="editar">✏️ Editar (Sem Excluir)</option>
                                                                                        <option value="gerenciar">⚙️ Gerenciar (Total)</option>
                                                                                    </select>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </>
                                                            );
                                                        })()}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                </div>

                                {/* Footer Fixo com Botões */}
                                <div className="p-6 border-t border-border bg-muted/10 shrink-0 flex items-center justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={handleCloseModal}
                                        className="px-6 py-2.5 rounded-xl border border-border bg-background hover:bg-accent text-foreground transition-colors font-medium"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25"
                                    >
                                        {editingUsuario ? 'Salvar Usuário' : 'Criar Usuário'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
