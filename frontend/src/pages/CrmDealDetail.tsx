
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { crmApi, orcamentoApi, obrasApi } from '../lib/api';
import { toast } from 'sonner';
import {
    PiChatCenteredText, PiPhone, PiEnvelope, PiUsers,
    PiClock, PiDownload, PiFilePdf, PiSpinner,
    PiArrowLeft, PiIdentificationCard, PiMoney, PiBuildings, PiUser
} from 'react-icons/pi';
import { cn } from '../utils/cn';

export function CrmDealDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const dealId = Number(id);

    const [deal, setDeal] = useState<any>(null);
    const [loading, setLoading] = useState(true);
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
        if (dealId) {
            loadDealDetails();
            loadTemplates();
            loadPerguntas();
            loadVistoria();
        }
    }, [dealId]);

    const loadDealDetails = async () => {
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
            navigate('/crm');
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
        setLoadingVistoria(true);
        try {
            const res = await crmApi.vistoria.getByDeal(dealId);
            if (res.success && res.data) {
                setRespostas(res.data.respostas || {});
            }
        } catch (error) {
            console.error('Erro ao carregar vistoria:', error);
        } finally {
            setLoadingVistoria(false);
        }
    };

    const handleSaveVistoria = async () => {
        setIsSavingVistoria(true);
        try {
            const res = await crmApi.vistoria.save({ dealId, respostas });
            if (res.success) {
                toast.success('Vistoria técnica salva!');
                loadDealDetails();
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
                loadDealDetails();
            }
        } catch (error) {
            console.error('Erro ao aplicar template:', error);
            toast.error('Erro ao aplicar template');
        } finally {
            setIsApplyingTemplate(false);
        }
    };

    const handleGenerateProposal = async () => {
        if (!deal?.obraId) {
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
                loadDealDetails();
                setActiveTab('history');
                window.open(crmApi.propostas.getPdfUrl(response.data.id), '_blank');
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
        if (!confirm(`Parabéns! Confirmar o fechamento do negócio "${deal.titulo}"?`)) return;

        setIsWinning(true);
        try {
            const response = await crmApi.deals.win(deal.id);
            if (response.success) {
                toast.success('Venda concluída! O projeto agora está na área operacional.');
                loadDealDetails();
            }
        } catch (error) {
            console.error('Erro ao fechar negócio:', error);
            toast.error('Erro ao fechar negócio');
        } finally {
            setIsWinning(false);
        }
    };

    const handleLoseDeal = async () => {
        const motivo = window.prompt(`Informe o motivo da perda do negócio "${deal.titulo}":`);
        if (motivo === null) return;

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
        if (!interactionDesc.trim()) return;

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
                loadDealDetails();
            }
        } catch (error) {
            console.error('Erro ao salvar interação:', error);
            toast.error('Erro ao salvar interação');
        } finally {
            setIsSavingInteraction(false);
        }
    };

    const handleCreateDraftObra = async () => {
        if (!obraNome || !obraEndereco) return;
        setIsCreatingObra(true);
        try {
            const res = await (obrasApi.create({
                nome: obraNome,
                endereco: obraEndereco,
                status: 'orcamento'
            }) as Promise<any>);

            if (res.success) {
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

    if (loading) {
        return <div className="flex justify-center p-20"><PiSpinner className="animate-spin text-blue-600" size={48} /></div>;
    }

    if (!deal) return null;

    return (
        <div className="p-6 max-w-[1600px] mx-auto pb-20">
            {/* Header / Breadcrumb */}
            <div className="mb-6">
                <button
                    onClick={() => navigate('/crm')}
                    className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-4 transition-colors text-sm font-medium"
                >
                    <PiArrowLeft /> Voltar para o Pipeline
                </button>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                            <PiIdentificationCard size={32} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">{deal.titulo}</h1>
                            <p className="text-gray-500 flex items-center gap-2 text-sm uppercase font-bold tracking-tight">
                                <span className={cn(
                                    "w-2 h-2 rounded-full",
                                    deal.estagio === 'ganho' ? "bg-emerald-500" :
                                        deal.estagio === 'perdido' ? "bg-red-500" : "bg-blue-500"
                                )}></span>
                                {deal.estagio.replace('_', ' ')} • ID #{deal.id}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {deal.estagio !== 'ganho' && deal.estagio !== 'perdido' ? (
                            <>
                                <button
                                    onClick={handleWinDeal}
                                    disabled={isWinning}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all text-sm shadow-md shadow-emerald-50"
                                >
                                    {isWinning ? <PiSpinner className="animate-spin" /> : '🤝 FECHAR NEGÓCIO'}
                                </button>
                                <button
                                    onClick={handleLoseDeal}
                                    disabled={isLosing}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-white border border-gray-200 text-red-600 font-bold rounded-xl hover:bg-red-50 transition-all text-sm"
                                >
                                    {isLosing ? <PiSpinner className="animate-spin" /> : '❌ PERDIDO'}
                                </button>
                            </>
                        ) : (
                            <div className={cn(
                                "px-6 py-2.5 rounded-xl font-bold text-sm uppercase flex items-center gap-2",
                                deal.estagio === 'ganho' ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                            )}>
                                {deal.estagio === 'ganho' ? '🎉 Negócio Ganho' : '⛔ Oportunidade Perdida'}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Investimento Estimado</p>
                    <p className="text-xl font-black text-blue-600">{Number(deal.valorEstimado).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Cliente / Lead</p>
                    <p className="text-base font-bold text-gray-800 truncate">{deal.lead?.nome}</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Último Contato</p>
                    <p className="text-base font-bold text-gray-800">
                        {deal.interacoes?.[0] ? new Date(deal.interacoes[0].data).toLocaleDateString('pt-BR') : 'Sem registros'}
                    </p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Estágio Atual</p>
                    <span className="inline-block px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold uppercase rounded">
                        {deal.estagio}
                    </span>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-gray-200 mb-8">
                {[
                    { id: 'info', label: 'Evolução e Timeline', icon: PiIdentificationCard },
                    { id: 'vistoria', label: 'Vistoria Técnica', icon: PiBuildings },
                    { id: 'builder', label: 'Proposta Comercial', icon: PiFilePdf },
                    { id: 'history', label: 'Histórico de Arquivos', icon: PiDownload }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={cn(
                            "flex items-center gap-2 px-6 py-4 text-sm font-medium transition-all border-b-2 -mb-px",
                            activeTab === tab.id
                                ? "border-blue-600 text-blue-600"
                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200"
                        )}
                    >
                        <tab.icon size={20} />
                        {tab.label}
                        {tab.id === 'history' && propostas.length > 0 && (
                            <span className="ml-1 bg-gray-100 text-gray-500 text-[10px] px-1.5 py-0.5 rounded-full">{propostas.length}</span>
                        )}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Side: Dynamic Content by Tab */}
                <div className="lg:col-span-2 space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">

                    {activeTab === 'info' && (
                        <div className="space-y-6">
                            {/* Registrar Contato */}
                            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                                <div className="px-6 py-4 bg-gray-50/50 border-b border-gray-100 flex justify-between items-center">
                                    <h3 className="text-sm font-black text-gray-700 uppercase tracking-tight">Novas Interações</h3>
                                    <div className="flex gap-1">
                                        {[
                                            { id: 'nota', icon: PiChatCenteredText },
                                            { id: 'ligacao', icon: PiPhone },
                                            { id: 'email', icon: PiEnvelope },
                                            { id: 'reuniao', icon: PiUsers }
                                        ].map(t => (
                                            <button
                                                key={t.id}
                                                onClick={() => setInteractionType(t.id)}
                                                className={cn(
                                                    "p-2 rounded-lg transition-all border",
                                                    interactionType === t.id
                                                        ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-100"
                                                        : "bg-white border-gray-100 text-gray-400 hover:text-gray-600"
                                                )}
                                            >
                                                <t.icon size={18} />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="p-6 space-y-4">
                                    <textarea
                                        className="w-full p-4 bg-gray-50 border-0 rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all text-sm min-h-[100px] resize-none font-medium"
                                        placeholder="Descreva o que aconteceu neste contato..."
                                        value={interactionDesc}
                                        onChange={e => setInteractionDesc(e.target.value)}
                                    />
                                    <div className="flex justify-end">
                                        <button
                                            disabled={isSavingInteraction || !interactionDesc.trim()}
                                            onClick={handleCreateInteraction}
                                            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl transition-all shadow-lg shadow-blue-100 disabled:opacity-50 text-xs tracking-widest uppercase flex items-center gap-2"
                                        >
                                            {isSavingInteraction ? <PiSpinner className="animate-spin" /> : 'Registrar Contato'}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Timeline */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] px-2">Histórico Cronológico</h3>
                                <div className="space-y-4 pr-2">
                                    {deal.interacoes?.length > 0 ? (
                                        deal.interacoes.map((int: any) => (
                                            <div key={int.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-start gap-4 hover:border-blue-200 transition-colors">
                                                <div className={cn(
                                                    "p-3 rounded-2xl shrink-0",
                                                    int.tipo === 'sistema' ? "bg-emerald-50 text-emerald-600" :
                                                        int.tipo === 'ligacao' ? "bg-indigo-50 text-indigo-600" :
                                                            int.tipo === 'email' ? "bg-amber-50 text-amber-600" :
                                                                int.tipo === 'reuniao' ? "bg-purple-50 text-purple-600" : "bg-blue-50 text-blue-600"
                                                )}>
                                                    {int.tipo === 'sistema' ? '⚙️' :
                                                        int.tipo === 'ligacao' ? <PiPhone size={20} /> :
                                                            int.tipo === 'email' ? <PiEnvelope size={20} /> :
                                                                int.tipo === 'reuniao' ? <PiUsers size={20} /> : <PiChatCenteredText size={20} />}
                                                </div>
                                                <div className="flex-1 space-y-1">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                                                            {new Date(int.data).toLocaleString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                        <span className="px-2 py-0.5 bg-gray-50 text-gray-500 rounded text-[9px] font-black uppercase">
                                                            {int.usuario?.nome}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-700 leading-relaxed font-medium whitespace-pre-wrap">{int.descricao}</p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 text-gray-400 italic text-sm">
                                            Nenhuma interação registrada ainda.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'vistoria' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-black text-gray-900">Checklist de Vistoria Técnica</h3>
                                <button
                                    onClick={handleSaveVistoria}
                                    disabled={isSavingVistoria}
                                    className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all text-xs"
                                >
                                    {isSavingVistoria ? <PiSpinner className="animate-spin" /> : 'CONCLUIR VISTORIA'}
                                </button>
                            </div>

                            {loadingVistoria ? (
                                <div className="py-20 flex justify-center"><PiSpinner className="animate-spin text-blue-600" size={32} /></div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {perguntas.length === 0 ? (
                                        <p className="col-span-2 text-center py-10 text-gray-400 italic">Nenhum checklist configurado.</p>
                                    ) : (
                                        Array.from(new Set(perguntas.map(p => p.categoria))).map(cat => (
                                            <div key={cat} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                                                <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] border-b border-gray-50 pb-2">{cat}</h4>
                                                <div className="space-y-6">
                                                    {perguntas.filter(p => p.categoria === cat).map(p => (
                                                        <div key={p.id} className="space-y-2">
                                                            <label className="text-xs font-bold text-gray-700">{p.texto}</label>
                                                            {p.tipo === 'booleano' || p.tipo === 'boolean' ? (
                                                                <div className="flex gap-2">
                                                                    <button
                                                                        onClick={() => setRespostas({ ...respostas, [p.slug]: true })}
                                                                        className={cn("flex-1 py-2 text-[10px] font-black rounded-xl border transition-all", respostas[p.slug] === true ? "bg-blue-600 border-blue-600 text-white" : "bg-white border-gray-100 text-gray-400")}
                                                                    >
                                                                        SIM
                                                                    </button>
                                                                    <button
                                                                        onClick={() => setRespostas({ ...respostas, [p.slug]: false })}
                                                                        className={cn("flex-1 py-2 text-[10px] font-black rounded-xl border transition-all", respostas[p.slug] === false ? "bg-red-600 border-red-600 text-white" : "bg-white border-gray-100 text-gray-400")}
                                                                    >
                                                                        NÃO
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <input
                                                                    type={p.tipo === 'numero' ? 'number' : 'text'}
                                                                    className="w-full px-4 py-2 bg-gray-50 border-0 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-xs font-bold text-gray-700"
                                                                    value={respostas[p.slug] || ''}
                                                                    onChange={e => setRespostas({ ...respostas, [p.slug]: e.target.value })}
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

                    {activeTab === 'builder' && (
                        <div className="space-y-6">
                            <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-xl shadow-blue-500/5 space-y-8">
                                <div className="flex justify-between items-start">
                                    <h3 className="text-xl font-black text-gray-900">Parâmetros da Proposta</h3>
                                    <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[9px] font-black uppercase rounded-full">Layout Premium v2.0</span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Validade Comercial</label>
                                            <input
                                                type="date"
                                                className="w-full px-5 py-3 bg-gray-50 border-0 rounded-2xl font-bold text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
                                                value={validade}
                                                onChange={e => setValidade(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center">
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Margem Aplicada</label>
                                                <span className="text-blue-600 font-black text-sm">x{multiplier.toFixed(2)}</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="0.5"
                                                max="3"
                                                step="0.05"
                                                className="w-full accent-blue-600 bg-gray-100 rounded-full h-2 appearance-none cursor-pointer"
                                                value={multiplier}
                                                onChange={e => setMultiplier(parseFloat(e.target.value))}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Condições / Observações</label>
                                        <textarea
                                            className="w-full p-5 bg-gray-50 border-0 rounded-2xl font-medium text-gray-700 h-[130px] resize-none outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Ex: Pagamento em 40% entrada + 60% na entrega..."
                                            value={observacoes}
                                            onChange={e => setObservacoes(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="pt-8 border-t border-gray-50 flex flex-col md:flex-row gap-4 items-center justify-between">
                                    <div className="text-center md:text-left">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Valor Final Sugerido</p>
                                        <p className="text-3xl font-black text-blue-600">{(Number(deal.valorEstimado) * multiplier).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={handleSaveTemplate}
                                            disabled={isSavingTemplate}
                                            className="px-6 py-4 bg-white border border-gray-200 text-gray-600 font-black rounded-2xl hover:bg-gray-50 transition-all text-[10px] uppercase tracking-wider flex items-center gap-2"
                                        >
                                            <PiDownload size={18} /> Salvar Modelo
                                        </button>
                                        <button
                                            onClick={handleGenerateProposal}
                                            disabled={generating}
                                            className="px-10 py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl transition-all shadow-xl shadow-blue-500/20 text-[10px] uppercase tracking-widest flex items-center gap-2"
                                        >
                                            {generating ? <PiSpinner className="animate-spin" /> : <><PiFilePdf size={18} /> GERAR PROPOSTA PDF</>}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'history' && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center px-4">
                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Arquivos Enviados</h3>
                            </div>
                            {propostas.length === 0 ? (
                                <div className="bg-white p-20 rounded-[40px] border border-gray-100 shadow-sm text-center">
                                    <PiFilePdf size={80} className="mx-auto text-gray-100 mb-6" />
                                    <p className="text-gray-400 font-bold">Nenhuma proposta enviada para este cliente.</p>
                                    <button onClick={() => setActiveTab('builder')} className="mt-4 text-blue-600 font-black text-xs uppercase hover:underline underline-offset-4">Começar Orçamento →</button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {propostas.map(prop => (
                                        <div key={prop.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:border-blue-300 transition-all group flex justify-between items-center">
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 bg-red-50 text-red-500 rounded-2xl group-hover:bg-red-500 group-hover:text-white transition-all">
                                                    <PiFilePdf size={30} />
                                                </div>
                                                <div>
                                                    <p className="font-black text-gray-900 leading-none mb-1">Versão {prop.versao}</p>
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Enviada em {new Date(prop.createdAt).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <a
                                                href={crmApi.propostas.getPdfUrl(prop.id)}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="p-3 text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                            >
                                                <PiDownload size={22} />
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                </div>

                {/* Right Side: Fixed Details Panel */}
                <div className="space-y-6">

                    {/* Contatos do Lead */}
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><PiUser size={18} /></div>
                            <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest">Contato do Cliente</h3>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-1">
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Nome Completo</p>
                                <p className="text-sm font-bold text-gray-800">{deal.lead?.nome}</p>
                            </div>
                            {deal.lead?.empresa && (
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Empresa / Razão Social</p>
                                    <p className="text-sm font-bold text-gray-800">{deal.lead.empresa}</p>
                                </div>
                            )}
                            <div className="space-y-1">
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Email Comercial</p>
                                <p className="text-sm font-bold text-blue-600">{deal.lead?.email || 'Nenhum email info'}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Telefone / WhatsApp</p>
                                <button
                                    onClick={() => {
                                        const phone = deal.lead?.telefone?.replace(/\D/g, '') || '';
                                        window.open(`https://wa.me/${phone}`, '_blank');
                                    }}
                                    className="text-sm font-bold text-emerald-600 hover:underline"
                                >
                                    {deal.lead?.telefone || 'Adicionar telefone'}
                                </button>
                            </div>
                        </div>

                        <button
                            onClick={() => {
                                const msg = `Olá ${deal.lead?.nome}, segue atualização sobre seu projeto...`;
                                const phone = deal.lead?.telefone?.replace(/\D/g, '') || '';
                                window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
                            }}
                            className="w-full bg-emerald-50 text-emerald-700 font-black py-4 rounded-2xl hover:bg-emerald-100 transition-all text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"
                        >
                            📱 Abrir Conversa Direta
                        </button>
                    </div>

                    {/* Obra e Orçamento */}
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><PiBuildings size={18} /></div>
                                <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest">Dados da Obra</h3>
                            </div>
                            {!deal.obraId && (
                                <button onClick={() => setShowObraForm(true)} className="text-[10px] font-black text-blue-600 hover:underline">+ Criar Local</button>
                            )}
                        </div>

                        {showObraForm ? (
                            <div className="space-y-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                <input
                                    className="w-full px-4 py-2 bg-white border-0 rounded-xl text-xs font-bold outline-none"
                                    placeholder="Nome da Obra"
                                    value={obraNome}
                                    onChange={e => setObraNome(e.target.value)}
                                />
                                <input
                                    className="w-full px-4 py-2 bg-white border-0 rounded-xl text-xs font-bold outline-none"
                                    placeholder="Endereço Completo"
                                    value={obraEndereco}
                                    onChange={e => setObraEndereco(e.target.value)}
                                />
                                <button
                                    onClick={handleCreateDraftObra}
                                    className="w-full bg-blue-600 text-white font-black py-2 rounded-xl text-[10px] uppercase"
                                >
                                    Vincular ao Negócio
                                </button>
                            </div>
                        ) : deal.obra ? (
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Nome do Projeto</p>
                                    <p className="text-sm font-bold text-gray-800">{deal.obra.nome}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Endereço de Execução</p>
                                    <p className="text-sm font-bold text-gray-800">{deal.obra.endereco || 'Não informado'}</p>
                                </div>
                                <div className="pt-4 border-t border-gray-50">
                                    <button
                                        onClick={() => navigate(`/obras/${deal.obraId}`)}
                                        className="text-[10px] font-black text-indigo-600 uppercase hover:underline"
                                    >
                                        Ver Orçamento Detalhado →
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="py-6 text-center">
                                <p className="text-[10px] text-gray-400 font-bold uppercase">Nenhum local vinculado.</p>
                                <p className="text-[9px] text-gray-300">Necessário para gerar proposta.</p>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}

