import { useState, useEffect } from 'react';
import { unidadesApi } from '../lib/api';
import {
    PiPlus,
    PiMagnifyingGlass,
    PiPencilSimple,
    PiTrash,
    PiScales,
    PiPackage,
    PiSpinner,
    PiX
} from 'react-icons/pi';

export function Unidades() {
    const [unidades, setUnidades] = useState<{ id: number; nome: string; sigla: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingUnidade, setEditingUnidade] = useState<{ id: number; nome: string; sigla: string } | null>(null);
    const [formData, setFormData] = useState({ nome: '', sigla: '' });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadUnidades();
    }, []);

    const loadUnidades = async () => {
        try {
            setLoading(true);
            const response = await unidadesApi.getAll();
            if (response.success) {
                setUnidades(response.data);
            }
        } catch (error) {
            console.error('Erro ao carregar unidades:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.nome.trim() || !formData.sigla.trim()) return;

        try {
            setSaving(true);

            if (editingUnidade) {
                await unidadesApi.update(editingUnidade.id, formData);
            } else {
                await unidadesApi.create(formData);
            }

            await loadUnidades();
            handleCloseModal();
        } catch (error) {
            console.error('Erro ao salvar unidade:', error);
            alert('Erro ao salvar unidade. Verifique duplicidade.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Tem certeza que deseja excluir esta unidade?')) return;

        try {
            await unidadesApi.delete(id);
            setUnidades(unidades.filter(u => u.id !== id));
        } catch (error) {
            console.error('Erro ao excluir unidade:', error);
            alert('Erro ao excluir unidade.');
        }
    };

    const handleEdit = (unidade: { id: number; nome: string; sigla: string }) => {
        setEditingUnidade(unidade);
        setFormData({ nome: unidade.nome, sigla: unidade.sigla });
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingUnidade(null);
        setFormData({ nome: '', sigla: '' });
    };

    const filteredUnidades = unidades.filter(unidade =>
        unidade.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        unidade.sigla.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col min-h-screen">
            {/* Header Sticky */}
            <div className="sticky top-14 z-30 bg-white dark:bg-gray-900 shadow-sm px-6 py-6 border-b border-border">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-foreground mb-1">Unidades de Medida</h1>
                    <p className="text-sm text-muted-foreground">Gerencie as unidades para materiais</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                        <PiMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar unidades..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-muted/50 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                        />
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-sm font-medium"
                    >
                        <PiPlus size={18} />
                        Nova Unidade
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="p-6 pt-6">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <PiSpinner className="animate-spin text-primary" size={32} />
                    </div>
                ) : filteredUnidades.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                            <PiPackage className="text-muted-foreground" size={32} />
                        </div>
                        <h3 className="text-lg font-medium text-foreground mb-1">Nenhuma unidade encontrada</h3>
                        <p className="text-muted-foreground">
                            {searchTerm ? 'Tente buscar com outros termos.' : 'Cadastre a primeira unidade.'}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {filteredUnidades.map((unidade) => (
                            <div key={unidade.id} className="p-4 bg-card border border-border rounded-xl hover:shadow-md transition-all group">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-purple-600 dark:text-purple-400">
                                            <PiScales size={20} />
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-foreground">{unidade.nome}</h3>
                                            <span className="text-xs text-muted-foreground bg-accent px-2 py-0.5 rounded-full mt-1 inline-block font-mono">
                                                {unidade.sigla}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => handleEdit(unidade)}
                                            className="p-1.5 hover:bg-accent rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                                            title="Editar"
                                        >
                                            <PiPencilSimple size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(unidade.id)}
                                            className="p-1.5 hover:bg-rose-50 rounded-lg text-muted-foreground hover:text-rose-600 transition-colors"
                                            title="Excluir"
                                        >
                                            <PiTrash size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-xl shadow-2xl border border-border animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between p-6 border-b border-border">
                            <h2 className="text-xl font-semibold text-foreground">
                                {editingUnidade ? 'Editar Unidade' : 'Nova Unidade'}
                            </h2>
                            <button onClick={handleCloseModal} className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-accent transition-colors">
                                <span className="sr-only">Fechar</span>
                                <PiX size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1.5">Nome da Unidade *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.nome}
                                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                                    className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                                    placeholder="Ex: Quilograma"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1.5">Sigla *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.sigla}
                                    onChange={(e) => setFormData({ ...formData, sigla: e.target.value })}
                                    className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                                    placeholder="Ex: kg"
                                    maxLength={10}
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="px-4 py-2 bg-accent hover:bg-accent/80 text-foreground rounded-lg transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                    {saving && <PiSpinner size={16} className="animate-spin" />}
                                    {editingUnidade ? 'Salvar' : 'Criar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
