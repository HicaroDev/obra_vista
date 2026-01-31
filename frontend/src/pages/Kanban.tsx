import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import { atribuicoesApi, obrasApi, equipesApi, prestadoresApi, checklistsApi, anexosApi, etiquetasApi, comprasApi, produtosApi } from '../lib/api';
import type { Atribuicao, Obra, Equipe, Prestador, TarefaChecklist, TarefaAnexo, TarefaCompra } from '../types';
import {
    PiLayout as LayoutDashboard,
    PiPlus as Plus,
    PiMagnifyingGlass as Search,
    PiPencilSimple as Edit2,
    PiTrash as Trash2,
    PiCalendarBlank as Calendar,
    PiUsers as Users,
    PiWarningCircle as AlertCircle,
    PiClock as Clock,
    PiCheckCircle as CheckCircle2,
    PiSpinner as Loader2,
    PiX as X,
    PiBriefcase as Briefcase,
    PiFileText as FileText,
    PiImage as Image,
    PiVideo as Video,
    PiDownloadSimple as Download,
    PiUploadSimple as Upload,
    PiTag as Tag,
    PiShoppingCart as ShoppingCart
} from 'react-icons/pi';

type KanbanColumn = {
    id: string;
    title: string;
    icon: React.ElementType;
    color: string;
    tasks: Atribuicao[];
};

