import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { obrasApi, orcamentoApi } from '../lib/api';
import type { Obra, Orcamento } from '../types';
import {
    PiArrowLeft,
    PiUpload,
    PiFileXls,
    PiMoney,
    PiCheckCircle,
    PiSpinner,
    PiWarning,
    PiBuildings
} from 'react-icons/pi';
import { cn } from '../utils/cn';

export function ObraDetalhes() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [obra, setObra] = useState<Obra | null>(null);
    const [loading, setLoading] = useState(true);
    const [orcamento, setOrcamento] = useState<Orcamento | null>(null);
    const [importing, setImporting] = useState(false);
    const [activeTab, setActiveTab] = useState<'geral' | 'orcamento'>('orcamento');

    useEffect(() => {
        if (id) {
            loadObra();
            loadOrcamento();
        }
    }, [id]);

    const loadObra = async () => {
        try {
            const response = await obrasApi.getById(Number(id));
            if (response.success) {
                setObra(response.data);
            }
        } catch (error) {
            console.error(error);
            toast.error('Obra não encontrada');
            navigate('/obras');
        } finally {
            setLoading(false);
        }
    };

    const loadOrcamento = async () => {
        try {
            const response = await orcamentoApi.get(id!);
            if (response.success) {
                setOrcamento(response.data);
            }
        } catch (error) {
            // Silencioso se não tiver orçamento ainda
            console.log('Sem orçamento carregado');
        }
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.name.endsWith('.xlsx')) {
            toast.error('Por favor, envie um arquivo Excel (.xlsx)');
            return;
        }

        if (confirm(`Deseja importar o orçamento do arquivo "${file.name}"? Isso substituirá qualquer orçamento existente desta obra.`)) {
            setImporting(true);
            try {
                await orcamentoApi.importar(id!, file);
                toast.success('Orçamento importado com sucesso!');
                loadOrcamento();
            } catch (error: any) {
                console.error(error);
                toast.error(error.message || 'Erro na importação');
            } finally {
                setImporting(false);
                event.target.value = ''; // Reset input
            }
        } else {
            event.target.value = '';
        }
    };

    if (loading) {
        return <div className="flex justify-center p-12"><PiSpinner className="animate-spin" size={32} /></div>;
    }

    if (!obra) return null;

    // Formatar moeda
    const money = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    return (
        <div className="p-6 max-w-[1600px] mx-auto pb-20">
            {/* Header */}
            <div className="mb-6">
                <button
                    onClick={() => navigate('/obras')}
                    className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-4 transition-colors"
                >
                    <PiArrowLeft /> Voltar para Obras
                </button>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                            <PiBuildings size={32} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">{obra.nome}</h1>
                            <p className="text-gray-500 flex items-center gap-2">
                                <span className={cn(
                                    "w-2 h-2 rounded-full",
                                    obra.status === 'em_andamento' ? "bg-green-500" : "bg-gray-400"
                                )}></span>
                                {obra.status.replace('_', ' ').toUpperCase()} • {obra.endereco}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-6">
                <button
                    onClick={() => setActiveTab('orcamento')}
                    className={cn(
                        "px-6 py-3 font-medium text-sm transition-colors border-b-2",
                        activeTab === 'orcamento'
                            ? "border-blue-600 text-blue-600"
                            : "border-transparent text-gray-500 hover:text-gray-700"
                    )}
                >
                    Orçamento
                </button>
                <button
                    onClick={() => setActiveTab('geral')}
                    className={cn(
                        "px-6 py-3 font-medium text-sm transition-colors border-b-2",
                        activeTab === 'geral'
                            ? "border-blue-600 text-blue-600"
                            : "border-transparent text-gray-500 hover:text-gray-700"
                    )}
                >
                    Visão Geral
                </button>
            </div>

            {/* Conteúdo Aba Orçamento */}
            {activeTab === 'orcamento' && (
                <div className="space-y-6">
                    {/* Header do Orçamento */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                    <PiMoney className="text-green-600" size={24} />
                                    Orçamento Detalhado
                                </h2>
                                <p className="text-sm text-gray-500 mt-1">
                                    {orcamento ? `Base: ${orcamento.dataBase ? new Date(orcamento.dataBase).toLocaleDateString() : 'N/A'}` : 'Carregando...'}
                                </p>
                            </div>

                            <div className="flex items-center gap-3">
                                {orcamento && (
                                    <div className="flex gap-4">
                                        <div className="text-right hidden md:block">
                                            <p className="text-xs text-gray-500 uppercase font-semibold">Custo Direto</p>
                                            <p className="text-lg font-bold text-gray-700">
                                                {money(Number(orcamento.valorTotal) / (1 + (Number(orcamento.bdi) / 100)))}
                                            </p>
                                        </div>
                                        <div className="text-right px-4 border-l border-r border-gray-200 hidden md:block">
                                            <p className="text-xs text-gray-500 uppercase font-semibold">BDI ({Number(orcamento.bdi)}%)</p>
                                            <p className="text-lg font-bold text-green-600">
                                                {money(Number(orcamento.valorTotal) - (Number(orcamento.valorTotal) / (1 + (Number(orcamento.bdi) / 100))))}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-gray-500 uppercase font-semibold">Preço de Venda</p>
                                            <p className="text-2xl font-bold text-blue-600">
                                                {money(Number(orcamento.valorTotal))}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                <div className="h-10 w-px bg-gray-200 mx-2 hidden md:block"></div>

                                <label className={cn(
                                    "flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors cursor-pointer shadow-sm",
                                    importing ? "opacity-50 cursor-wait" : ""
                                )}>
                                    {importing ? <PiSpinner className="animate-spin" /> : <PiUpload />}
                                    <span className="font-medium">{importing ? 'Importando...' : 'Atualizar Planilha'}</span>
                                    <input
                                        type="file"
                                        accept=".xlsx"
                                        className="hidden"
                                        onChange={handleFileUpload}
                                        disabled={importing}
                                    />
                                </label>
                            </div>
                        </div>

                        {!orcamento ? (
                            <div className="text-center py-20 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                                <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <PiFileXls size={32} />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-1">Nenhum orçamento vinculado</h3>
                                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                                    Importe sua planilha de orçamento (.xlsx) para visualizar a estrutura de custos, BDI e gerar propostas comerciais.
                                </p>
                                <label className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer font-medium shadow-md">
                                    <PiUpload size={20} />
                                    Importar Orçamento Agora
                                    <input
                                        type="file"
                                        accept=".xlsx"
                                        className="hidden"
                                        onChange={handleFileUpload}
                                    />
                                </label>
                            </div>
                        ) : (
                            <div className="border border-gray-200 rounded-lg overflow-hidden flex flex-col">
                                {/* Cabeçalho da Tabela */}
                                <div className="grid grid-cols-[80px_1fr_80px_80px_120px_120px_140px] bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider sticky top-0 z-10">
                                    <div className="px-4 py-3">Item</div>
                                    <div className="px-4 py-3">Descrição</div>
                                    <div className="px-4 py-3 text-center">Unid.</div>
                                    <div className="px-4 py-3 text-right">Qtd.</div>
                                    <div className="px-4 py-3 text-right">Unit. (s/ BDI)</div>
                                    <div className="px-4 py-3 text-right">Unit. (c/ BDI)</div>
                                    <div className="px-4 py-3 text-right">Total</div>
                                </div>

                                {/* Corpo da Tabela */}
                                <div className="divide-y divide-gray-100 bg-white">
                                    {orcamento.itens.map((item) => {
                                        const isEtapa = item.tipo === 'etapa';
                                        const valorUnitarioComBDI = Number(item.valorUnitario) * (1 + (Number(orcamento.bdi) / 100));

                                        return (
                                            <div
                                                key={item.id}
                                                className={cn(
                                                    "group transition-colors grid grid-cols-[80px_1fr_80px_80px_120px_120px_140px] items-center text-sm",
                                                    isEtapa ? "bg-blue-50/50 hover:bg-blue-50 border-t border-blue-100 first:border-t-0" : "hover:bg-gray-50"
                                                )}
                                            >
                                                <div className={cn("px-4 py-3 font-mono text-xs", isEtapa ? "font-bold text-blue-700" : "text-gray-500")}>
                                                    {item.wbs}
                                                </div>
                                                <div className="px-4 py-3 relative">
                                                    <div className="flex flex-col">
                                                        <span className={cn(isEtapa ? "font-bold text-gray-900 uppercase text-xs tracking-wide" : "text-gray-700")}>
                                                            {item.descricao}
                                                        </span>
                                                        {item.codigo && (
                                                            <span className="text-[10px] text-gray-400 font-mono mt-0.5">Ref: {item.codigo}</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="px-4 py-3 text-center text-gray-500 text-xs">{item.unidade}</div>
                                                <div className="px-4 py-3 text-right text-gray-600 font-medium">
                                                    {item.quantidade ? Number(item.quantidade).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''}
                                                </div>
                                                <div className="px-4 py-3 text-right text-gray-500 text-xs">
                                                    {item.valorUnitario ? money(Number(item.valorUnitario)) : ''}
                                                </div>
                                                <div className="px-4 py-3 text-right text-gray-600 font-medium group-hover:text-blue-600 transition-colors relative" title="Preço de Venda Unitário">
                                                    {item.valorUnitario ? money(valorUnitarioComBDI) : ''}
                                                </div>
                                                <div className={cn("px-4 py-3 text-right font-bold border-l border-transparent", isEtapa ? "text-blue-700 text-base" : "text-gray-900 group-hover:border-gray-200")}>
                                                    {item.valorTotal ? money(Number(item.valorTotal)) : ''}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'geral' && (
                <div className="text-center py-12 text-gray-500">
                    <PiWarning className="mx-auto mb-2 text-yellow-500" size={32} />
                    Funcionalidade em desenvolvimento...
                </div>
            )}
        </div>
    );
}
