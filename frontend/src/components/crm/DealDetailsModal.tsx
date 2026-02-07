
import { useState, useEffect } from 'react';
import { crmApi, orcamentoApi } from '../../lib/api';
import { toast } from 'sonner';
import { PiChatCenteredText, PiPhone, PiEnvelope, PiUsers, PiClock, PiDownload, PiFilePdf, PiSpinner, PiX } from 'react-icons/pi';
import { cn } from '../../utils/cn';

interface DealDetailsModalProps {
    dealId: number | null;
    open: boolean;
    onClose: () => void;
}

export function DealDetailsModal({ dealId, open, onClose }: DealDetailsModalProps) {
    const [deal, setDeal] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [propostas, setPropostas] = useState<any[]>([]);

    // Form de geração
    const [observacoes, setObservacoes] = useState('');
    const [validade, setValidade] = useState('');
    const [multiplier, setMultiplier] = useState(1);
    const [isSavingTemplate, setIsSavingTemplate] = useState(false);
    const [isWinning, setIsWinning] = useState(false);
    const [isLosing, setIsLosing] = useState(false);
    const [templates, setTemplates] = useState<any[]>([]);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
    const [isApplyingTemplate, setIsApplyingTemplate] = useState(false);

    const [activeTab, setActiveTab] = useState<'info' | 'builder' | 'history' | 'vistoria'>('info');

    // Estado da Vistoria
    const [perguntas, setPerguntas] = useState<any[]>([]);
    const [respostas, setRespostas] = useState<any>({});
    const [loadingVistoria, setLoadingVistoria] = useState(false);
    const [isSavingVistoria, setIsSavingVistoria] = useState(false);

    // Estado para nova interação
    const [interactionType, setInteractionType] = useState('nota');
    const [interactionDesc, setInteractionDesc] = useState('');
    const [isSavingInteraction, setIsSavingInteraction] = useState(false);

    // Estado para criação rápida de obra no modal
    const [showObraForm, setShowObraForm] = useState(false);
    const [obraNome, setObraNome] = useState('');
    const [obraEndereco, setObraEndereco] = useState('');
    const [isCreatingObra, setIsCreatingObra] = useState(false);

    useEffect(() => {
        if (open && dealId) {
            loadDealDetails();
            loadTemplates();
            loadPerguntas();
            loadVistoria();
            setActiveTab('info'); // Reset tab on open
        }
    }, [open, dealId]);

    const loadDealDetails = async () => {
        if (!dealId) return;
        setLoading(true);
        try {
            const [dealRes, propostasRes] = await Promise.all([
                crmApi.deals.getById(dealId),
                crmApi.propostas.getByDeal(dealId)
            ]);

            if (dealRes.success) setDeal(dealRes.data);
            if (propostasRes.success) setPropostas(propostasRes.data);
        } catch (error) {
            console.error(error);
            toast.error('Erro ao carregar detalhes do negócio');
        } finally {
            setLoading(false);
        }
    };

    const loadTemplates = async () => {
        try {
            const res = await orcamentoApi.getTemplates();
            if (res.success) setTemplates(res.data);
        } catch (error) {
            console.error('Erro ao carregar templates:', error);
        }
    };

    const loadPerguntas = async () => {
        try {
            const res = await crmApi.vistoria.getPerguntas();
            if (res.success) setPerguntas(res.data);
        } catch (error) {
            console.error('Erro ao carregar perguntas:', error);
        }
    };

    const loadVistoria = async () => {
        if (!dealId) return;
        setLoadingVistoria(true);
        try {
            const res = await crmApi.vistoria.getByDeal(dealId);
            if (res.success && res.data) {
                setRespostas(res.data.respostas || {});
            } else {
                setRespostas({});
            }
        } catch (error) {
            console.error('Erro ao carregar vistoria:', error);
        } finally {
            setLoadingVistoria(false);
        }
    };

    const handleSaveVistoria = async () => {
        if (!dealId) return;
        setIsSavingVistoria(true);
        try {
            const res = await crmApi.vistoria.save({ dealId, respostas });
            if (res.success) {
                toast.success('Vistoria técnica salva!');
                loadDealDetails(); // Atualizar timeline
            }
        } catch (error) {
            console.error('Erro ao salvar vistoria:', error);
            toast.error('Erro ao salvar vistoria');
        } finally {
            setIsSavingVistoria(false);
        }
    };

    const handleApplyTemplate = async () => {
        if (!deal?.obraId || !selectedTemplateId) {
            toast.error('Selecione um template e garanta que haja uma obra vinculada.');
            return;
        }

        setIsApplyingTemplate(true);
        try {
            const response = await orcamentoApi.createFromTemplate({
                obraId: deal.obraId,
                templateId: parseInt(selectedTemplateId)
            });

            if (response.success) {
                toast.success('Orçamento gerado com sucesso!');
                loadDealDetails(); // Recarregar para mostrar os itens agora
            }
        } catch (error) {
            console.error('Erro ao aplicar template:', error);
            toast.error('Erro ao aplicar template');
        } finally {
            setIsApplyingTemplate(false);
        }
    };

    const handleGenerateProposal = async () => {
        if (!deal) return;

        if (!deal.obraId) {
            toast.error('Este negócio não está vinculado a uma obra/orçamento.');
            return;
        }

        setGenerating(true);
        try {
            const response = await crmApi.propostas.create({
                dealId: deal.id,
                valor: deal.valorEstimado * multiplier,
                observacoes,
                validade: validade || undefined,
                multiplier
            });

            if (response.success) {
                toast.success('Proposta gerada com sucesso!');
                setPropostas([response.data, ...propostas]);
                setActiveTab('history');
                // Opcional: abrir PDF direto
                window.open(`${import.meta.env.VITE_API_URL}${response.data.arquivoUrl}`, '_blank');
            }
        } catch (error) {
            console.error(error);
            toast.error('Erro ao gerar proposta');
        } finally {
            setGenerating(false);
        }
    };

    const handleSaveTemplate = async () => {
        const orcamento = deal.obra?.orcamento_detalhado?.find((o: any) => !o.isTemplate) || deal.obra?.orcamento_detalhado?.[0];

        if (!orcamento?.id) {
            toast.error('Não há orçamento para salvar como template');
            return;
        }

        setIsSavingTemplate(true);
        try {
            const response = await orcamentoApi.saveAsTemplate({
                orcamentoId: orcamento.id,
                nome: `Template: ${deal.titulo}`
            });

            if (response.success) {
                toast.success('Orçamento salvo como template com sucesso!');
            }
        } catch (error) {
            console.error('Erro ao salvar template:', error);
            toast.error('Erro ao salvar template');
        } finally {
            setIsSavingTemplate(false);
        }
    };

    const handleWinDeal = async () => {
        if (!deal) return;

        const confirmResult = window.confirm(`Parabéns! Confirmar o fechamento do negócio "${deal.titulo}"? Isso transformará este projeto em uma obra ativa.`);
        if (!confirmResult) return;

        setIsWinning(true);
        try {
            const response = await crmApi.deals.win(deal.id);
            if (response.success) {
                toast.success('Venda concluída! O projeto agora está na área operacional.');
                loadDealDetails(); // Recarregar para mostrar status atualizado
            }
        } catch (error) {
            console.error('Erro ao fechar negócio:', error);
            toast.error('Erro ao fechar negócio');
        } finally {
            setIsWinning(false);
        }
    };

    const handleLoseDeal = async () => {
        if (!deal) return;

        const motivo = window.prompt(`Informe o motivo da perda do negócio "${deal.titulo}":`);
        if (motivo === null) return; // Cancelado

        setIsLosing(true);
        try {
            const response = await crmApi.deals.lose(deal.id, { motivo });
            if (response.success) {
                toast.success('Negócio marcado como perdido.');
                loadDealDetails();
            }
        } catch (error) {
            console.error('Erro ao perder negócio:', error);
            toast.error('Erro ao registrar perda');
        } finally {
            setIsLosing(false);
        }
    };

    const handleCreateInteraction = async () => {
        if (!dealId || !interactionDesc.trim()) return;

        setIsSavingInteraction(true);
        try {
            const response = await crmApi.interacoes.create({
                dealId: dealId,
                tipo: interactionType,
                descricao: interactionDesc,
            });

            if (response.success) {
                toast.success('Interação registrada!');
                setInteractionDesc('');
                loadDealDetails(); // Recarregar para atualizar a timeline
            }
        } catch (error) {
            console.error('Erro ao salvar interação:', error);
            toast.error('Erro ao salvar interação');
        } finally {
            setIsSavingInteraction(false);
        }
    };

    const handleCreateDraftObra = async () => {
        if (!deal || !obraNome || !obraEndereco) return;
        setIsCreatingObra(true);
        try {
            const res = await (obrasApi.create({
                nome: obraNome,
                endereco: obraEndereco,
                status: 'orcamento'
            }) as Promise<any>);

            if (res.success) {
                // Vincular obra ao deal
                await crmApi.deals.update(deal.id, { obraId: res.data.id });
                toast.success('Local da obra registrado!');
                setShowObraForm(false);
                loadDealDetails();
            }
        } catch (error) {
            console.error(error);
            toast.error('Erro ao registrar local');
        } finally {
            setIsCreatingObra(false);
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">
                {/* Header Premium */}
                <div className="flex justify-between items-start p-6 bg-gradient-to-r from-blue-600 to-indigo-700 text-white shrink-0">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="bg-blue-400/30 text-xs font-bold px-2 py-0.5 rounded-full border border-white/20">NEGÓCIO #{dealId}</span>
                            <h2 className="text-2xl font-bold">{deal?.titulo || 'Carregando...'}</h2>
                        </div>
                        <p className="text-blue-100 text-sm opacity-90">Gestão de Propostas e CRM Comercial</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/20 rounded-xl transition-all text-white/80 hover:text-white"
                    >
                        <PiX size={24} />
                    </button>
                </div>

                {/* Tabs Navigation */}
                <div className="flex border-b border-gray-100 bg-gray-50/50 px-6 shrink-0">
                    <button
                        onClick={() => setActiveTab('info')}
                        className={cn("px-6 py-3 text-sm font-semibold transition-all border-b-2", activeTab === 'info' ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700")}
                    >
                        Visão Geral
                    </button>
                    <button
                        onClick={() => setActiveTab('builder')}
                        className={cn("px-6 py-3 text-sm font-semibold transition-all border-b-2", activeTab === 'builder' ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700")}
                    >
                        Criador de Proposta
                    </button>
                    <button
                        onClick={() => setActiveTab('vistoria')}
                        className={cn("px-6 py-3 text-sm font-semibold transition-all border-b-2", activeTab === 'vistoria' ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700")}
                    >
                        Vistoria Técnica
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={cn("px-6 py-3 text-sm font-semibold transition-all border-b-2 flex items-center gap-2", activeTab === 'history' ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700")}
                    >
                        Histórico
                        <span className="bg-gray-200 text-gray-600 text-[10px] px-1.5 py-0.5 rounded-full">{propostas.length}</span>
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <PiSpinner className="animate-spin text-blue-600" size={48} />
                            <p className="text-gray-500 font-medium animate-pulse">Sincronizando dados comerciais...</p>
                        </div>
                    ) : deal ? (
                        <div className="space-y-8">

                            {activeTab === 'vistoria' && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-800">Checklist de Vistoria</h3>
                                            <p className="text-sm text-gray-500">Responda os itens abaixo para parametrizar o orçamento.</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={handleSaveVistoria}
                                                disabled={isSavingVistoria}
                                                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 disabled:opacity-50"
                                            >
                                                {isSavingVistoria ? <PiSpinner className="animate-spin" /> : 'SALVAR VISTORIA'}
                                            </button>
                                            {Object.keys(respostas).length > 0 && (
                                                <button
                                                    onClick={() => setActiveTab('builder')}
                                                    className="px-6 py-2.5 bg-emerald-50 text-emerald-700 font-bold rounded-xl hover:bg-emerald-100 transition-all border border-emerald-200"
                                                >
                                                    IR PARA ORÇAMENTO →
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {loadingVistoria ? (
                                        <div className="py-20 flex justify-center"><PiSpinner className="animate-spin text-blue-600" size={32} /></div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {perguntas.length === 0 ? (
                                                <div className="col-span-2 py-20 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                                                    <p className="text-gray-400">Nenhuma pergunta de vistoria cadastrada.</p>
                                                    <p className="text-[10px] text-gray-300 mt-1 uppercase font-bold tracking-widest">Acesse configurações para gerenciar perguntas</p>
                                                </div>
                                            ) : (
                                                Array.from(new Set(perguntas.map(p => p.categoria))).map(cat => (
                                                    <div key={cat} className="space-y-4 bg-gray-50 p-6 rounded-2xl border border-gray-100">
                                                        <h4 className="font-bold text-gray-700 border-b border-gray-200 pb-2 mb-4 uppercase text-xs tracking-wider">{cat}</h4>
                                                        <div className="space-y-4">
                                                            {perguntas.filter(p => p.categoria === cat).map(p => (
                                                                <div key={p.id} className="space-y-1.5">
                                                                    <label className="text-xs font-bold text-gray-600">{p.texto}</label>
                                                                    {p.tipo === 'booleano' || p.tipo === 'boolean' ? (
                                                                        <div className="flex gap-2">
                                                                            <button
                                                                                onClick={() => setRespostas({ ...respostas, [p.slug]: true })}
                                                                                className={cn("flex-1 py-2 text-xs font-bold rounded-lg border transition-all", respostas[p.slug] === true ? "bg-blue-600 border-blue-600 text-white" : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50")}
                                                                            >
                                                                                SIM
                                                                            </button>
                                                                            <button
                                                                                onClick={() => setRespostas({ ...respostas, [p.slug]: false })}
                                                                                className={cn("flex-1 py-2 text-xs font-bold rounded-lg border transition-all", respostas[p.slug] === false ? "bg-red-600 border-red-600 text-white" : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50")}
                                                                            >
                                                                                NÃO
                                                                            </button>
                                                                        </div>
                                                                    ) : p.tipo === 'numero' ? (
                                                                        <input
                                                                            type="number"
                                                                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                                                            value={respostas[p.slug] || ''}
                                                                            onChange={e => setRespostas({ ...respostas, [p.slug]: e.target.value })}
                                                                            placeholder="0.00"
                                                                        />
                                                                    ) : (
                                                                        <input
                                                                            type="text"
                                                                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                                                            value={respostas[p.slug] || ''}
                                                                            onChange={e => setRespostas({ ...respostas, [p.slug]: e.target.value })}
                                                                            placeholder="..."
                                                                        />
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'info' && (
                                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm space-y-3">
                                            <div className="flex items-center gap-3 text-blue-600 mb-2">
                                                <div className="p-2 bg-blue-50 rounded-lg">#</div>
                                                <span className="text-xs font-bold uppercase tracking-wider">Investimento</span>
                                            </div>
                                            <p className="text-2xl font-bold text-gray-900">
                                                {Number(deal.valorEstimado).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                            </p>
                                            <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                                                <div className="bg-blue-600 h-full w-[70%]" />
                                            </div>
                                        </div>

                                        <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm space-y-3">
                                            <div className="flex items-center gap-3 text-indigo-600 mb-2">
                                                <div className="p-2 bg-indigo-50 rounded-lg">👤</div>
                                                <span className="text-xs font-bold uppercase tracking-wider">Cliente</span>
                                            </div>
                                            <p className="font-bold text-gray-900 truncate">{deal.lead?.nome}</p>
                                            <p className="text-xs text-gray-500 truncate">{deal.lead?.empresa || 'Pessoa Física'}</p>
                                        </div>

                                        <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3 text-emerald-600 mb-2">
                                                    <div className="p-2 bg-emerald-50 rounded-lg">🏗️</div>
                                                    <span className="text-xs font-bold uppercase tracking-wider">Obra Vinculada</span>
                                                </div>
                                                {!deal.obraId && deal.estagio !== 'ganho' && (
                                                    <button
                                                        onClick={() => {
                                                            setObraNome(deal.titulo);
                                                            setObraEndereco(deal.lead?.endereco || '');
                                                            setShowObraForm(true);
                                                        }}
                                                        className="text-[10px] text-emerald-600 font-bold hover:underline"
                                                    >
                                                        + REGISTRAR LOCAL
                                                    </button>
                                                )}
                                            </div>
                                            {deal.obra ? (
                                                <>
                                                    <p className="font-bold text-gray-900 truncate">{deal.obra.nome}</p>
                                                    <p className="text-[10px] text-emerald-700 truncate">{deal.obra.endereco || 'Sem endereço'}</p>
                                                    <p className="text-[10px] text-emerald-600 font-bold bg-emerald-50 w-fit px-2 py-0.5 rounded uppercase mt-1">Sincronizado</p>
                                                </>
                                            ) : (
                                                <p className="text-sm text-gray-400 italic">Nenhum local registrado ainda.</p>
                                            )}
                                        </div>
                                    </div>

                                    {showObraForm && (
                                        <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-2xl animate-in slide-in-from-top-2 duration-300">
                                            <div className="flex justify-between items-center mb-4">
                                                <h4 className="font-bold text-emerald-800 text-sm">Registrar Endereço da Obra</h4>
                                                <button onClick={() => setShowObraForm(false)} className="text-emerald-400 hover:text-emerald-600 font-bold text-xs uppercase">Fechar</button>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold text-emerald-700 uppercase">Nome/Identificação</label>
                                                    <input
                                                        type="text"
                                                        className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-lg text-sm outline-none"
                                                        value={obraNome}
                                                        onChange={e => setObraNome(e.target.value)}
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold text-emerald-700 uppercase">Endereço Completo</label>
                                                    <input
                                                        type="text"
                                                        className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-lg text-sm outline-none"
                                                        value={obraEndereco}
                                                        onChange={e => setObraEndereco(e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                            <button
                                                onClick={handleCreateDraftObra}
                                                disabled={isCreatingObra}
                                                className="mt-4 px-6 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition-all text-xs disabled:opacity-50"
                                            >
                                                {isCreatingObra ? 'SALVANDO...' : 'SALVAR DADOS DO ENDEREÇO'}
                                            </button>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-6 flex flex-col">
                                            {/* Ações Comerciais */}
                                            <div className="border rounded-2xl overflow-hidden border-gray-100 bg-white">
                                                <div className="bg-gray-50 p-4 font-bold text-gray-700 text-sm border-b">Ações da Venda</div>
                                                <div className="p-4">
                                                    {deal.estagio !== 'ganho' && deal.estagio !== 'perdido' ? (
                                                        <div className="flex flex-col gap-3">
                                                            <button
                                                                onClick={handleWinDeal}
                                                                disabled={isWinning || isLosing}
                                                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-all shadow-md shadow-emerald-50 flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
                                                            >
                                                                {isWinning ? <PiSpinner className="animate-spin" /> : '🤝 FECHAR NEGÓCIO (GANHO)'}
                                                            </button>
                                                            <button
                                                                onClick={handleLoseDeal}
                                                                disabled={isWinning || isLosing}
                                                                className="w-full bg-white border-2 border-red-100 hover:border-red-200 text-red-600 font-bold py-3 rounded-xl transition-all disabled:opacity-50 text-sm"
                                                            >
                                                                {isLosing ? <PiSpinner className="animate-spin" /> : '❌ MARCAR COMO PERDIDO'}
                                                            </button>
                                                        </div>
                                                    ) : deal.estagio === 'ganho' ? (
                                                        <div className="text-center py-3 bg-emerald-50 w-full rounded-xl border border-emerald-100">
                                                            <p className="text-emerald-700 font-bold text-sm">🎉 NEGÓCIO CONCLUÍDO</p>
                                                            <p className="text-[10px] text-emerald-600">Este projeto já é uma obra ativa.</p>
                                                        </div>
                                                    ) : (
                                                        <div className="text-center py-3 bg-red-50 w-full rounded-xl border border-red-100">
                                                            <p className="text-red-700 font-bold text-sm">⛔ NEGÓCIO PERDIDO</p>
                                                            <p className="text-[10px] text-red-600">Oportunidade encerrada.</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Nova Interação */}
                                            <div className="border rounded-2xl overflow-hidden border-gray-100 bg-white flex-1">
                                                <div className="bg-gray-50 p-4 font-bold text-gray-700 text-sm border-b">Registrar Contato</div>
                                                <div className="p-4 space-y-3">
                                                    <div className="flex gap-2">
                                                        {[
                                                            { id: 'nota', icon: PiChatCenteredText, label: 'Nota' },
                                                            { id: 'ligacao', icon: PiPhone, label: 'Ligação' },
                                                            { id: 'email', icon: PiEnvelope, label: 'Email' },
                                                            { id: 'reuniao', icon: PiUsers, label: 'Reunião' }
                                                        ].map(t => (
                                                            <button
                                                                key={t.id}
                                                                onClick={() => setInteractionType(t.id)}
                                                                className={cn(
                                                                    "flex-1 flex flex-col items-center gap-1 p-2 rounded-xl border transition-all",
                                                                    interactionType === t.id
                                                                        ? "bg-blue-50 border-blue-200 text-blue-600 shadow-sm"
                                                                        : "border-transparent text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                                                                )}
                                                            >
                                                                <t.icon size={18} />
                                                                <span className="text-[10px] font-bold uppercase">{t.label}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                    <textarea
                                                        className="w-full p-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all text-sm min-h-[80px] resize-none font-medium"
                                                        placeholder="O que foi conversado?"
                                                        value={interactionDesc}
                                                        onChange={e => setInteractionDesc(e.target.value)}
                                                    />
                                                    <button
                                                        disabled={isSavingInteraction || !interactionDesc.trim()}
                                                        onClick={handleCreateInteraction}
                                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl transition-all shadow-md shadow-blue-100 disabled:opacity-50 text-xs flex items-center justify-center gap-2"
                                                    >
                                                        {isSavingInteraction ? <PiSpinner className="animate-spin" /> : 'SALVAR INTERAÇÃO'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Timeline */}
                                        <div className="border rounded-2xl overflow-hidden border-gray-100 flex flex-col bg-white">
                                            <div className="bg-gray-50 p-4 font-bold text-gray-700 text-sm border-b flex justify-between items-center">
                                                Linha do Tempo
                                                <PiClock className="text-gray-400" />
                                            </div>
                                            <div className="p-4 flex-1 overflow-y-auto max-h-[450px] custom-scrollbar space-y-4">
                                                {deal.interacoes?.length > 0 ? (
                                                    deal.interacoes.map((int: any) => (
                                                        <div key={int.id} className="relative pl-6 border-l-2 border-gray-100 pb-2 last:pb-0">
                                                            <div className={cn(
                                                                "absolute -left-2.5 top-0 w-5 h-5 rounded-full flex items-center justify-center ring-4 ring-white shadow-sm",
                                                                int.tipo === 'sistema' ? "bg-emerald-100 text-emerald-600" :
                                                                    int.tipo === 'ligacao' ? "bg-indigo-100 text-indigo-600" :
                                                                        int.tipo === 'email' ? "bg-amber-100 text-amber-600" :
                                                                            int.tipo === 'reuniao' ? "bg-purple-100 text-purple-600" : "bg-blue-100 text-blue-600"
                                                            )}>
                                                                {int.tipo === 'sistema' ? '⚙️' :
                                                                    int.tipo === 'ligacao' ? <PiPhone size={10} /> :
                                                                        int.tipo === 'email' ? <PiEnvelope size={10} /> :
                                                                            int.tipo === 'reuniao' ? <PiUsers size={10} /> : <PiChatCenteredText size={10} />}
                                                            </div>
                                                            <div className="space-y-1">
                                                                <div className="flex justify-between items-start">
                                                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                                                        {new Date(int.data).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                                    </span>
                                                                    <span className="text-[10px] font-medium text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded">
                                                                        {int.usuario?.nome.split(' ')[0]}
                                                                    </span>
                                                                </div>
                                                                <p className="text-xs text-gray-700 leading-relaxed">{int.descricao}</p>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="text-center py-10 text-gray-400 italic text-xs">
                                                        Nenhuma interação registrada ainda.
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'builder' && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-bold text-gray-800">Parametrizar Proposta PDF</h3>
                                        <span className="text-xs px-2 py-1 bg-blue-50 text-blue-600 font-bold rounded">LAYOUT PREMIUM ATIVO</span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-6">
                                            {/* Parâmetros da Proposta */}
                                            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                                                <div className="space-y-2">
                                                    <label className="text-sm font-bold text-gray-700">Validade Comercial</label>
                                                    <input
                                                        type="date"
                                                        className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                                                        value={validade}
                                                        onChange={e => setValidade(e.target.value)}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-bold text-gray-700 flex justify-between">
                                                        Margem / Multiplicador
                                                        <span className="text-blue-600">{(multiplier > 1 ? `+${((multiplier - 1) * 100).toFixed(0)}%` : multiplier < 1 ? `-${((1 - multiplier) * 100).toFixed(0)}%` : 'Preço Original')}</span>
                                                    </label>
                                                    <div className="flex items-center gap-4">
                                                        <input
                                                            type="range"
                                                            min="0.5"
                                                            max="3"
                                                            step="0.05"
                                                            className="flex-1 accent-blue-600"
                                                            value={multiplier}
                                                            onChange={e => setMultiplier(parseFloat(e.target.value))}
                                                        />
                                                        <input
                                                            type="number"
                                                            className="w-20 px-3 py-2 bg-gray-50 border-0 rounded-lg text-center font-bold text-blue-600 text-xs"
                                                            value={multiplier}
                                                            onChange={e => setMultiplier(parseFloat(e.target.value))}
                                                            step="0.01"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Resumo da Vistoria (para referência rápida) */}
                                            {Object.keys(respostas).length > 0 && (
                                                <div className="bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100 space-y-3">
                                                    <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs uppercase tracking-wider border-b border-emerald-100 pb-2">
                                                        📋 Referência da Vistoria
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        {perguntas.filter(p => respostas[p.slug] !== undefined && respostas[p.slug] !== '').slice(0, 6).map(p => (
                                                            <div key={p.id}>
                                                                <p className="text-[9px] text-emerald-600 font-bold uppercase truncate">{p.texto}</p>
                                                                <p className="text-sm font-black text-emerald-800">
                                                                    {respostas[p.slug] === true ? 'SIM' : respostas[p.slug] === false ? 'NÃO' : respostas[p.slug]}
                                                                </p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            <div className="space-y-2">
                                                <label className="text-sm font-bold text-gray-700">Condições de Pagamento / Obs</label>
                                                <textarea
                                                    className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all min-h-[100px] resize-none font-medium text-sm"
                                                    placeholder="Ex: 40% Entrada + Saldo em 3x..."
                                                    value={observacoes}
                                                    onChange={e => setObservacoes(e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Preview do Escopo</h4>
                                            <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                                                {(() => {
                                                    const orc = deal.obra?.orcamento_detalhado?.find((o: any) => !o.isTemplate) || deal.obra?.orcamento_detalhado?.[0];
                                                    return orc?.itens?.length > 0 ? (
                                                        orc.itens.map((it: any) => (
                                                            <div key={it.id} className="flex justify-between items-center text-[10px] py-1.5 border-b border-gray-200/50 last:border-0 uppercase font-medium">
                                                                <span className="text-gray-600 truncate mr-4">{it.descricao}</span>
                                                                <span className="text-gray-900 whitespace-nowrap">R$ {(Number(it.valorTotal) * multiplier).toLocaleString()}</span>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="text-center py-6 px-4 space-y-4">
                                                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-4">
                                                                <p className="text-xs text-blue-700 font-bold mb-2 uppercase tracking-tight">Gerar Orçamento Rápido</p>
                                                                <p className="text-[10px] text-blue-600 mb-4 opacity-80">Selecione um template de orçamento para preencher automaticamente esta obra.</p>

                                                                <select
                                                                    className="w-full text-[10px] px-3 py-2 bg-white border border-blue-200 rounded-lg focus:ring-1 focus:ring-blue-500 mb-3 outline-none"
                                                                    value={selectedTemplateId}
                                                                    onChange={e => setSelectedTemplateId(e.target.value)}
                                                                >
                                                                    <option value="">Selecione um modelo...</option>
                                                                    {templates.map(t => (
                                                                        <option key={t.id} value={t.id}>{t.nome}</option>
                                                                    ))}
                                                                </select>

                                                                <button
                                                                    disabled={!selectedTemplateId || isApplyingTemplate}
                                                                    onClick={handleApplyTemplate}
                                                                    className="w-full bg-blue-600 text-white text-[10px] font-bold py-2.5 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
                                                                >
                                                                    {isApplyingTemplate ? (
                                                                        <PiSpinner className="animate-spin" />
                                                                    ) : (
                                                                        'APLICAR MODELO'
                                                                    )}
                                                                </button>
                                                            </div>
                                                            <p className="text-xs text-gray-400 italic">Ou faça o upload manual na área de orçamentos.</p>
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                            <div className="mt-6 pt-6 border-t border-gray-200 space-y-4">
                                                {(() => {
                                                    const orc = deal.obra?.orcamento_detalhado?.find((o: any) => !o.isTemplate) || deal.obra?.orcamento_detalhado?.[0];
                                                    if (!orc?.itens?.length) return null;

                                                    const subtotal = orc.itens.reduce((acc: number, it: any) => acc + Number(it.valorTotal), 0);
                                                    const total = subtotal * multiplier;

                                                    return (
                                                        <div className="bg-white p-4 rounded-xl border border-gray-100 space-y-2 mb-2">
                                                            <div className="flex justify-between text-[10px] text-gray-400 font-bold uppercase">
                                                                <span>Subtotal Orçado</span>
                                                                <span>{subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                                            </div>
                                                            <div className="flex justify-between text-[10px] text-blue-600 font-bold uppercase">
                                                                <span>Margem Aplicada</span>
                                                                <span>x{multiplier.toFixed(2)}</span>
                                                            </div>
                                                            <div className="flex justify-between text-sm text-gray-900 font-black uppercase pt-2 border-t border-gray-50">
                                                                <span>Total Proposta</span>
                                                                <span className="text-blue-600">{total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                                            </div>
                                                        </div>
                                                    );
                                                })()}

                                                <button
                                                    onClick={handleGenerateProposal}
                                                    disabled={generating}
                                                    className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                                >
                                                    {generating ? (
                                                        <PiSpinner className="animate-spin text-xl" />
                                                    ) : (
                                                        <>
                                                            <PiFilePdf className="text-xl" />
                                                            GERAR PROPOSTA PDF
                                                        </>
                                                    )}
                                                </button>

                                                <button
                                                    onClick={handleSaveTemplate}
                                                    disabled={isSavingTemplate || !deal.obra?.orcamento_detalhado?.[0]}
                                                    className="w-full flex items-center justify-center gap-2 bg-white border-2 border-gray-200 hover:border-gray-300 text-gray-700 font-bold py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                                >
                                                    {isSavingTemplate ? (
                                                        <PiSpinner className="animate-spin text-xl" />
                                                    ) : (
                                                        <>
                                                            <PiDownload className="text-xl" />
                                                            SALVAR COMO TEMPLATE
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'history' && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="flex items-center justify-between pb-2">
                                        <h3 className="font-bold text-gray-800 text-lg">Histórico de Arquivos</h3>
                                        <div className="text-xs text-gray-500">Total de {propostas.length} versões</div>
                                    </div>

                                    {propostas.length === 0 ? (
                                        <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                                            <PiFilePdf className="mx-auto text-gray-200 mb-4" size={64} />
                                            <p className="text-gray-400 font-medium">Nenhum documento gerado para este deal.</p>
                                        </div>
                                    ) : (
                                        <div className="grid gap-4">
                                            {propostas.map((prop) => (
                                                <div key={prop.id} className="flex justify-between items-center p-5 bg-white border border-gray-100 rounded-2xl hover:border-blue-300 hover:shadow-xl hover:shadow-blue-500/5 transition-all group">
                                                    <div className="flex items-start gap-4">
                                                        <div className="p-3 bg-red-50 text-red-500 rounded-xl group-hover:bg-red-500 group-hover:text-white transition-all">
                                                            <PiFilePdf size={28} />
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <p className="font-bold text-gray-900">Versão {prop.versao}</p>
                                                                <span className="text-[10px] bg-green-50 text-green-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-tighter">ENVIADA</span>
                                                            </div>
                                                            <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                                                                <span>📅 {new Date(prop.createdAt).toLocaleString()}</span>
                                                                <span>•</span>
                                                                <span className="text-blue-600 font-bold">💰 {Number(prop.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <a
                                                        href={`${import.meta.env.VITE_API_URL}${prop.arquivoUrl}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-blue-600 hover:text-white bg-blue-50 hover:bg-blue-600 rounded-xl transition-all"
                                                    >
                                                        <PiDownload size={18} />
                                                        Download
                                                    </a>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-20">
                            <p className="text-red-500 font-bold text-lg">Algo deu errado</p>
                            <p className="text-gray-500 text-sm mb-6">Não conseguimos localizar as informações do negócio.</p>
                            <button onClick={onClose} className="px-6 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold transition-all text-gray-700">Fechar Janela</button>
                        </div>
                    )}
                </div>

                {/* Footer Gradient Accent */}
                <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 shrink-0" />
            </div>
        </div>
    );
}
