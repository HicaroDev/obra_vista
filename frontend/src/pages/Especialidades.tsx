import { useState, useEffect } from 'react';
import { especialidadesApi } from '../lib/api';
import {
    PiPlus as Plus,
    PiMagnifyingGlass as Search,
    PiTrash as Trash2,
    PiX as X,
    PiSpinner as Loader2,
    PiSliders as Settings2,
    PiPencilSimple as Edit2
} from 'react-icons/pi';

export function Especialidades() {
    const [especialidades, setEspecialidades] = useState<Array<{ id: number; nome: string }>>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingEsp, setEditingEsp] = useState<{ id: number; nome: string } | null>(null);
    const [nome, setNome] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadEspecialidades();
    }, []);

    const loadEspecialidades = async () => {
        try {
            setLoading(true);
            const response = await especialidadesApi.getAll();
            if (response.success) {
                setEspecialidades(response.data);
            }
        } catch (error) {
            console.error('Erro ao carregar especialidades:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!nome.trim()) return;

        try {
            setSaving(true);
            if (editingEsp) {
                const response = await especialidadesApi.update(editingEsp.id, nome);
                if (response.success) {
                    setNome('');
                    setEditingEsp(null);
                    setShowModal(false);
                    loadEspecialidades();
                } else {
                    alert(response.message || 'Erro ao atualizar especialidade');
                }
            } else {
                const response = await especialidadesApi.create(nome);
                if (response.success) {
                    setNome('');
                    setShowModal(false);
                    loadEspecialidades();
                } else {
                    alert(response.message || 'Erro ao criar especialidade');
                }
            }
        } catch (error) {
            console.error('Erro ao salvar:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (esp: { id: number; nome: string }) => {
        setEditingEsp(esp);
        setNome(esp.nome);
        setShowModal(true);
    };

    const handleDelete = async (id: number, nome: string) => {
        if (!confirm(`Tem certeza que deseja excluir a especialidade "${nome}"?`)) return;

        try {
            const response = await especialidadesApi.delete(id);
            if (response.success) {
                loadEspecialidades();
            } else {
                alert(response.message || 'Erro ao excluir especialidade');
            }
        } catch (error) {
            console.error('Erro ao excluir:', error);
            alert('Erro ao excluir especialidade. Verifique se existem prestadores vinculados.');
        }
    };

    const filteredEspecialidades = especialidades.filter(esp =>
        esp.nome.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-4 md:p-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Settings2 className="text-primary" />
                        Tipos de Prestadores
                    </h1>
                    <p className="text-muted-foreground">Gerencie as especialidades dos seus prestadores de serviço</p>
                </div>
                <button
                    onClick={() => {
                        setEditingEsp(null);
                        setNome('');
                        setShowModal(true);
                    }}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors shadow-sm font-medium"
                >
                    <Plus size={20} />
                    Nova Especialidade
                </button>
            </div>

            <div className="bg-card border border-border rounded-xl shadow-sm">
                <div className="p-4 border-b border-border">
                    <div className="relative max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar especialidade..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="animate-spin text-primary" size={32} />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="text-left border-b border-border bg-accent/30">
                                    <th className="px-6 py-4 font-semibold text-sm w-20">ID</th>
                                    <th className="px-6 py-4 font-semibold text-sm">Nome da Especialidade</th>
                                    <th className="px-6 py-4 font-semibold text-sm text-right w-32">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {filteredEspecialidades.map((esp) => (
                                    <tr key={esp.id} className="hover:bg-accent/20 transition-colors group">
                                        <td className="px-6 py-4 text-sm text-muted-foreground">{esp.id}</td>
                                        <td className="px-6 py-4 text-sm font-medium">{esp.nome}</td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                                <button
                                                    onClick={() => handleEdit(esp)}
                                                    className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                                    title="Editar"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(esp.id, esp.nome)}
                                                    className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                                                    title="Excluir"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {!loading && filteredEspecialidades.length === 0 && (
                    <div className="text-center py-12">
                        <Settings2 className="mx-auto text-muted-foreground/30 mb-4" size={48} />
                        <h3 className="text-lg font-medium text-muted-foreground">
                            {searchTerm ? 'Nenhuma especialidade encontrada' : 'Nenhuma especialidade cadastrada'}
                        </h3>
                    </div>
                )}
            </div>

            {/* Modal de Cadastro/Edição */}
            {showModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
                    <div className="bg-background border border-border rounded-xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                            <h2 className="text-lg font-medium">
                                {editingEsp ? 'Editar Especialidade' : 'Nova Especialidade'}
                            </h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className="p-2 hover:bg-accent rounded-lg transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2 text-muted-foreground">Nome do Tipo de Prestador</label>
                                <input
                                    type="text"
                                    value={nome}
                                    onChange={(e) => setNome(e.target.value)}
                                    placeholder="Ex: Pedreiro, Eletricista..."
                                    className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                                    required
                                    autoFocus
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-4 py-2 border border-input rounded-lg hover:bg-accent transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving || !nome.trim()}
                                    className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all shadow-sm font-medium flex items-center justify-center gap-2"
                                >
                                    {saving ? <Loader2 size={18} className="animate-spin" /> : (editingEsp ? <Edit2 size={18} /> : <Plus size={18} />)}
                                    {editingEsp ? 'Salvar Edição' : 'Salvar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
