import { useState, useEffect } from 'react';
import { produtosApi, unidadesApi } from '../lib/api';
import { PiPlus as Plus, PiMagnifyingGlass as Search, PiPencilSimple as Pencil, PiTrash as Trash2, PiCube as Box, PiPackage as Package, PiSpinner as Loader2, PiX as X } from 'react-icons/pi';
import { useAuthStore } from '../store/authStore';
import { canPerformAction } from '../lib/permissions';

export function Produtos() {
    const { user } = useAuthStore();
    const [produtos, setProdutos] = useState<{ id: number; nome: string; unidade: string }[]>([]);
    const [unidades, setUnidades] = useState<{ id: number; nome: string; sigla: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingProduto, setEditingProduto] = useState<{ id: number; nome: string; unidade: string } | null>(null);
    const [formData, setFormData] = useState({ nome: '', unidade: 'un' });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [prodRes, uniRes] = await Promise.all([
                produtosApi.getAll(),
                unidadesApi.getAll()
            ]);

            if (prodRes.success) setProdutos(prodRes.data);
            if (uniRes.success) setUnidades(uniRes.data);
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
        } finally {
            setLoading(false);
        }
    };



    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.nome.trim()) return;

        try {
            setSaving(true);

            if (editingProduto) {
                await produtosApi.update(editingProduto.id, formData);
            } else {
                await produtosApi.create(formData);
            }

            await loadData();
            handleCloseModal();
        } catch (error) {
            console.error('Erro ao salvar produto:', error);
            alert('Erro ao salvar produto. Verifique se já existe um produto com este nome.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Tem certeza que deseja excluir este produto?')) return;

        try {
            await produtosApi.delete(id);
            setProdutos(produtos.filter(p => p.id !== id));
        } catch (error) {
            console.error('Erro ao excluir produto:', error);
            alert('Erro ao excluir produto. Ele pode estar sendo usado em alguma tarefa.');
        }
    };

    const handleEdit = (produto: { id: number; nome: string; unidade: string }) => {
        setEditingProduto(produto);
        setFormData({ nome: produto.nome, unidade: produto.unidade || 'un' });
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingProduto(null);
        setFormData({ nome: '', unidade: 'un' });
    };

    const filteredProdutos = produtos.filter(produto =>
        produto.nome.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col min-h-screen">
            {/* Header Sticky */}
            <div className="sticky top-14 z-30 bg-white dark:bg-slate-950 border-b border-border shadow-sm px-6 py-6">
                <div className="mb-6">
                    <h1 className="text-2xl font-medium text-foreground mb-1">Produtos</h1>
                    <p className="text-sm text-muted-foreground">Gerencie o catálogo de materiais e insumos</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar produtos..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-1 focus:ring-primary transition-all text-sm"
                        />
                    </div>
                    {canPerformAction('produtos', 'criar', user) && (
                        <button
                            onClick={() => setShowModal(true)}
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
                        >
                            <Plus size={18} />
                            Novo Produto
                        </button>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="p-6 pt-6">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="animate-spin text-primary" size={32} />
                    </div>
                ) : filteredProdutos.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                            <Package className="text-muted-foreground" size={32} />
                        </div>
                        <h3 className="text-lg font-medium text-foreground mb-1">Nenhum produto encontrado</h3>
                        <p className="text-muted-foreground">
                            {searchTerm ? 'Tente buscar com outros termos.' : 'Cadastre o primeiro produto para começar.'}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredProdutos.map((produto) => (
                            <div key={produto.id} className="p-4 bg-card border border-border rounded-xl hover:shadow-md transition-all group">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
                                            <Box size={20} />
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-foreground">{produto.nome}</h3>
                                            <span className="text-xs text-muted-foreground bg-accent px-2 py-0.5 rounded-full mt-1 inline-block">
                                                {produto.unidade}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {canPerformAction('produtos', 'editar', user) && (
                                            <button
                                                onClick={() => handleEdit(produto)}
                                                className="p-1.5 hover:bg-accent rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                                                title="Editar"
                                            >
                                                <Pencil size={16} />
                                            </button>
                                        )}
                                        {canPerformAction('produtos', 'excluir', user) && (
                                            <button
                                                onClick={() => handleDelete(produto.id)}
                                                className="p-1.5 hover:bg-rose-50 rounded-lg text-muted-foreground hover:text-rose-600 transition-colors"
                                                title="Excluir"
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
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-xl shadow-2xl border border-border animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between p-6 border-b border-border">
                            <h2 className="text-xl font-semibold text-foreground">
                                {editingProduto ? 'Editar Produto' : 'Novo Produto'}
                            </h2>
                            <button onClick={handleCloseModal} className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-accent transition-colors">
                                <span className="sr-only">Fechar</span>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1.5">Nome do Produto *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.nome}
                                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                                    className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                                    placeholder="Ex: Cimento CP-II"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1.5">Unidade de Medida *</label>
                                <select
                                    value={formData.unidade}
                                    onChange={(e) => setFormData({ ...formData, unidade: e.target.value })}
                                    className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                                >
                                    {unidades.map(u => (
                                        <option key={u.id} value={u.sigla}>{u.nome} ({u.sigla})</option>
                                    ))}
                                    {/* Fallback option if list is empty or matches static default */}
                                    {!unidades.some(u => u.sigla === 'un') && <option value="un">Unidade (un)</option>}
                                </select>
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
                                    {saving && <Loader2 size={16} className="animate-spin" />}
                                    {editingProduto ? 'Salvar Alterações' : 'Criar Produto'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
