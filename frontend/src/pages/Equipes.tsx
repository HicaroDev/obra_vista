import { useState, useEffect } from 'react';
import { equipesApi, prestadoresApi } from '../lib/api';
import type { Equipe, Prestador } from '../types';
import { useAuthStore } from '../store/authStore';
import { canPerformAction } from '../lib/permissions';
import {
    PiUsers as Users,
    PiPlus as Plus,
    PiMagnifyingGlass as Search,
    PiPencilSimple as Edit2,
    PiTrash as Trash2,
    PiUserPlus as UserPlus,
    PiSpinner as Loader2,
    PiX as X,
    PiUser as User,
    PiBriefcase as Briefcase,
    PiCrown as Crown,
    PiCheck as Check
} from 'react-icons/pi';

export function Equipes() {
    const { user } = useAuthStore();
    const [equipes, setEquipes] = useState<Equipe[]>([]);
    const [prestadores, setPrestadores] = useState<Prestador[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingPrestadores, setLoadingPrestadores] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [showMembrosModal, setShowMembrosModal] = useState(false);
    const [editingEquipe, setEditingEquipe] = useState<Equipe | null>(null);
    const [selectedEquipe, setSelectedEquipe] = useState<Equipe | null>(null);

    // Tipo para gerenciar o estado local dos membros antes de salvar
    type MembroDraft = {
        tempId: string; // ID único para controle de estado local
        id?: number; // ID real se já existir no banco
        prestadorId?: number;
        usuarioId?: number;
        nome?: string;
        especialidade?: string;
        papel: 'lider' | 'membro';
        isExisting: boolean;
    };

    const [membrosDraft, setMembrosDraft] = useState<MembroDraft[]>([]);
    const [searchingPrestador, setSearchingPrestador] = useState('');
    const [savingMembros, setSavingMembros] = useState(false);
    const [formData, setFormData] = useState({
        nome: '',
        descricao: '',
        cor: '#3B82F6',
        ativa: true
    });

    const cores = [
        { value: '#3B82F6', label: 'Azul' },
        { value: '#10B981', label: 'Verde' },
        { value: '#F59E0B', label: 'Laranja' },
        { value: '#EF4444', label: 'Vermelho' },
        { value: '#8B5CF6', label: 'Roxo' },
        { value: '#EC4899', label: 'Rosa' },
        { value: '#14B8A6', label: 'Turquesa' },
        { value: '#F97316', label: 'Laranja Escuro' }
    ];

    useEffect(() => {
        loadEquipes();
    }, []);

    const loadEquipes = async () => {
        try {
            setLoading(true);
            const response = await equipesApi.getAll();
            if (response.success) {
                setEquipes(response.data);
            }
        } catch (error) {
            console.error('Erro ao carregar equipes:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            if (editingEquipe) {
                await equipesApi.update(editingEquipe.id, formData);
            } else {
                await equipesApi.create(formData);
            }

            await loadEquipes();
            handleCloseModal();
        } catch (error) {
            console.error('Erro ao salvar equipe:', error);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Tem certeza que deseja excluir esta equipe?')) return;

        try {
            await equipesApi.delete(id);
            await loadEquipes();
        } catch (error) {
            console.error('Erro ao excluir equipe:', error);
        }
    };

    const handleEdit = (equipe: Equipe) => {
        setEditingEquipe(equipe);
        setFormData({
            nome: equipe.nome,
            descricao: equipe.descricao || '',
            cor: equipe.cor || '#3B82F6',
            ativa: equipe.ativa
        });
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingEquipe(null);
        setFormData({
            nome: '',
            descricao: '',
            cor: '#3B82F6',
            ativa: true
        });
    };

    const filteredEquipes = equipes.filter(equipe =>
        equipe.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        equipe.descricao?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getMembroCount = (equipe: Equipe) => {
        return equipe.membros?.length || 0;
    };

    const handleManageMembros = async (equipe: Equipe) => {
        setSelectedEquipe(equipe);
        setShowMembrosModal(true);

        // Inicializar draft com membros existentes
        setMembrosDraft(equipe.membros?.map(m => ({
            tempId: `existing-${m.id}`,
            id: m.id,
            prestadorId: m.prestador?.id,
            usuarioId: m.usuario?.id, // Importante capturar o usuarioId
            nome: m.prestador?.nome || m.usuario?.nome,
            especialidade: m.prestador?.especialidade || (m.usuario ? 'Usuário Interno' : ''),
            papel: m.papel,
            isExisting: true
        })) || []);

        try {
            setLoadingPrestadores(true);
            const response = await prestadoresApi.getAll();
            if (response.success) {
                setPrestadores(response.data || []);
            }
        } catch (error) {
            console.error('Erro ao carregar prestadores:', error);
        } finally {
            setLoadingPrestadores(false);
        }
    };

    const handleCloseMembrosModal = () => {
        setShowMembrosModal(false);
        setSelectedEquipe(null);
        setMembrosDraft([]);
    };

    const toggleMembroPapel = (tempId: string) => {
        setMembrosDraft(prev => prev.map(m => {
            if (m.tempId === tempId) {
                return { ...m, papel: m.papel === 'lider' ? 'membro' : 'lider' };
            }
            return m;
        }));
    };

    const addDraftMembro = (prestador: Prestador) => {
        // Verificar se já está na lista (pelo prestadorId)
        if (membrosDraft.some(m => m.prestadorId === prestador.id)) return;

        setMembrosDraft(prev => [...prev, {
            tempId: `new-prestador-${prestador.id}`,
            prestadorId: prestador.id,
            nome: prestador.nome,
            especialidade: prestador.especialidade,
            papel: 'membro',
            isExisting: false
        }]);
    };

    const removeDraftMembro = (tempId: string) => {
        setMembrosDraft(prev => prev.filter(m => m.tempId !== tempId));
    };

    // Helper para verificar se um prestador está selecionado
    const isPrestadorSelected = (prestadorId: number) => {
        return membrosDraft.some(m => m.prestadorId === prestadorId);
    };

    // Helper para obter o tempId de um prestador selecionado
    const getPrestadorTempId = (prestadorId: number) => {
        const membro = membrosDraft.find(m => m.prestadorId === prestadorId);
        return membro ? membro.tempId : null;
    };

    const handleSaveMembros = async () => {
        if (!selectedEquipe) return;

        try {
            setSavingMembros(true);

            // 1. Identificar removidos (estavam no original mas não estão no draft)
            const originalMembros = selectedEquipe.membros || [];
            const toRemove = originalMembros.filter(original => {
                // Se não encontrar correspondência no draft, é porque foi removido
                return !membrosDraft.some(draft =>
                    (draft.id === original.id) // Verifica pelo ID original se existir
                );
            });

            if (toRemove.length > 0) {
                for (const m of toRemove) {
                    await equipesApi.removeMembro(selectedEquipe.id, m.id);
                }
            }

            // 2. Adicionar novos ou atualizar existentes
            for (const draft of membrosDraft) {
                if (!draft.isExisting) {
                    // Novo membro (apenas Prestadores por enquanto nesta interface)
                    await equipesApi.addMembro(selectedEquipe.id, {
                        prestadorId: draft.prestadorId,
                        usuarioId: draft.usuarioId,
                        papel: draft.papel
                    });
                } else {
                    // Membro existente - verificar se mudou papel
                    const original = originalMembros.find(m => m.id === draft.id);
                    if (original && original.papel !== draft.papel) {
                        await equipesApi.updateMembroPapel(selectedEquipe.id, original.id, draft.papel);
                    }
                }
            }

            await loadEquipes();
            handleCloseMembrosModal();
        } catch (error) {
            console.error('Erro ao salvar membros:', error);
            const message = error instanceof Error ? error.message : 'Erro ao sincronizar membros da equipe';
            alert(message);
        } finally {
            setSavingMembros(false);
        }
    };


    return (
        <div className="flex flex-col min-h-screen">
            {/* Header Sticky */}
            <div className="sticky top-14 z-30 bg-white dark:bg-slate-950 px-6 py-6 border-b border-border shadow-sm">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-foreground mb-1">Equipes</h1>
                    <p className="text-sm text-muted-foreground">Gerencie as equipes e seus membros</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar equipes..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-muted/50 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                        />
                    </div>
                    {canPerformAction('equipes', 'criar', user) && (
                        <button
                            onClick={() => setShowModal(true)}
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-sm font-medium"
                        >
                            <Plus size={18} />
                            Nova Equipe
                        </button>
                    )}
                </div>
            </div>

            {/* Content with padding */}
            <div className="p-6 pt-6">

                {/* Loading State */}
                {loading && (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="animate-spin text-primary" size={32} />
                    </div>
                )}

                {/* Equipes Grid */}
                {!loading && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredEquipes.map((equipe) => (
                            <div
                                key={equipe.id}
                                className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg transition-shadow"
                            >
                                {/* Header com cor da equipe */}
                                <div
                                    className="h-24 p-6 flex items-center justify-between"
                                    style={{ backgroundColor: equipe.cor }}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-lg">
                                            <Users className="text-white" size={20} />
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-white text-base leading-tight">{equipe.nome}</h3>
                                            <p className="text-white/80 text-sm">
                                                {getMembroCount(equipe)} {getMembroCount(equipe) === 1 ? 'membro' : 'membros'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Conteúdo */}
                                <div className="p-6">
                                    {equipe.descricao && (
                                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                                            {equipe.descricao}
                                        </p>
                                    )}

                                    {/* Status */}
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className={`w-2 h-2 rounded-full ${equipe.ativa ? 'bg-green-500' : 'bg-gray-400'}`} />
                                        <span className="text-sm text-muted-foreground">
                                            {equipe.ativa ? 'Ativa' : 'Inativa'}
                                        </span>
                                    </div>

                                    {/* Membros Preview */}
                                    {equipe.membros && equipe.membros.length > 0 && (
                                        <div className="mb-4">
                                            <p className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground mb-2">Membros:</p>
                                            <div className="space-y-2">
                                                {equipe.membros.slice(0, 3).map((membro) => (
                                                    <div key={membro.id} className="flex items-center gap-2 text-sm">
                                                        {membro.usuario ? (
                                                            <>
                                                                <User size={14} className="text-blue-500" />
                                                                <span className="truncate">{membro.usuario.nome}</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Briefcase size={14} className="text-green-500" />
                                                                <span className="truncate">{membro.prestador?.nome}</span>
                                                            </>
                                                        )}
                                                        <span className="text-xs text-muted-foreground ml-auto">
                                                            {membro.papel}
                                                        </span>
                                                    </div>
                                                ))}
                                                {equipe.membros.length > 3 && (
                                                    <p className="text-xs text-muted-foreground">
                                                        +{equipe.membros.length - 3} mais
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="flex gap-2 pt-4 border-t border-border">
                                        {canPerformAction('equipes', 'editar', user) && (
                                            <button
                                                onClick={() => handleEdit(equipe)}
                                                className="flex-1 px-3 py-2 bg-secondary text-secondary-foreground border border-transparent rounded-lg hover:border-border transition-all flex items-center justify-center gap-2 text-sm font-medium"
                                            >
                                                <Edit2 size={14} />
                                                Editar
                                            </button>
                                        )}
                                        {canPerformAction('equipes', 'editar', user) && (
                                            <button
                                                onClick={() => handleManageMembros(equipe)}
                                                className="p-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors border border-transparent hover:border-primary/30"
                                                title="Gerenciar membros"
                                            >
                                                <UserPlus size={16} />
                                            </button>
                                        )}
                                        {canPerformAction('equipes', 'excluir', user) && (
                                            <button
                                                onClick={() => handleDelete(equipe.id)}
                                                className="p-2 bg-destructive/5 hover:bg-destructive/10 text-destructive rounded-lg transition-colors border border-transparent hover:border-destructive/20"
                                                title="Excluir equipe"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Empty State */}
                {!loading && filteredEquipes.length === 0 && (
                    <div className="text-center py-12">
                        <Users className="mx-auto text-muted-foreground mb-4" size={48} />
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                            {searchTerm ? 'Nenhuma equipe encontrada' : 'Nenhuma equipe cadastrada'}
                        </h3>
                        <p className="text-muted-foreground mb-4">
                            {searchTerm
                                ? 'Tente buscar com outros termos'
                                : 'Comece criando sua primeira equipe'}
                        </p>
                        {!searchTerm && canPerformAction('equipes', 'criar', user) && (
                            <button
                                onClick={() => setShowModal(true)}
                                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors inline-flex items-center gap-2"
                            >
                                <Plus size={20} />
                                Nova Equipe
                            </button>
                        )}
                    </div>
                )}

                {/* Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
                        <div className="bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-700 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
                            <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-border px-6 py-4 flex items-center justify-between">
                                <h2 className="text-lg font-medium text-foreground">
                                    {editingEquipe ? 'Editar Equipe' : 'Nova Equipe'}
                                </h2>
                                <button
                                    onClick={handleCloseModal}
                                    className="p-2 hover:bg-accent rounded-lg transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Nome da Equipe *</label>
                                    <input
                                        type="text"
                                        value={formData.nome}
                                        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                                        className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                                        placeholder="Ex: Equipe Estrutural"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Descrição</label>
                                    <textarea
                                        value={formData.descricao}
                                        onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                                        className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                                        placeholder="Descrição da equipe..."
                                        rows={3}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Cor da Equipe</label>
                                    <div className="grid grid-cols-4 gap-3">
                                        {cores.map((cor) => (
                                            <button
                                                key={cor.value}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, cor: cor.value })}
                                                className={`h-12 rounded-lg border-2 transition-all ${formData.cor === cor.value
                                                    ? 'border-foreground scale-105'
                                                    : 'border-transparent hover:scale-105'
                                                    }`}
                                                style={{ backgroundColor: cor.value }}
                                                title={cor.label}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        id="ativa"
                                        checked={formData.ativa}
                                        onChange={(e) => setFormData({ ...formData, ativa: e.target.checked })}
                                        className="w-4 h-4 rounded border-input"
                                    />
                                    <label htmlFor="ativa" className="text-sm font-medium">
                                        Equipe ativa
                                    </label>
                                </div>

                                <div className="flex gap-3 pt-6 border-t border-border mt-2">
                                    <button
                                        type="button"
                                        onClick={handleCloseModal}
                                        className="flex-1 px-4 py-2.5 bg-background border border-input rounded-lg hover:bg-accent transition-colors text-sm font-medium"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all text-sm font-medium shadow-sm"
                                    >
                                        {editingEquipe ? 'Salvar Alterações' : 'Criar Equipe'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Modal de Gerenciamento de Membros */}
                {showMembrosModal && selectedEquipe && (
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
                        <div className="bg-white dark:bg-gray-900 border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                            {/* Header */}
                            <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-card/50">
                                <div>
                                    <h2 className="text-xl font-medium text-foreground">Gerenciar Membros</h2>
                                    <p className="text-sm text-muted-foreground mt-0.5">{selectedEquipe.nome}</p>
                                </div>
                                <button
                                    onClick={handleCloseMembrosModal}
                                    className="p-2 hover:bg-accent rounded-lg transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-8">
                                {/* Membros Atuais (Draft) */}
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                            <Users size={16} />
                                            Integrantes da Equipe ({membrosDraft.length})
                                        </h3>
                                    </div>

                                    {membrosDraft.length === 0 ? (
                                        <div className="text-center py-10 bg-accent/20 rounded-xl border border-dashed border-border">
                                            <Users className="mx-auto mb-2 text-muted-foreground/50" size={40} />
                                            <p className="text-sm text-muted-foreground">Esta equipe ainda não tem membros.</p>
                                            <p className="text-xs text-muted-foreground/70 mt-1">Selecione profissionais na lista abaixo para adicionar.</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {membrosDraft.map((m) => (
                                                <div
                                                    key={m.tempId}
                                                    className={`group flex items-center justify-between p-3 rounded-xl border transition-all ${m.papel === 'lider'
                                                        ? 'bg-primary/5 border-primary/30 ring-1 ring-primary/20'
                                                        : 'bg-card border-border hover:border-muted-foreground/30'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-3 overflow-hidden">
                                                        <div className={`p-2 rounded-lg ${m.papel === 'lider' ? 'bg-primary text-primary-foreground' : 'bg-accent text-muted-foreground'}`}>
                                                            {m.papel === 'lider' ? <Crown size={18} /> : <User size={18} />}
                                                        </div>
                                                        <div className="overflow-hidden">
                                                            <p className="font-medium text-sm truncate">{m.nome}</p>
                                                            <p className="text-xs text-muted-foreground truncate">{m.especialidade}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => toggleMembroPapel(m.tempId)}
                                                            className={`p-1.5 rounded-lg transition-colors ${m.papel === 'lider'
                                                                ? 'text-primary bg-primary/10 hover:bg-primary/20'
                                                                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                                                                }`}
                                                            title={m.papel === 'lider' ? "Remover cargo de Líder" : "Tornar Líder"}
                                                        >
                                                            <Crown size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => removeDraftMembro(m.tempId)}
                                                            className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                                                            title="Remover da equipe"
                                                        >
                                                            <X size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Seleção de Profissionais */}
                                <div className="pt-4 border-t border-border">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                                        <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                            <Briefcase size={16} />
                                            Selecionar Profissionais
                                        </h3>
                                        <div className="relative w-full sm:w-64">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                                            <input
                                                type="text"
                                                placeholder="Buscar profissional..."
                                                value={searchingPrestador}
                                                onChange={(e) => setSearchingPrestador(e.target.value)}
                                                className="w-full pl-9 pr-4 py-1.5 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                        {loadingPrestadores ? (
                                            <div className="col-span-2 py-10 text-center">
                                                <Loader2 className="animate-spin mx-auto text-primary mb-2" size={24} />
                                                <p className="text-sm text-muted-foreground">Carregando catálogo...</p>
                                            </div>
                                        ) : (
                                            prestadores
                                                .filter(p =>
                                                    p.nome.toLowerCase().includes(searchingPrestador.toLowerCase()) ||
                                                    p.especialidade.toLowerCase().includes(searchingPrestador.toLowerCase())
                                                )
                                                .map((p) => {
                                                    const isSelected = isPrestadorSelected(p.id);
                                                    const tempId = isSelected ? getPrestadorTempId(p.id) : null;

                                                    return (
                                                        <button
                                                            key={p.id}
                                                            onClick={() => isSelected && tempId ? removeDraftMembro(tempId) : addDraftMembro(p)}
                                                            className={`flex items-center justify-between p-3 rounded-xl border transition-all text-left ${isSelected
                                                                ? 'bg-primary/5 border-primary/30 ring-1 ring-primary/10'
                                                                : 'bg-background border-border hover:bg-accent/50 hover:border-muted-foreground/20'
                                                                }`}
                                                        >
                                                            <div className="flex items-center gap-3 overflow-hidden">
                                                                <div className={`p-2 rounded-lg ${isSelected ? 'bg-primary/20 text-primary' : 'bg-muted/50 text-muted-foreground'}`}>
                                                                    <Briefcase size={18} />
                                                                </div>
                                                                <div className="overflow-hidden">
                                                                    <p className="font-medium text-sm truncate">{p.nome}</p>
                                                                    <p className="text-xs text-muted-foreground truncate">{p.especialidade}</p>
                                                                </div>
                                                            </div>
                                                            <div className={`p-1 rounded-full ${isSelected ? 'bg-primary text-primary-foreground' : 'text-muted-foreground/30'}`}>
                                                                {isSelected ? <Check size={14} /> : <Plus size={16} />}
                                                            </div>
                                                        </button>
                                                    );
                                                })
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="p-4 border-t border-border bg-card/50 flex gap-3">
                                <button
                                    onClick={handleCloseMembrosModal}
                                    className="flex-1 px-4 py-2.5 border border-input rounded-xl hover:bg-accent transition-colors font-medium text-sm"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSaveMembros}
                                    disabled={savingMembros}
                                    className="flex-[2] px-4 py-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all font-medium text-sm shadow-sm flex items-center justify-center gap-2"
                                >
                                    {savingMembros ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" />
                                            Sincronizando...
                                        </>
                                    ) : (
                                        <>
                                            <Check size={18} />
                                            Salvar Alterações
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
