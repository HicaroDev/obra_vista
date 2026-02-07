
import { useState, useEffect } from 'react';
import { crmApi, obrasApi } from '../../lib/api';
import { toast } from 'sonner';
import { PiPlus, PiSpinner, PiX, PiUser, PiBuilding, PiMoney } from 'react-icons/pi';

interface NewDealModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function NewDealModal({ open, onClose, onSuccess }: NewDealModalProps) {
    const [loading, setLoading] = useState(false);
    const [fetchingData, setFetchingData] = useState(false);
    const [leads, setLeads] = useState<any[]>([]);
    const [obras, setObras] = useState<any[]>([]);

    // Form states
    const [titulo, setTitulo] = useState('');
    const [leadId, setLeadId] = useState('');
    const [obraId, setObraId] = useState('');
    const [valorEstimado, setValorEstimado] = useState('');
    const [estagio, setEstagio] = useState('prospeccao');

    // New Obra inline form
    const [showNewObraForm, setShowNewObraForm] = useState(false);
    const [newObraNome, setNewObraNome] = useState('');
    const [newObraEndereco, setNewObraEndereco] = useState('');

    useEffect(() => {
        if (open) {
            loadInitialData();
            // Reset form
            setTitulo('');
            setLeadId('');
            setObraId('');
            setValorEstimado('');
            setEstagio('prospeccao');
            setShowNewObraForm(false);
            setNewObraNome('');
            setNewObraEndereco('');
        }
    }, [open]);

    const loadInitialData = async () => {
        setFetchingData(true);
        try {
            const [leadsRes, obrasRes] = await Promise.all([
                crmApi.leads.getAll(),
                obrasApi.getAll()
            ]);
            if (leadsRes.success) setLeads(leadsRes.data);
            if (obrasRes.success) setObras(obrasRes.data);
        } catch (error) {
            console.error(error);
            toast.error('Erro ao carregar dados auxiliares');
        } finally {
            setFetchingData(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!titulo || !leadId) {
            toast.error('Título e Lead são obrigatórios');
            return;
        }

        setLoading(true);
        try {
            let finalObraId = obraId || undefined;

            // Se o usuário optou por criar uma obra agora
            if (showNewObraForm && newObraNome && newObraEndereco) {
                const obraRes = await (obrasApi.create({
                    nome: newObraNome,
                    endereco: newObraEndereco,
                    status: 'orcamento'
                }) as Promise<any>);
                if (obraRes.success) {
                    finalObraId = String(obraRes.data.id);
                } else {
                    toast.error('Erro ao criar a obra preliminar');
                    setLoading(false);
                    return;
                }
            }

            const response = await crmApi.deals.create({
                titulo,
                leadId,
                obraId: finalObraId,
                valorEstimado: valorEstimado || 0,
                estagio
            });

            if (response.success) {
                toast.success('Novo negócio criado com sucesso!');
                onSuccess();
                onClose();
            }
        } catch (error) {
            console.error(error);
            toast.error('Erro ao criar negócio');
        } finally {
            setLoading(false);
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                            <PiPlus size={20} />
                        </div>
                        <h2 className="text-xl font-bold text-gray-800">Novo Negócio</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <PiX size={24} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-sm font-bold text-gray-700">Título / Identificação</label>
                        <input
                            type="text"
                            required
                            placeholder="Ex: Reforma Apartamento 402"
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                            value={titulo}
                            onChange={e => setTitulo(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <div className="flex justify-between items-center">
                                <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                    <PiUser className="text-blue-500" /> Lead (Cliente)
                                </label>
                                <a href="/crm/leads" className="text-[10px] text-blue-600 font-bold hover:underline">+ Cadastrar Novo</a>
                            </div>
                            <select
                                required
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none text-sm"
                                value={leadId}
                                onChange={e => setLeadId(e.target.value)}
                            >
                                <option value="">Selecione um lead...</option>
                                {leads.map(lead => (
                                    <option key={lead.id} value={lead.id}>{lead.nome} {lead.empresa ? `(${lead.empresa})` : ''}</option>
                                ))}
                            </select>
                            {leads.length === 0 && !fetchingData && (
                                <p className="text-[10px] text-red-500 font-medium">Você ainda não tem leads cadastrados.</p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex justify-between items-center">
                                <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                    <PiBuilding className="text-indigo-500" /> Obra Vinculada
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setShowNewObraForm(!showNewObraForm)}
                                    className="text-[10px] text-blue-600 font-bold hover:underline"
                                >
                                    {showNewObraForm ? '- Cancelar Novo' : '+ Cadastrar Nova'}
                                </button>
                            </div>

                            {!showNewObraForm ? (
                                <select
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none text-sm"
                                    value={obraId}
                                    onChange={e => setObraId(e.target.value)}
                                >
                                    <option value="">Nenhuma obra (venda avulsa)</option>
                                    {obras.map(obra => (
                                        <option key={obra.id} value={obra.id}>{obra.nome}</option>
                                    ))}
                                </select>
                            ) : (
                                <div className="space-y-2 p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                                    <input
                                        type="text"
                                        placeholder="Nome da Obra (ex: Reforma Sala)"
                                        className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg text-[13px] outline-none"
                                        value={newObraNome}
                                        onChange={e => setNewObraNome(e.target.value)}
                                    />
                                    <input
                                        type="text"
                                        placeholder="Endereço Completo"
                                        className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg text-[13px] outline-none"
                                        value={newObraEndereco}
                                        onChange={e => setNewObraEndereco(e.target.value)}
                                    />
                                    <p className="text-[9px] text-blue-500 font-medium">* No win do negócio, os dados serão validados.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                <PiMoney className="text-green-600" /> Valor Estimado
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                placeholder="0,00"
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                                value={valorEstimado}
                                onChange={e => setValorEstimado(e.target.value)}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-gray-700">Estágio Inicial</label>
                            <select
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none text-sm"
                                value={estagio}
                                onChange={e => setEstagio(e.target.value)}
                            >
                                <option value="prospeccao">Prospecção</option>
                                <option value="qualificacao">Qualificação</option>
                                <option value="proposta">Proposta Enviada</option>
                                <option value="negociacao">Negociação</option>
                            </select>
                        </div>
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={loading || fetchingData}
                            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-200"
                        >
                            {loading ? <PiSpinner className="animate-spin" size={20} /> : <PiPlus size={20} />}
                            Criar Negócio
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
