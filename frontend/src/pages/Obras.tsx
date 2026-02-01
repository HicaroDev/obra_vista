import { useState, useEffect } from 'react';
import { obrasApi } from '../lib/api';
import type { Obra } from '../types';
import { useAuthStore } from '../store/authStore';
import { canPerformAction } from '../lib/permissions';
import {
    PiBuildings as Building2,
    PiPlus as Plus,
    PiMagnifyingGlass as Search,
    PiPencilSimple as Edit2,
    PiTrash as Trash2,
    PiMapPin as MapPin,
    PiCalendarBlank as Calendar,
    PiSpinner as Loader2,
    PiX as X,
    PiUser as User
} from 'react-icons/pi';

export function Obras() {
    const { user } = useAuthStore();
    const [obras, setObras] = useState<Obra[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingObra, setEditingObra] = useState<Obra | null>(null);
    const [formData, setFormData] = useState({
        nome: '',
        endereco: '',
        descricao: '',
        status: 'orcamento',
        responsavel: '',
        latitude: '',
        longitude: '',
        dataInicio: '',
        dataFim: ''
    });

    useEffect(() => {
        loadObras();
    }, []);

    const loadObras = async () => {
        try {
            setLoading(true);
            const response = await obrasApi.getAll();
            if (response.success) {
                setObras(response.data);
            }
        } catch (error) {
            console.error('Erro ao carregar obras:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const data = {
                ...formData,
                status: formData.status as Obra['status'],
                dataInicio: formData.dataInicio ? new Date(formData.dataInicio).toISOString() : undefined,
                dataFim: formData.dataFim ? new Date(formData.dataFim).toISOString() : undefined,
            };

            if (editingObra) {
                await obrasApi.update(editingObra.id, data);
            } else {
                await obrasApi.create(data);
            }

            await loadObras();
            handleCloseModal();
        } catch (error) {
            console.error('Erro ao salvar obra:', error);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Tem certeza que deseja excluir esta obra?')) return;

        try {
            await obrasApi.delete(id);
            await loadObras();
        } catch (error) {
            console.error('Erro ao excluir obra:', error);
        }
    };

    const handleEdit = (obra: Obra) => {
        setEditingObra(obra);
        setFormData({
            nome: obra.nome,
            endereco: obra.endereco,
            descricao: obra.descricao || '',
            status: obra.status,
            responsavel: obra.responsavel || '',
            latitude: obra.latitude || '',
            longitude: obra.longitude || '',
            dataInicio: obra.dataInicio ? new Date(obra.dataInicio).toISOString().split('T')[0] : '',
            dataFim: obra.dataFim ? new Date(obra.dataFim).toISOString().split('T')[0] : ''
        });
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingObra(null);
        setFormData({
            nome: '',
            endereco: '',
            descricao: '',
            status: 'orcamento',
            responsavel: '',
            latitude: '',
            longitude: '',
            dataInicio: '',
            dataFim: ''
        });
    };

    const filteredObras = obras.filter(obra =>
        obra.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        obra.endereco.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusColor = (status: string) => {
        const colors = {
            orcamento: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
            aprovado: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400',
            planejamento: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
            em_andamento: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
            pausado: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
            concluido: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
            cancelado: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
        };
        return colors[status as keyof typeof colors] || colors.planejamento;
    };

    const getStatusLabel = (status: string) => {
        const labels = {
            orcamento: 'Orçamento',
            aprovado: 'Aprovado',
            planejamento: 'Planejamento',
            em_andamento: 'Em Andamento',
            pausado: 'Pausado',
            concluido: 'Concluído',
            cancelado: 'Cancelado'
        };
        return labels[status as keyof typeof labels] || status;
    };

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-medium text-foreground mb-2">Obras</h1>
                <p className="text-muted-foreground">Gerencie todas as obras do sistema</p>
            </div>

            {/* Actions Bar */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar obras..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground"
                    />
                </div>
                {canPerformAction('obras', 'criar', user) && (
                    <button
                        onClick={() => setShowModal(true)}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
                    >
                        <Plus size={20} />
                        Nova Obra
                    </button>
                )}
            </div>

            {/* Loading State */}
            {loading && (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="animate-spin text-primary" size={32} />
                </div>
            )}

            {/* Obras Grid */}
            {!loading && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredObras.map((obra) => (
                        <div
                            key={obra.id}
                            className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-shadow"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/10 rounded-lg">
                                        <Building2 className="text-primary" size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-foreground">{obra.nome}</h3>
                                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${getStatusColor(obra.status)}`}>
                                            {getStatusLabel(obra.status)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2 mb-4">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <MapPin size={16} />
                                    <span className="truncate">{obra.endereco}</span>
                                    {obra.latitude && obra.longitude && (
                                        <span className="ml-2 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded text-xs">
                                            GPS
                                        </span>
                                    )}
                                </div>

                                {obra.responsavel && (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <User size={16} />
                                        <span>{obra.responsavel}</span>
                                    </div>
                                )}

                                {obra.dataInicio && (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Calendar size={16} />
                                        <span>Início: {new Date(obra.dataInicio).toLocaleDateString('pt-BR')}</span>
                                    </div>
                                )}
                            </div>

                            {obra.descricao && (
                                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                                    {obra.descricao}
                                </p>
                            )}

                            {(canPerformAction('obras', 'editar', user) || canPerformAction('obras', 'excluir', user)) && (
                                <div className="flex gap-2 pt-4 border-t border-border">
                                    {canPerformAction('obras', 'editar', user) && (
                                        <button
                                            onClick={() => handleEdit(obra)}
                                            className="flex-1 px-3 py-2 bg-accent hover:bg-accent/80 text-foreground rounded-lg transition-colors flex items-center justify-center gap-2"
                                        >
                                            <Edit2 size={16} />
                                            Editar
                                        </button>
                                    )}
                                    {canPerformAction('obras', 'excluir', user) && (
                                        <button
                                            onClick={() => handleDelete(obra.id)}
                                            className="px-3 py-2 bg-destructive/10 hover:bg-destructive/20 text-destructive rounded-lg transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Empty State */}
            {!loading && filteredObras.length === 0 && (
                <div className="text-center py-12">
                    <Building2 className="mx-auto text-muted-foreground mb-4" size={48} />
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                        {searchTerm ? 'Nenhuma obra encontrada' : 'Nenhuma obra cadastrada'}
                    </h3>
                    <p className="text-muted-foreground mb-4">
                        {searchTerm
                            ? 'Tente buscar com outros termos'
                            : 'Comece criando sua primeira obra'}
                    </p>
                    {!searchTerm && canPerformAction('obras', 'criar', user) && (
                        <button
                            onClick={() => setShowModal(true)}
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors inline-flex items-center gap-2"
                        >
                            <Plus size={20} />
                            Nova Obra
                        </button>
                    )}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-background border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="sticky top-0 bg-background border-b border-border px-6 py-4 flex items-center justify-between z-10">
                            <h2 className="text-xl font-bold text-foreground">
                                {editingObra ? 'Editar Obra' : 'Nova Obra'}
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
                                <label className="block text-sm font-medium mb-2">Nome da Obra *</label>
                                <input
                                    type="text"
                                    value={formData.nome}
                                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                                    className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
                                    placeholder="Ex: Edifício Residencial Centro"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Endereço *</label>
                                <input
                                    type="text"
                                    value={formData.endereco}
                                    onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                                    className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
                                    placeholder="Ex: Rua Principal, 123 - Centro"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Descrição</label>
                                <textarea
                                    value={formData.descricao}
                                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                                    className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
                                    placeholder="Descrição detalhada da obra..."
                                    rows={3}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Status</label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
                                    >
                                        <option value="orcamento">Orçamento</option>
                                        <option value="aprovado">Aprovado</option>
                                        <option value="planejamento">Planejamento</option>
                                        <option value="em_andamento">Em Andamento</option>
                                        <option value="pausado">Pausado</option>
                                        <option value="concluido">Concluído</option>
                                        <option value="cancelado">Cancelado</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Responsável</label>
                                    <input
                                        type="text"
                                        value={formData.responsavel}
                                        onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })}
                                        className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
                                        placeholder="Ex: João Silva"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Latitude</label>
                                    <input
                                        type="text"
                                        value={formData.latitude}
                                        onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                                        className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
                                        placeholder="Ex: -23.550520"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Longitude</label>
                                    <input
                                        type="text"
                                        value={formData.longitude}
                                        onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                                        className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
                                        placeholder="Ex: -46.633308"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Data de Início</label>
                                    <input
                                        type="date"
                                        value={formData.dataInicio}
                                        onChange={(e) => setFormData({ ...formData, dataInicio: e.target.value })}
                                        className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Data de Término</label>
                                    <input
                                        type="date"
                                        value={formData.dataFim}
                                        onChange={(e) => setFormData({ ...formData, dataFim: e.target.value })}
                                        className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
                                    />
                                </div>
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
                                    {editingObra ? 'Salvar Alterações' : 'Criar Obra'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
