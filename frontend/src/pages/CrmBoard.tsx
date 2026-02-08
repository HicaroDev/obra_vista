import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { toast } from 'sonner';
import { crmApi } from '../lib/api';
import type { CrmDeal } from '../types';
import { PiPlus, PiSpinner, PiMoney, PiUser, PiBuilding } from 'react-icons/pi';
import { cn } from '../utils/cn';
import { NewDealModal } from '../components/crm/NewDealModal';
import { useNavigate } from 'react-router-dom';

const COLUMNS = [
    { id: 'prospeccao', title: 'Prospecção', color: 'bg-blue-100 text-blue-700' },
    { id: 'qualificacao', title: 'Qualificação', color: 'bg-indigo-100 text-indigo-700' },
    { id: 'proposta', title: 'Proposta Enviada', color: 'bg-yellow-100 text-yellow-700' },
    { id: 'negociacao', title: 'Negociação', color: 'bg-orange-100 text-orange-700' },
    { id: 'ganho', title: 'Fechado (Ganho)', color: 'bg-green-100 text-green-700' },
    { id: 'perdido', title: 'Perdido / Descartado', color: 'bg-red-100 text-red-700' }
];

export function CrmBoard() {
    const [deals, setDeals] = useState<CrmDeal[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any>(null);

    useEffect(() => {
        loadDeals();
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const res = await crmApi.stats.get();
            if (res.success) setStats(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    const loadDeals = async () => {
        try {
            const response = await crmApi.deals.getAll();
            if (response.success) {
                setDeals(response.data);
            }
        } catch (error) {
            console.error(error);
            toast.error('Erro ao carregar oportunidades');
        } finally {
            setLoading(false);
        }
    };

    const onDragEnd = async (result: DropResult) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;
        if (
            destination.droppableId === source.droppableId &&
            destination.index === source.index
        ) {
            return;
        }

        const dealId = Number(draggableId);
        const newStage = destination.droppableId;

        // Otimista: atualizar state local antes
        const updatedDeals = deals.map(deal =>
            deal.id === dealId ? { ...deal, estagio: newStage as any } : deal
        );
        setDeals(updatedDeals);

        try {
            if (newStage === 'ganho') {
                const confirmed = window.confirm("Deseja fechar este negócio como GANHO? Isso criará uma obra ativa automaticamente.");
                if (!confirmed) {
                    loadDeals(); // Revert
                    return;
                }
                await crmApi.deals.win(dealId);
                toast.success('Parabéns! Negócio ganho.');
                loadStats();
            } else if (newStage === 'perdido') {
                const motivo = window.prompt("Informe o motivo da perda:");
                if (motivo === null) {
                    loadDeals(); // Revert
                    return;
                }
                await crmApi.deals.lose(dealId, { motivo });
                toast.success('Negócio marcado como perdido.');
                loadStats();
            } else {
                await crmApi.deals.updateStage(dealId, newStage);
                loadStats();
            }
            loadDeals(); // Refresh to ensure everything is synced (especially after win/lose)
        } catch (error) {
            console.error(error);
            toast.error('Erro ao atualizar estágio');
            loadDeals(); // Revert
        }
    };

    const getDealsByStage = (stage: string) => {
        return deals.filter(deal => deal.estagio === stage);
    };

    const navigate = useNavigate();
    const money = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    const [isNewDealModalOpen, setIsNewDealModalOpen] = useState(false);

    const handleDealClick = (dealId: number) => {
        navigate(`/crm/${dealId}`);
    };

    if (loading) {
        return <div className="flex justify-center p-12"><PiSpinner className="animate-spin" size={32} /></div>;
    }

    return (
        <div className="flex flex-col h-full bg-gray-50 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 bg-white border-b border-gray-200 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-600 text-white rounded-lg shadow-lg shadow-blue-100">
                        <PiMoney size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-800">Pipeline de Vendas</h1>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Gestão Comercial Pro</p>
                    </div>
                </div>
                <button
                    onClick={() => setIsNewDealModalOpen(true)}
                    className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 text-sm"
                >
                    <PiPlus /> NOVO NEGÓCIO
                </button>
            </div>

            {/* Dashboard Mini */}
            {stats && (
                <div className="px-6 py-4 grid grid-cols-2 md:grid-cols-4 gap-4 bg-white border-b border-gray-100 shrink-0">
                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Total no Funil</p>
                        <p className="text-xl font-black text-blue-600">{money(stats.valor_total_pipeline)}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Em Negociação</p>
                        <p className="text-xl font-black text-orange-600">{money(stats.valor_em_negociacao)}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Taxa de Conversão</p>
                        <p className="text-xl font-black text-emerald-600">{stats.total > 0 ? ((stats.ganhos / stats.total) * 100).toFixed(1) : 0}%</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Vendas Perdidas</p>
                        <p className="text-xl font-black text-red-600">{stats.perdidos}</p>
                    </div>
                </div>
            )}

            {/* Board */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden">
                <DragDropContext onDragEnd={onDragEnd}>
                    <div className="flex h-full p-6 gap-4 min-w-max">
                        {COLUMNS.map(column => (
                            <Droppable key={column.id} droppableId={column.id}>
                                {(provided, snapshot) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}
                                        className={cn(
                                            "w-80 flex flex-col bg-gray-100/50 rounded-xl border border-gray-200/60 max-h-full",
                                            snapshot.isDraggingOver ? "bg-blue-50 border-blue-200" : ""
                                        )}
                                    >
                                        {/* Column Header */}
                                        <div className="p-3 border-b border-gray-200 flex justify-between items-center bg-white/50 rounded-t-xl backdrop-blur-sm sticky top-0 z-10">
                                            <div className="flex items-center gap-2">
                                                <span className={cn("px-2 py-0.5 rounded text-xs font-bold uppercase", column.color)}>
                                                    {getDealsByStage(column.id).length}
                                                </span>
                                                <h3 className="font-semibold text-gray-700 text-sm">{column.title}</h3>
                                            </div>
                                        </div>

                                        {/* Cards Container */}
                                        <div className="p-2 flex-1 overflow-y-auto space-y-2 custom-scrollbar">
                                            {getDealsByStage(column.id).map((deal, index) => (
                                                <Draggable key={deal.id} draggableId={String(deal.id)} index={index}>
                                                    {(provided, snapshot) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                            onClick={() => handleDealClick(deal.id)}
                                                            className={cn(
                                                                "bg-white p-3 rounded-lg shadow-sm border border-gray-200 group hover:shadow-md transition-all cursor-pointer",
                                                                snapshot.isDragging ? "shadow-lg ring-2 ring-blue-500 rotate-2" : ""
                                                            )}
                                                            style={provided.draggableProps.style}
                                                        >
                                                            <div className="flex justify-between items-start mb-2">
                                                                <span className="text-xs font-medium text-gray-400">#{deal.id}</span>
                                                                {deal.probabilidade !== undefined && (
                                                                    <span className={cn(
                                                                        "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                                                                        deal.probabilidade > 70 ? "bg-green-100 text-green-700" :
                                                                            deal.probabilidade > 40 ? "bg-yellow-100 text-yellow-700" :
                                                                                "bg-gray-100 text-gray-600"
                                                                    )}>
                                                                        {deal.probabilidade}%
                                                                    </span>
                                                                )}
                                                            </div>

                                                            <h4 className="font-semibold text-gray-800 mb-1 leading-snug">{deal.titulo}</h4>

                                                            <div className="space-y-1.5 mt-3">
                                                                {deal.lead && (
                                                                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                                                        <PiUser className="shrink-0" />
                                                                        <span className="truncate">{deal.lead.nome} {deal.lead.empresa ? `(${deal.lead.empresa})` : ''}</span>
                                                                    </div>
                                                                )}
                                                                <div className="flex items-center gap-1.5 text-xs font-medium text-gray-700">
                                                                    <PiMoney className="text-green-600 shrink-0" />
                                                                    <span>{deal.valorEstimado ? money(Number(deal.valorEstimado)) : '-'}</span>
                                                                </div>
                                                                {deal.obra && (
                                                                    <div className="flex items-center gap-1.5 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded w-fit">
                                                                        <PiBuilding className="shrink-0" />
                                                                        <span className="truncate max-w-[180px]">{deal.obra.nome}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </Draggable>
                                            ))}
                                            {provided.placeholder}
                                        </div>
                                    </div>
                                )}
                            </Droppable>
                        ))}
                    </div>
                </DragDropContext>

                <NewDealModal
                    open={isNewDealModalOpen}
                    onClose={() => setIsNewDealModalOpen(false)}
                    onSuccess={loadDeals}
                />
            </div>
        </div>
    );
}
