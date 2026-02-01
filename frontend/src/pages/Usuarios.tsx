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

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingUsuario(null);
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
                    <div className="bg-background border border-border rounded-2xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="sticky top-0 bg-background border-b border-border px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between z-10">
                            <h2 className="text-lg sm:text-xl font-bold text-foreground">
                                {editingUsuario ? 'Editar Usuário' : 'Cadastrar Novo Usuário'}
                            </h2>
                            <button
                                onClick={handleCloseModal}
                                className="p-2 hover:bg-accent rounded-lg transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2 text-foreground">Nome *</label>
                                    <input
                                        type="text"
                                        value={formData.nome}
                                        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                                        className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground appearance-none"
                                        placeholder="Ex: João Silva"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2 text-foreground">Email *</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground appearance-none"
                                        placeholder="joao@exemplo.com"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2 text-foreground">
                                        Senha {editingUsuario ? '(deixe em branco para manter)' : '*'}
                                    </label>
                                    <input
                                        type="password"
                                        value={formData.senha}
                                        onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                                        className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground appearance-none"
                                        placeholder="••••••••"
                                        required={!editingUsuario}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2 text-foreground">Telefone</label>
                                    <input
                                        type="tel"
                                        value={formData.telefone}
                                        onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                                        className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground appearance-none"
                                        placeholder="(11) 98765-4321"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Cargo</label>
                                <input
                                    type="text"
                                    value={formData.cargo}
                                    onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                                    className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
                                    placeholder="Ex: Engenheiro Civil"
                                />
                            </div>

                            {/* Seleção de Roles */}
                            <div>
                                <label className="block text-sm font-medium mb-3 text-foreground">Perfil de Acesso (Role) *</label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                                    {roles.map((role) => (
                                        <label
                                            key={role.id}
                                            className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-colors ${formData.roleIds.includes(role.id)
                                                ? 'bg-primary/10 border-primary'
                                                : 'bg-background border-input hover:border-primary/50'
                                                }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={formData.roleIds.includes(role.id)}
                                                onChange={() => toggleRole(role.id)}
                                                className="mt-1"
                                            />
                                            <div className="flex-1">
                                                <div className="font-medium text-foreground">{role.nome}</div>
                                                {role.descricao && (
                                                    <div className="text-sm text-muted-foreground mt-1">
                                                        {role.descricao}
                                                    </div>
                                                )}
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Tipo de Conta (Admin ou Usuário) */}
                            <div>
                                <label className="block text-sm font-medium mb-3 text-foreground">Tipo de Conta</label>
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <label
                                        className={`flex flex-col items-center justify-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
                                            // Se tiver a role de Admin (id 1 assumido ou lógica de permissoes) ou flag específica
                                            // Simplificação: Vamos usar um estado local para controlar visualmente, mas salvar nas roles/permissoes
                                            formData.permissoesCustom?.admin === true
                                                ? 'bg-primary/10 border-primary shadow-sm'
                                                : 'bg-background border-input hover:border-primary/50'
                                            }`}
                                        onClick={() => {
                                            // Ao clicar em Admin, define todas as permissões como 'editar' e adiciona flag admin
                                            const allPermissions = [
                                                'dashboard', 'obras', 'equipes', 'usuarios',
                                                'prestadores', 'produtos', 'financeiro',
                                                'relatorios', 'configuracoes'
                                            ].reduce((acc, key) => ({ ...acc, [key]: 'editar' }), {});

                                            setFormData(prev => ({
                                                ...prev,
                                                permissoesCustom: { ...allPermissions, admin: true }
                                            }));
                                        }}
                                    >
                                        <Shield size={24} className={formData.permissoesCustom?.admin === true ? 'text-primary' : 'text-muted-foreground'} />
                                        <span className={`mt-2 font-medium ${formData.permissoesCustom?.admin === true ? 'text-primary' : 'text-foreground'}`}>
                                            Administrador
                                        </span>
                                        <span className="text-xs text-muted-foreground mt-1 text-center">
                                            Acesso total a todas as funcionalidades
                                        </span>
                                    </label>

                                    <label
                                        className={`flex flex-col items-center justify-center p-4 border-2 rounded-xl cursor-pointer transition-all ${!formData.permissoesCustom?.admin
                                            ? 'bg-primary/10 border-primary shadow-sm'
                                            : 'bg-background border-input hover:border-primary/50'
                                            }`}
                                        onClick={() => {
                                            // Ao clicar em Padrão, remove flag admin (mantém permissões atuais ou reseta para visualizar? Melhor manter)
                                            setFormData(prev => {
                                                const newPerms = { ...prev.permissoesCustom };
                                                delete newPerms.admin;
                                                return { ...prev, permissoesCustom: newPerms };
                                            });
                                        }}
                                    >
                                        <Users size={24} className={!formData.permissoesCustom?.admin ? 'text-primary' : 'text-muted-foreground'} />
                                        <span className={`mt-2 font-medium ${!formData.permissoesCustom?.admin ? 'text-primary' : 'text-foreground'}`}>
                                            Usuário Padrão
                                        </span>
                                        <span className="text-xs text-muted-foreground mt-1 text-center">
                                            Configurar permissões por página
                                        </span>
                                    </label>
                                </div>
                            </div>

                            {/* Detalhes de Permissões (Só mostra ou habilita se for Padrão) */}
                            <div className={`transition-opacity duration-200 ${formData.permissoesCustom?.admin ? 'opacity-50 pointer-events-none grayscale' : 'opacity-100'}`}>
                                <div className="flex items-center gap-2 mb-3">
                                    <Shield size={18} className="text-primary" />
                                    <label className="text-sm font-medium">Permissões Específicas por Página</label>
                                </div>

                                <div className="bg-accent/30 rounded-lg border border-border overflow-hidden">
                                    {/* ... tabela existente ... */}
                                    <table className="w-full text-sm">
                                        <thead className="bg-accent/50 border-b border-border">
                                            <tr>
                                                <th className="px-4 py-2 text-left font-medium text-muted-foreground w-1/3">Página</th>
                                                <th className="px-4 py-2 text-left font-medium text-muted-foreground">Nível de Acesso</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {[
                                                { key: 'dashboard', label: 'Dashboard' },
                                                { key: 'obras', label: 'Obras' },
                                                { key: 'equipes', label: 'Equipes' },
                                                { key: 'usuarios', label: 'Usuários' },
                                                { key: 'prestadores', label: 'Prestadores' },
                                                { key: 'produtos', label: 'Produtos / Estoque' },
                                                { key: 'financeiro', label: 'Financeiro' },
                                                { key: 'relatorios', label: 'Relatórios' },
                                                { key: 'configuracoes', label: 'Configurações' }
                                            ].map((page) => (
                                                <tr key={page.key} className="hover:bg-accent/50">
                                                    <td className="px-4 py-2 font-medium">{page.label}</td>
                                                    <td className="px-4 py-2">
                                                        <select
                                                            value={(['criar', 'gerenciar'].includes(formData.permissoesCustom?.[page.key]) ? 'editar' : formData.permissoesCustom?.[page.key]) || 'visualizar'}
                                                            onChange={(e) => setFormData(prev => ({
                                                                ...prev,
                                                                permissoesCustom: {
                                                                    ...prev.permissoesCustom,
                                                                    [page.key]: e.target.value
                                                                }
                                                            }))}
                                                            disabled={formData.permissoesCustom?.admin === true}
                                                            className="w-full bg-background border border-input rounded px-2 py-1 text-xs focus:ring-1 focus:ring-primary disabled:opacity-50 text-foreground"
                                                        >
                                                            <option value="bloqueado">🔒 Bloqueado</option>
                                                            <option value="visualizar">👁️ Visualizar (Apenas Leitura)</option>
                                                            <option value="editar">✨ Acesso Total (Criar/Editar)</option>
                                                        </select>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <p className="text-xs text-muted-foreground mt-2">
                                    * "Bloqueado" remove a página do menu lateral para este usuário.
                                </p>
                            </div>

                            {/* Status Ativo */}
                            <div className="flex items-center gap-3 mt-4">
                                <input
                                    type="checkbox"
                                    id="ativo"
                                    checked={formData.ativo}
                                    onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                                    className="w-4 h-4 rounded border-input text-primary focus:ring-primary"
                                />
                                <label htmlFor="ativo" className="text-sm font-medium cursor-pointer">
                                    Usuário ativo (pode fazer login no sistema)
                                </label>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="flex-1 px-4 py-2 bg-accent hover:bg-accent/80 text-foreground rounded-lg transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                                >
                                    {editingUsuario ? 'Salvar Alterações' : 'Criar Usuário'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