export function Kanban() {
    const [obras, setObras] = useState<Obra[]>([]);
    const [selectedObra, setSelectedObra] = useState<number | null>(null);
    const [atribuicoes, setAtribuicoes] = useState<Atribuicao[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingTask, setEditingTask] = useState<Atribuicao | null>(null);
    const [equipes, setEquipes] = useState<Equipe[]>([]);
    const [prestadores, setPrestadores] = useState<Prestador[]>([]);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'geral' | 'checklist' | 'anexos' | 'compras' | 'ocorrencias' | 'etiquetas'>('geral');
    const [checklists, setChecklists] = useState<TarefaChecklist[]>([]);
    const [newChecklistItem, setNewChecklistItem] = useState('');
    const [addingItem, setAddingItem] = useState(false);
    const [anexos, setAnexos] = useState<TarefaAnexo[]>([]);
    const [uploading, setUploading] = useState(false);
    const [etiquetasOptions, setEtiquetasOptions] = useState<{ id: number; nome: string; cor: string }[]>([]);
    const [selectedEtiquetas, setSelectedEtiquetas] = useState<{ id: number; nome: string; cor: string }[]>([]);
    const [newEtiqueta, setNewEtiqueta] = useState({ nome: '', cor: '#3B82F6' });

    const [creatingEtiqueta, setCreatingEtiqueta] = useState(false);
    const [compras, setCompras] = useState<TarefaCompra[]>([]);
    const [newCompra, setNewCompra] = useState({ material: '', quantidade: '', unidade: 'un', observacoes: '' });
    const [productSuggestions, setProductSuggestions] = useState<{ id: number; nome: string; unidade: string }[]>([]);
    const [addingCompra, setAddingCompra] = useState(false);

    // Form Data State
    const [formData, setFormData] = useState({
        titulo: '',
        descricao: '',
        prioridade: 'media',
        tipoAtribuicao: 'equipe' as 'equipe' | 'prestador',
        equipeId: '',
        prestadorId: '',
        dataInicio: '',
        dataFim: '',
        diasSemana: [] as string[]
    });

    const columns: KanbanColumn[] = [
        {
            id: 'a_fazer',
            title: 'A Fazer',
            icon: Clock,
            color: 'bg-gray-500',
            tasks: atribuicoes.filter(a => a.status === 'a_fazer')
        },
        {
            id: 'em_progresso',
            title: 'Em Progresso',
            icon: AlertCircle,
            color: 'bg-blue-500',
            tasks: atribuicoes.filter(a => a.status === 'em_progresso')
        },
        {
            id: 'concluido',
            title: 'ConcluÃ­do',
            icon: CheckCircle2,
            color: 'bg-green-500',
            tasks: atribuicoes.filter(a => a.status === 'concluido')
        }
    ];

    useEffect(() => {
        loadObras();
        loadEquipesAndPrestadores();
        loadEtiquetas();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (selectedObra) {
            loadAtribuicoes();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedObra]);

    const loadEtiquetas = async () => {
        try {
            const response = await etiquetasApi.getAll();
            if (response.success) setEtiquetasOptions(response.data);
        } catch (error) {
            console.error('Erro ao carregar etiquetas:', error);
        }
    };

    const loadEquipesAndPrestadores = async () => {
        try {
            const [espRes, prestRes] = await Promise.all([
                equipesApi.getAll(),
                prestadoresApi.getAll()
            ]);
            if (espRes.success) setEquipes(espRes.data);
            if (prestRes.success) setPrestadores(prestRes.data);
        } catch (error) {
            console.error('Erro ao carregar dados auxiliares:', error);
        }
    };

    const loadObras = async () => {
        try {
            const response = await obrasApi.getAll();
            if (response.success) {
                setObras(response.data);
                if (response.data.length > 0 && !selectedObra) {
                    setSelectedObra(response.data[0].id);
                }
            }
        } catch (error) {
            console.error('Erro ao carregar obras:', error);
        }
    };

    const loadAtribuicoes = async () => {
        if (!selectedObra) return;

        try {
            setLoading(true);
            const response = await atribuicoesApi.getByObra(selectedObra);
            if (response.success) {
                setAtribuicoes(response.data);
            }
        } catch (error) {
            console.error('Erro ao carregar atribuições:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDragEnd = async (result: DropResult) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;
        if (destination.droppableId === source.droppableId && destination.index === source.index) {
            return;
        }

        const taskId = parseInt(draggableId);
        const newStatus = destination.droppableId as Atribuicao['status'];

        try {
            await atribuicoesApi.updateStatus(taskId, newStatus, destination.index);
            await loadAtribuicoes();
        } catch (error) {
            console.error('Erro ao atualizar status:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedObra) {
            alert('Selecione uma obra primeiro');
            return;
        }

        try {
            setSaving(true);
            const data = {
                obraId: selectedObra,
                titulo: formData.titulo,
                descricao: formData.descricao,
                prioridade: formData.prioridade as Atribuicao['prioridade'],
                tipoAtribuicao: formData.tipoAtribuicao,
                equipeId: formData.tipoAtribuicao === 'equipe' && formData.equipeId ? parseInt(formData.equipeId) : undefined,
                prestadorId: formData.tipoAtribuicao === 'prestador' && formData.prestadorId ? parseInt(formData.prestadorId) : undefined,
                status: editingTask?.status || 'a_fazer',
                dataInicio: formData.dataInicio ? new Date(formData.dataInicio).toISOString() : undefined,
                dataFim: formData.dataFim ? new Date(formData.dataFim).toISOString() : undefined,
                diasSemana: formData.diasSemana
            };

            if (editingTask) {
                await atribuicoesApi.update(editingTask.id, data);
                alert('Tarefa atualizada com sucesso!');
            } else {
                await atribuicoesApi.create(data);
                alert('Tarefa criada com sucesso!');
            }

            await loadAtribuicoes();
            handleCloseModal();
        } catch (error) {
            console.error('Erro ao salvar tarefa:', error);
            alert('Erro ao salvar tarefa. Verifique os dados e tente novamente.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Tem certeza que deseja excluir esta tarefa?')) return;

        try {
            await atribuicoesApi.delete(id);
            await loadAtribuicoes();
        } catch (error) {
            console.error('Erro ao excluir tarefa:', error);
        }
    };

    const handleEdit = async (task: Atribuicao) => {
        setEditingTask(task);
        setFormData({
            titulo: task.titulo,
            descricao: task.descricao || '',
            prioridade: task.prioridade,
            tipoAtribuicao: task.tipoAtribuicao || 'equipe',
            equipeId: task.equipeId?.toString() || '',
            prestadorId: task.prestadorId?.toString() || '',
            dataInicio: task.dataInicio ? new Date(task.dataInicio).toISOString().split('T')[0] : '',
            dataFim: task.dataFim ? new Date(task.dataFim).toISOString().split('T')[0] : '',
            diasSemana: task.diasSemana || []
        });

        // Carregar checklists
        try {
            const response = await checklistsApi.getByTarefa(task.id);
            if (response.success) {
                setChecklists(response.data);
            }
        } catch (error) {
            console.error('Erro ao carregar checklists:', error);
        }

        // Carregar anexos
        try {
            const response = await anexosApi.getByTarefa(task.id);
            if (response.success) {
                setAnexos(response.data);
            }
        } catch (error) {
            console.error('Erro ao carregar anexos:', error);
            console.error('Erro ao carregar anexos:', error);
        }

        // Carregar etiquetas da tarefa
        try {
            const response = await etiquetasApi.getByTarefa(task.id);
            if (response.success) {
                setSelectedEtiquetas(response.data);
            }
        } catch (error) {
            console.error('Erro ao carregar etiquetas da tarefa:', error);
        }


        // Carregar compras
        try {
            const response = await comprasApi.getByTarefa(task.id);
            if (response.success) {
                setCompras(response.data);
            }
        } catch (error) {
            console.error('Erro ao carregar compras:', error);
        }

        setShowModal(true);
    };

    const handleCreateEtiqueta = async () => {
        if (!newEtiqueta.nome.trim()) return;

        try {
            setCreatingEtiqueta(true);
            const response = await etiquetasApi.create(newEtiqueta);
            if (response.success) {
                setEtiquetasOptions([...etiquetasOptions, response.data]);
                setNewEtiqueta({ nome: '', cor: '#3B82F6' });
            }
        } catch (error) {
            console.error('Erro ao criar etiqueta:', error);
        } finally {
            setCreatingEtiqueta(false);
        }
    };

    const handleToggleEtiqueta = async (etiquetaId: number) => {
        if (!editingTask) return;

        const isSelected = selectedEtiquetas.some(e => e.id === etiquetaId);

        try {
            if (isSelected) {
                await etiquetasApi.removeFromTarefa(editingTask.id, etiquetaId);
                setSelectedEtiquetas(selectedEtiquetas.filter(e => e.id !== etiquetaId));
            } else {
                await etiquetasApi.addToTarefa(editingTask.id, etiquetaId);
                const etiqueta = etiquetasOptions.find(e => e.id === etiquetaId);
                if (etiqueta) setSelectedEtiquetas([...selectedEtiquetas, etiqueta]);
            }
        } catch (error) {
            console.error('Erro ao vincular/desvincular etiqueta:', error);
        }
    };

    const handleDeleteEtiqueta = async (id: number) => {
        if (!confirm('Excluir esta etiqueta do sistema?')) return;
        try {
            await etiquetasApi.delete(id);
            setEtiquetasOptions(etiquetasOptions.filter(e => e.id !== id));
            setSelectedEtiquetas(selectedEtiquetas.filter(e => e.id !== id));
        } catch (error) {
            console.error('Erro ao excluir etiqueta:', error);
        }
    };

    const handleCreateCompra = async () => {
        if (!editingTask || !newCompra.material.trim() || !newCompra.quantidade) return;

        try {
            setAddingCompra(true);
            const response = await comprasApi.create(editingTask.id, {
                ...newCompra,
                quantidade: parseFloat(newCompra.quantidade.toString().replace(',', '.'))
            });
            if (response.success) {
                setCompras([response.data, ...compras]);
                setNewCompra({ material: '', quantidade: '', unidade: 'un', observacoes: '' });
            }
        } catch (error) {
            console.error('Erro ao criar solicitação de compra:', error);
        } finally {
            setAddingCompra(false);
        }
    };

    const handleDeleteCompra = async (id: number) => {
        if (!confirm('Excluir este item?')) return;
        try {
            await comprasApi.delete(id);
            setCompras(compras.filter(c => c.id !== id));
        } catch (error) {
            console.error('Erro ao excluir compra:', error);
        }
    };

    const handleUpdateCompraStatus = async (id: number, status: string) => {
        try {
            const response = await comprasApi.updateStatus(id, status);
            if (response.success) {
                setCompras(compras.map(c => c.id === id ? response.data : c));
            }
        } catch (error) {
            console.error('Erro ao atualizar status da compra:', error);
        }
    };

    const handleAddChecklistItem = async () => {
        if (!editingTask || !newChecklistItem.trim()) return;

        try {
            setAddingItem(true);
            const response = await checklistsApi.create(editingTask.id, {
                titulo: newChecklistItem.trim(),
                ordem: checklists.length
            });
            if (response.success) {
                setChecklists([...checklists, response.data]);
                setNewChecklistItem('');
            }
        } catch (error) {
            console.error('Erro ao adicionar item:', error);
        } finally {
            setAddingItem(false);
        }
    };

    const handleToggleChecklist = async (item: TarefaChecklist) => {
        try {
            const response = await checklistsApi.update(item.id, {
                concluido: !item.concluido
            });
            if (response.success) {
                setChecklists(checklists.map(i => i.id === item.id ? response.data : i));
            }
        } catch (error) {
            console.error('Erro ao atualizar item:', error);
        }
    };

    const handleDeleteChecklist = async (id: number) => {
        try {
            const response = await checklistsApi.delete(id);
            if (response.success) {
                setChecklists(checklists.filter(i => i.id !== id));
            }
        } catch (error) {
            console.error('Erro ao excluir item:', error);
        }
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!editingTask || !e.target.files?.length) return;

        try {
            setUploading(true);
            const file = e.target.files[0];
            const response = await anexosApi.upload(editingTask.id, file);

            if (response.success) {
                setAnexos([response.data, ...anexos]);
            }
        } catch (error) {
            console.error('Erro ao fazer upload:', error);
            alert('Erro ao fazer upload do arquivo.');
        } finally {
            setUploading(false);
            // Limpar o input
            e.target.value = '';
        }
    };

    const handleDeleteAnexo = async (id: number) => {
        if (!confirm('Excluir este anexo?')) return;

        try {
            const response = await anexosApi.delete(id);
            if (response.success) {
                setAnexos(anexos.filter(a => a.id !== id));
            }
        } catch (error) {
            console.error('Erro ao excluir anexo:', error);
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingTask(null);
        setActiveTab('geral');
        setFormData({
            titulo: '',
            descricao: '',
            prioridade: 'media',
            tipoAtribuicao: 'equipe',
            equipeId: '',
            prestadorId: '',
            dataInicio: '',
            dataFim: '',
            diasSemana: []
        });
        setSelectedEtiquetas([]);
        setAnexos([]);
        setChecklists([]);
        setCompras([]);
    };

    const getPriorityColor = (prioridade: string) => {
        const colors = {
            baixa: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
            media: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
            alta: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
            urgente: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
        };
        return colors[prioridade as keyof typeof colors] || colors.media;
    };

    const getPriorityLabel = (prioridade: string) => {
        const labels = {
            baixa: 'Baixa',
            media: 'Média',
            alta: 'Alta',
            urgente: 'Urgente'
        };
        return labels[prioridade as keyof typeof labels] || prioridade;
    };

    const filteredColumns = columns.map(column => ({
        ...column,
        tasks: column.tasks.filter(task =>
            task.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
            task.descricao?.toLowerCase().includes(searchTerm.toLowerCase())
        )
    }));

    return (
        <div className="p-6 h-[calc(100vh-3.5rem)] flex flex-col">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-medium text-foreground mb-2">Kanban Board</h1>
                <p className="text-muted-foreground">Gerencie as tarefas das obras com drag & drop</p>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <select
                    value={selectedObra || ''}
                    onChange={(e) => setSelectedObra(parseInt(e.target.value))}
                    className="px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                >
                    <option value="">Selecione uma obra</option>
                    {obras.map(obra => (
                        <option key={obra.id} value={obra.id}>{obra.nome}</option>
                    ))}
                </select>

                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar tarefas..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                </div>

                <button
                    onClick={() => setShowModal(true)}
                    disabled={!selectedObra}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Plus size={20} />
                    Nova Tarefa
                </button>
            </div>

            {/* Kanban Board */}
            {loading ? (
                <div className="flex items-center justify-center flex-1">
                    <Loader2 className="animate-spin text-primary" size={32} />
                </div>
            ) : !selectedObra ? (
                <div className="flex items-center justify-center flex-1">
                    <div className="text-center">
                        <LayoutDashboard className="mx-auto text-muted-foreground mb-4" size={48} />
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                            Selecione uma obra
                        </h3>
                        <p className="text-muted-foreground">
                            Escolha uma obra para visualizar suas tarefas
                        </p>
                    </div>
                </div>
            ) : (
                <DragDropContext onDragEnd={handleDragEnd}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 overflow-hidden">
                        {filteredColumns.map((column) => {
                            const Icon = column.icon;
                            return (
                                <div key={column.id} className="flex flex-col bg-accent/30 rounded-xl p-4">
                                    {/* Column Header */}
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className={`p-2 rounded-lg ${column.color}`}>
                                            <Icon className="text-white" size={20} />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-foreground">{column.title}</h3>
                                            <p className="text-sm text-muted-foreground">
                                                {column.tasks.length} {column.tasks.length === 1 ? 'tarefa' : 'tarefas'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Droppable Area */}
                                    <Droppable droppableId={column.id}>
                                        {(provided, snapshot) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.droppableProps}
                                                className={`flex-1 space-y-3 overflow-y-auto pr-2 ${snapshot.isDraggingOver ? 'bg-primary/5 rounded-lg' : ''
                                                    }`}
                                            >
                                                {column.tasks.map((task, index) => (
                                                    <Draggable
                                                        key={task.id}
                                                        draggableId={task.id.toString()}
                                                        index={index}
                                                    >
                                                        {(provided, snapshot) => (
                                                            <div
                                                                ref={provided.innerRef}
                                                                {...provided.draggableProps}
                                                                {...provided.dragHandleProps}
                                                                className={`bg-card border border-border rounded-lg p-4 hover:shadow-lg transition-shadow ${snapshot.isDragging ? 'shadow-xl rotate-2' : ''
                                                                    }`}
                                                            >
                                                                <div className="flex items-start justify-between mb-2">
                                                                    <h4 className="font-medium text-foreground flex-1">
                                                                        {task.titulo}
                                                                    </h4>
                                                                    <div className="flex gap-1">
                                                                        <button
                                                                            onClick={() => handleEdit(task)}
                                                                            className="p-1 hover:bg-accent rounded transition-colors"
                                                                        >
                                                                            <Edit2 size={14} />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleDelete(task.id)}
                                                                            className="p-1 hover:bg-destructive/10 text-destructive rounded transition-colors"
                                                                        >
                                                                            <Trash2 size={14} />
                                                                        </button>
                                                                    </div>
                                                                </div>

                                                                {task.descricao && (
                                                                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                                                                        {task.descricao}
                                                                    </p>
                                                                )}

                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.prioridade)}`}>
                                                                        {getPriorityLabel(task.prioridade)}
                                                                    </span>

                                                                    {task.equipe && task.tipoAtribuicao === 'equipe' && (
                                                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                                            <Users size={12} />
                                                                            <span>{task.equipe.nome}</span>
                                                                        </div>
                                                                    )}

                                                                    {task.prestador && task.tipoAtribuicao === 'prestador' && (
                                                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                                            <Briefcase size={12} />
                                                                            <span>{task.prestador.nome}</span>
                                                                        </div>
                                                                    )}

                                                                    {task.dataFim && (
                                                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                                            <Calendar size={12} />
                                                                            <span>{new Date(task.dataFim).toLocaleDateString('pt-BR')}</span>
                                                                        </div>
                                                                    )}

                                                                    {task.diasSemana && task.diasSemana.length > 0 && (
                                                                        <div className="flex items-center gap-1 text-xs text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded-lg">
                                                                            <Clock size={12} />
                                                                            <span>{task.diasSemana.length} dias</span>
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {/* Etiquetas no Card */}
                                                                {task.etiquetas && task.etiquetas.length > 0 && (
                                                                    <div className="flex flex-wrap gap-1 mt-2">
                                                                        {task.etiquetas.map(tag => (
                                                                            <span
                                                                                key={tag.id}
                                                                                className="px-1.5 py-0.5 rounded text-[10px] font-medium text-white max-w-[100px] truncate"
                                                                                style={{ backgroundColor: tag.cor }}
                                                                                title={tag.nome}
                                                                            >
                                                                                {tag.nome}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </Draggable>
                                                ))}
                                                {provided.placeholder}

                                                {column.tasks.length === 0 && (
                                                    <div className="text-center py-8 text-muted-foreground text-sm">
                                                        Nenhuma tarefa
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </Droppable>
                                </div>
                            );
                        })}
                    </div>
                </DragDropContext>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50">
                    <div className="bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-700 rounded-2xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b-2 border-gray-300 dark:border-gray-700 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
                            <h2 className="text-lg sm:text-xl font-bold text-foreground">
                                {editingTask ? 'Editar Tarefa' : 'Nova Tarefa'}
                            </h2>
                            <button
                                onClick={handleCloseModal}
                                className="p-2 hover:bg-accent rounded-lg transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Sistema de Abas */}
                        <div className="border-b border-border bg-muted/30">
                            <div className="flex overflow-x-auto px-2 sm:px-6 scrollbar-hide">
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('geral')}
                                    className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'geral'
                                        ? 'border-primary text-primary'
                                        : 'border-transparent text-muted-foreground hover:text-foreground'
                                        }`}
                                >
                                    📝 Geral
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('checklist')}
                                    className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'checklist'
                                        ? 'border-primary text-primary'
                                        : 'border-transparent text-muted-foreground hover:text-foreground'
                                        }`}
                                >
                                    ✅ Checklist
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('anexos')}
                                    className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'anexos'
                                        ? 'border-primary text-primary'
                                        : 'border-transparent text-muted-foreground hover:text-foreground'
                                        }`}
                                >
                                    📎 Anexos
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('compras')}
                                    className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'compras'
                                        ? 'border-primary text-primary'
                                        : 'border-transparent text-muted-foreground hover:text-foreground'
                                        }`}
                                >
                                    🛒 Compras
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('ocorrencias')}
                                    className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'ocorrencias'
                                        ? 'border-primary text-primary'
                                        : 'border-transparent text-muted-foreground hover:text-foreground'
                                        }`}
                                >
                                    ⚠️ Ocorrências
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('etiquetas')}
                                    className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'etiquetas'
                                        ? 'border-primary text-primary'
                                        : 'border-transparent text-muted-foreground hover:text-foreground'
                                        }`}
                                >
                                    🏷️ Etiquetas
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
                            {/* ABA GERAL */}
                            {activeTab === 'geral' && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Título *</label>
                                        <input
                                            type="text"
                                            value={formData.titulo}
                                            onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                                            className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                                            placeholder="Ex: Instalação elétrica 1º andar"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">Descrição</label>
                                        <textarea
                                            value={formData.descricao}
                                            onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                                            className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                                            placeholder="Descrição detalhada da tarefa..."
                                            rows={3}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">Prioridade</label>
                                        <select
                                            value={formData.prioridade}
                                            onChange={(e) => setFormData({ ...formData, prioridade: e.target.value })}
                                            className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                                        >
                                            <option value="baixa">Baixa</option>
                                            <option value="media">Média</option>
                                            <option value="alta">Alta</option>
                                            <option value="urgente">Urgente</option>
                                        </select>
                                    </div>

                                    {/* Tipo de Atribuição */}
                                    <div>
                                        <label className="block text-sm font-medium mb-3">Atribuir para *</label>
                                        <div className="flex gap-4 mb-3">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="tipoAtribuicao"
                                                    value="equipe"
                                                    checked={formData.tipoAtribuicao === 'equipe'}
                                                    onChange={(e) => setFormData({ ...formData, tipoAtribuicao: e.target.value as 'equipe' | 'prestador', prestadorId: '' })}
                                                    className="w-4 h-4"
                                                />
                                                <span>Equipe</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="tipoAtribuicao"
                                                    value="prestador"
                                                    checked={formData.tipoAtribuicao === 'prestador'}
                                                    onChange={(e) => setFormData({ ...formData, tipoAtribuicao: e.target.value as 'equipe' | 'prestador', equipeId: '' })}
                                                    className="w-4 h-4"
                                                />
                                                <span>Prestador Individual</span>
                                            </label>
                                        </div>

                                        {formData.tipoAtribuicao === 'equipe' ? (
                                            <select
                                                value={formData.equipeId}
                                                onChange={(e) => setFormData({ ...formData, equipeId: e.target.value })}
                                                className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                                                required
                                            >
                                                <option value="">Selecione uma equipe...</option>
                                                {equipes.map(eq => (
                                                    <option key={eq.id} value={eq.id}>{eq.nome}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <select
                                                value={formData.prestadorId}
                                                onChange={(e) => setFormData({ ...formData, prestadorId: e.target.value })}
                                                className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                                                required
                                            >
                                                <option value="">Selecione um prestador...</option>
                                                {prestadores.map(p => (
                                                    <option key={p.id} value={p.id}>{p.nome} ({p.especialidade})</option>
                                                ))}
                                            </select>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-2">Data de Início</label>
                                            <input
                                                type="date"
                                                value={formData.dataInicio}
                                                onChange={(e) => setFormData({ ...formData, dataInicio: e.target.value })}
                                                className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium mb-2">Data de Término</label>
                                            <input
                                                type="date"
                                                value={formData.dataFim}
                                                onChange={(e) => setFormData({ ...formData, dataFim: e.target.value })}
                                                className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                                            />
                                        </div>
                                    </div>

                                    {/* Cronograma de Execução Dinâmico */}
                                    <div>
                                        <label className="block text-sm font-medium mb-3">Cronograma de Execução</label>
                                        {!formData.dataInicio || !formData.dataFim ? (
                                            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm flex items-center gap-2">
                                                <AlertCircle size={16} />
                                                Selecione as datas de início e término para definir os dias de trabalho.
                                            </div>
                                        ) : (
                                            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-1 custom-scrollbar">
                                                {(() => {
                                                    const start = new Date(formData.dataInicio + 'T12:00:00');
                                                    const end = new Date(formData.dataFim + 'T12:00:00');
                                                    const dates = [];
                                                    const current = new Date(start);

                                                    while (current <= end && dates.length < 60) { // Limite de 60 dias para segurança
                                                        dates.push(new Date(current));
                                                        current.setDate(current.getDate() + 1);
                                                    }

                                                    return dates.map((date) => {
                                                        const dateStr = date.toISOString().split('T')[0];
                                                        const isSelected = formData.diasSemana.includes(dateStr);
                                                        const diaSemanaLabel = date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
                                                        const diaNumero = date.getDate().toString().padStart(2, '0');

                                                        return (
                                                            <button
                                                                key={dateStr}
                                                                type="button"
                                                                onClick={() => {
                                                                    if (isSelected) {
                                                                        setFormData({
                                                                            ...formData,
                                                                            diasSemana: formData.diasSemana.filter(d => d !== dateStr)
                                                                        });
                                                                    } else {
                                                                        setFormData({
                                                                            ...formData,
                                                                            diasSemana: [...formData.diasSemana, dateStr]
                                                                        });
                                                                    }
                                                                }}
                                                                className={`h-16 w-14 flex flex-col items-center justify-center border-2 rounded-2xl transition-all duration-300 transform ${isSelected
                                                                    ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/30 -translate-y-1 scale-105'
                                                                    : 'bg-background border-slate-200 text-slate-500 hover:border-blue-300 hover:bg-blue-50/50 hover:text-blue-600'
                                                                    }`}
                                                            >
                                                                <span className="text-[10px] uppercase font-bold opacity-80">{diaSemanaLabel}</span>
                                                                <span className="text-lg font-black leading-tight">{diaNumero}</span>
                                                                {isSelected && <div className="w-1 h-1 bg-white rounded-full mt-0.5 animate-pulse" />}
                                                            </button>
                                                        );
                                                    });
                                                })()}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* ABA CHECKLIST */}
                            {activeTab === 'checklist' && (
                                <div className="space-y-6">
                                    {!editingTask ? (
                                        <div className="text-center py-12 text-muted-foreground bg-accent/20 rounded-2xl border-2 border-dashed border-accent">
                                            <AlertCircle className="mx-auto mb-4" size={48} />
                                            <p className="text-lg font-medium">Salve a tarefa primeiro</p>
                                            <p className="text-sm mt-2">VocÃª precisa criar a tarefa antes de adicionar itens ao checklist.</p>
                                        </div>
                                    ) : (
                                        <>
                                            {/* Progress Bar */}
                                            {checklists.length > 0 && (
                                                <div className="space-y-2">
                                                    <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                                        <span>Progresso da Tarefa</span>
                                                        <span>{Math.round((checklists.filter(i => i.concluido).length / checklists.length) * 100)}%</span>
                                                    </div>
                                                    <div className="h-3 bg-accent rounded-full overflow-hidden border border-border/50">
                                                        <div
                                                            className="h-full bg-blue-600 transition-all duration-500 shadow-[0_0_10px_rgba(37,99,235,0.5)]"
                                                            style={{ width: `${(checklists.filter(i => i.concluido).length / checklists.length) * 100}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {/* Add Item */}
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={newChecklistItem}
                                                    onChange={(e) => setNewChecklistItem(e.target.value)}
                                                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddChecklistItem())}
                                                    placeholder="Adicionar novo item ao checklist..."
                                                    className="flex-1 px-4 py-3 bg-background border-2 border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors font-medium"
                                                />
                                                <button
                                                    type="button"
                                                    disabled={addingItem || !newChecklistItem.trim()}
                                                    onClick={handleAddChecklistItem}
                                                    className="px-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center"
                                                >
                                                    {addingItem ? <Loader2 size={18} className="animate-spin" /> : <Plus size={20} />}
                                                </button>
                                            </div>

                                            {/* List */}
                                            <div className="space-y-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                                                {checklists.length === 0 ? (
                                                    <div className="text-center py-10 text-muted-foreground border-2 border-dashed border-slate-100 rounded-2xl">
                                                        <Plus className="mx-auto mb-2 opacity-20" size={32} />
                                                        <p className="text-sm">Nenhum item adicionado ainda.</p>
                                                    </div>
                                                ) : (
                                                    checklists.map((item) => (
                                                        <div
                                                            key={item.id}
                                                            className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all hover:shadow-sm ${item.concluido
                                                                ? 'bg-emerald-50/30 border-emerald-100 shadow-none'
                                                                : 'bg-card border-slate-100 hover:border-blue-100'
                                                                }`}
                                                        >
                                                            <button
                                                                type="button"
                                                                onClick={() => handleToggleChecklist(item)}
                                                                className={`w-6 h-6 flex items-center justify-center rounded-lg border-2 transition-all ${item.concluido
                                                                    ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm'
                                                                    : 'bg-background border-slate-300 hover:border-blue-500'
                                                                    }`}
                                                            >
                                                                {item.concluido && <CheckCircle2 size={14} />}
                                                            </button>
                                                            <span className={`flex-1 text-sm font-medium transition-all ${item.concluido ? 'text-emerald-700/60 line-through' : 'text-slate-700'}`}>
                                                                {item.titulo}
                                                            </span>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDeleteChecklist(item.id)}
                                                                className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}

                            {/* ABA ANEXOS */}
                            {activeTab === 'anexos' && (
                                <div className="space-y-6">
                                    {!editingTask ? (
                                        <div className="text-center py-12 text-muted-foreground bg-accent/20 rounded-2xl border-2 border-dashed border-accent">
                                            <AlertCircle className="mx-auto mb-4" size={48} />
                                            <p className="text-lg font-medium">Salve a tarefa primeiro</p>
                                            <p className="text-sm mt-2">VocÃª precisa criar a tarefa antes de adicionar anexos.</p>
                                        </div>
                                    ) : (
                                        <>
                                            {/* Upload Area */}
                                            <div className="relative">
                                                <input
                                                    type="file"
                                                    onChange={handleUpload}
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                    disabled={uploading}
                                                />
                                                <div className={`border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-8 text-center transition-colors hover:bg-accent/5 hover:border-primary ${uploading ? 'opacity-50' : ''}`}>
                                                    {uploading ? (
                                                        <Loader2 className="mx-auto mb-3 animate-spin text-primary" size={40} />
                                                    ) : (
                                                        <Upload className="mx-auto mb-3 text-muted-foreground" size={40} />
                                                    )}
                                                    <h3 className="text-lg font-medium mb-1">
                                                        {uploading ? 'Enviando...' : 'Clique ou arraste arquivos aqui'}
                                                    </h3>
                                                    <p className="text-sm text-muted-foreground">
                                                        Suporta imagens, documentos e vÃ­deos (max 10MB)
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Lista de Anexos */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                                                {anexos.map((anexo) => (
                                                    <div key={anexo.id} className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl group hover:shadow-md transition-all">
                                                        <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
                                                            {anexo.tipo === 'foto' ? (
                                                                <Image size={20} className="text-blue-600 dark:text-blue-400" />
                                                            ) : anexo.tipo === 'video' ? (
                                                                <Video size={20} className="text-purple-600 dark:text-purple-400" />
                                                            ) : (
                                                                <FileText size={20} className="text-slate-600 dark:text-slate-400" />
                                                            )}
                                                        </div>

                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium truncate" title={anexo.nomeArquivo}>
                                                                {anexo.nomeArquivo}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {(anexo.tamanho ? (anexo.tamanho / 1024 / 1024).toFixed(2) : '0')} MB â€¢ {new Date(anexo.createdAt).toLocaleDateString()}
                                                            </p>
                                                        </div>

                                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <a
                                                                href={`http://localhost:3001${anexo.url}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="p-1.5 hover:bg-accent rounded-lg text-muted-foreground hover:text-primary transition-colors"
                                                                title="Download / Visualizar"
                                                            >
                                                                <Download size={16} />
                                                            </a>
                                                            <button
                                                                onClick={() => handleDeleteAnexo(anexo.id)}
                                                                className="p-1.5 hover:bg-rose-50 rounded-lg text-muted-foreground hover:text-rose-600 transition-colors"
                                                                title="Excluir"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}

                                                {anexos.length === 0 && !uploading && (
                                                    <div className="col-span-full text-center py-8 text-muted-foreground text-sm">
                                                        Nenhum anexo adicionado ainda.
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}

                            {/* ABA COMPRAS */}
                            {activeTab === 'compras' && (
                                <div className="space-y-6">
                                    {!editingTask ? (
                                        <div className="text-center py-12 text-muted-foreground bg-accent/20 rounded-2xl border-2 border-dashed border-accent">
                                            <ShoppingCart className="mx-auto mb-4" size={48} />
                                            <p className="text-lg font-medium">Salve a tarefa primeiro</p>
                                            <p className="text-sm mt-2">Você precisa criar a tarefa antes de solicitar materiais.</p>
                                        </div>
                                    ) : (
                                        <>
                                            {/* Formulário de Adição */}
                                            <div className="bg-muted/30 p-4 rounded-xl border border-border">
                                                <h3 className="text-sm font-medium mb-3">Solicitar Material</h3>
                                                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                                                    <div className="md:col-span-5">
                                                        <div className="relative">
                                                            <input
                                                                type="text"
                                                                placeholder="Nome do material (ex: Cimento CP-II)"
                                                                value={newCompra.material}
                                                                onChange={(e) => {
                                                                    const val = e.target.value;
                                                                    setNewCompra({ ...newCompra, material: val });

                                                                    // Debounce logic for search
                                                                    if (val.length > 2) {
                                                                        const timeoutId = setTimeout(async () => {
                                                                            try {
                                                                                const res = await produtosApi.search(val);
                                                                                if (res.success) setProductSuggestions(res.data);
                                                                            } catch (err) {
                                                                                console.error(err);
                                                                            }
                                                                        }, 300);
                                                                        return () => clearTimeout(timeoutId);
                                                                    } else {
                                                                        setProductSuggestions([]);
                                                                    }
                                                                }}
                                                                className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                                                                autoComplete="off"
                                                            />
                                                            {productSuggestions.length > 0 && (
                                                                <div className="absolute z-10 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-auto">
                                                                    {productSuggestions.map((prod) => (
                                                                        <button
                                                                            key={prod.id}
                                                                            type="button"
                                                                            className="w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors flex justify-between"
                                                                            onClick={() => {
                                                                                setNewCompra({
                                                                                    ...newCompra,
                                                                                    material: prod.nome,
                                                                                    unidade: prod.unidade || newCompra.unidade
                                                                                });
                                                                                setProductSuggestions([]);
                                                                            }}
                                                                        >
                                                                            <span>{prod.nome}</span>
                                                                            {prod.unidade && <span className="text-xs text-muted-foreground">{prod.unidade}</span>}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="md:col-span-2">
                                                        <input
                                                            type="number"
                                                            placeholder="Qtd"
                                                            value={newCompra.quantidade}
                                                            onChange={(e) => setNewCompra({ ...newCompra, quantidade: e.target.value })}
                                                            className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                                                        />
                                                    </div>
                                                    <div className="md:col-span-2">
                                                        <input
                                                            type="text"
                                                            placeholder="Un (m, kg)"
                                                            value={newCompra.unidade}
                                                            onChange={(e) => setNewCompra({ ...newCompra, unidade: e.target.value })}
                                                            className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                                                        />
                                                    </div>
                                                    <div className="md:col-span-3">
                                                        <button
                                                            type="button"
                                                            onClick={handleCreateCompra}
                                                            disabled={!newCompra.material || !newCompra.quantidade || addingCompra}
                                                            className="w-full h-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
                                                        >
                                                            {addingCompra ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
                                                            Adicionar
                                                        </button>
                                                    </div>
                                                    <div className="col-span-full">
                                                        <textarea
                                                            placeholder="Observações (opcional)"
                                                            value={newCompra.observacoes}
                                                            onChange={(e) => setNewCompra({ ...newCompra, observacoes: e.target.value })}
                                                            rows={2}
                                                            className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Lista de Materiais */}
                                            <div className="space-y-3">
                                                {compras.length === 0 ? (
                                                    <div className="text-center py-8 text-muted-foreground text-sm">
                                                        Nenhum material solicitado.
                                                    </div>
                                                ) : (
                                                    compras.map((item) => (
                                                        <div key={item.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 bg-card border border-border rounded-xl">
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-medium text-foreground">{item.material}</span>
                                                                    <span className="text-xs text-muted-foreground bg-accent px-2 py-0.5 rounded-full">
                                                                        {item.quantidade} {item.unidade}
                                                                    </span>
                                                                </div>
                                                                {item.observacoes && (
                                                                    <p className="text-xs text-muted-foreground mt-1">{item.observacoes}</p>
                                                                )}
                                                                <p className="text-[10px] text-muted-foreground mt-1">
                                                                    Solicitado em {new Date(item.createdAt).toLocaleDateString()}
                                                                </p>
                                                            </div>

                                                            <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                                                                <select
                                                                    value={item.status}
                                                                    onChange={(e) => handleUpdateCompraStatus(item.id, e.target.value)}
                                                                    className={`px-2 py-1 h-8 rounded-lg text-xs font-medium border-none focus:ring-0 cursor-pointer ${item.status === 'pendente' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                                                        item.status === 'aprovado' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                                                                            'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                                        }`}
                                                                >
                                                                    <option value="pendente">Pendente</option>
                                                                    <option value="aprovado">Aprovado</option>
                                                                    <option value="comprado">Comprado</option>
                                                                </select>

                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleDeleteCompra(item.id)}
                                                                    className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors ml-auto sm:ml-0"
                                                                    title="Excluir"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}

                            {/* ABA OCORRÃŠNCIAS */}
                            {activeTab === 'ocorrencias' && (
                                <div className="text-center py-12 text-muted-foreground">
                                    <AlertCircle className="mx-auto mb-4" size={64} />
                                    <p className="text-lg font-medium">Ocorrências</p>
                                    <p className="text-sm mt-2">Funcionalidade em desenvolvimento</p>
                                </div>
                            )}

                            {/* ABA ETIQUETAS */}
                            {activeTab === 'etiquetas' && (
                                <div className="space-y-6">
                                    {!editingTask ? (
                                        <div className="text-center py-12 text-muted-foreground bg-accent/20 rounded-2xl border-2 border-dashed border-accent">
                                            <Tag className="mx-auto mb-4" size={48} />
                                            <p className="text-lg font-medium">Salve a tarefa primeiro</p>
                                            <p className="text-sm mt-2">VocÃª precisa criar a tarefa antes de gerenciar etiquetas.</p>
                                        </div>
                                    ) : (
                                        <>
                                            {/* Criar Nova Etiqueta */}
                                            <div className="bg-muted/30 p-4 rounded-xl border border-border">
                                                <h3 className="text-sm font-medium mb-3">Criar Nova Etiqueta</h3>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        placeholder="Nome da etiqueta"
                                                        value={newEtiqueta.nome}
                                                        onChange={(e) => setNewEtiqueta({ ...newEtiqueta, nome: e.target.value })}
                                                        className="flex-1 px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                                                    />
                                                    <input
                                                        type="color"
                                                        value={newEtiqueta.cor}
                                                        onChange={(e) => setNewEtiqueta({ ...newEtiqueta, cor: e.target.value })}
                                                        className="w-10 h-10 p-1 bg-background border border-input rounded-lg cursor-pointer"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={handleCreateEtiqueta}
                                                        disabled={!newEtiqueta.nome.trim() || creatingEtiqueta}
                                                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
                                                    >
                                                        {creatingEtiqueta ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20} />}
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Listar Etiquetas */}
                                            <div>
                                                <h3 className="text-sm font-medium mb-3">Etiquetas DisponÃ­veis</h3>
                                                <div className="space-y-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                                                    {etiquetasOptions.length === 0 ? (
                                                        <p className="text-sm text-muted-foreground">Nenhuma etiqueta criada.</p>
                                                    ) : (
                                                        etiquetasOptions.map(tag => {
                                                            const isSelected = selectedEtiquetas.some(e => e.id === tag.id);
                                                            return (
                                                                <div key={tag.id} className="flex items-center justify-between p-2 bg-card border border-border rounded-lg hover:bg-accent/50 transition-colors">
                                                                    <div className="flex items-center gap-3">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleToggleEtiqueta(tag.id)}
                                                                            className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isSelected
                                                                                ? 'bg-primary border-primary text-primary-foreground'
                                                                                : 'border-slate-300'
                                                                                }`}
                                                                        >
                                                                            {isSelected && <CheckCircle2 size={14} />}
                                                                        </button>
                                                                        <div
                                                                            className="px-2 py-0.5 rounded text-xs text-white font-medium"
                                                                            style={{ backgroundColor: tag.cor }}
                                                                        >
                                                                            {tag.nome}
                                                                        </div>
                                                                    </div>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleDeleteEtiqueta(tag.id)}
                                                                        className="text-muted-foreground hover:text-destructive p-1"
                                                                        title="Excluir etiqueta do sistema"
                                                                    >
                                                                        <Trash2 size={16} />
                                                                    </button>
                                                                </div>
                                                            );
                                                        })
                                                    )}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}

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
                                    disabled={saving}
                                    className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {saving && <Loader2 size={18} className="animate-spin" />}
                                    {editingTask ? 'Salvar Alterações' : 'Criar Tarefa'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
