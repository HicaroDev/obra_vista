import { useState, useEffect } from 'react';
import { frequenciaApi } from '../lib/api';
import {
    PiPrinter as Printer,
    PiSpinner as Spinner,
    PiPlus as Plus,
    PiX as X,
    PiClockCounterClockwise as HistoryIcon
} from 'react-icons/pi';

interface FolhaItem {
    id: number;
    nome: string;
    funcao: string;
    valorDiaria: number;
    diasTrabalhados: number;
    valorTotal: number;
    descontos: number;
    pixTipo?: string;
    pixChave?: string;
    // Dados CLT (opcionais na visualização em lista, mas úteis)
    tipoContrato?: string;
    salario?: number;
    valorAdiantamento?: number;
}

interface ItemHistorico {
    id: number;
    data: string;
    valor: string; // Vem como string numérica do banco ou number
    descricao: string;
    createdAt: string;
}

export function FolhaPonto() {
    // Padrão: dia 1 do mês até hoje
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

    const [inicio, setInicio] = useState(firstDay.toISOString().split('T')[0]);
    const [fim, setFim] = useState(today.toISOString().split('T')[0]);
    const [dados, setDados] = useState<FolhaItem[]>([]);
    const [loading, setLoading] = useState(false);

    // Estado do Modal de Desconto
    const [showModal, setShowModal] = useState(false);
    const [selectedPrestador, setSelectedPrestador] = useState<FolhaItem | null>(null);
    const [descontoValor, setDescontoValor] = useState('');
    const [descontoDescricao, setDescontoDescricao] = useState('');
    const [savingDesconto, setSavingDesconto] = useState(false);

    // Estado do Modal de Histórico
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [historyData, setHistoryData] = useState<ItemHistorico[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    const formatDate = (dateString: string) => {
        if (!dateString) return '';
        const [year, month, day] = dateString.split('T')[0].split('-');
        return `${day}/${month}/${year}`;
    };

    const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    const gerarRelatorio = async () => {
        setLoading(true);
        try {
            const res = await frequenciaApi.getRelatorio(inicio, fim);
            if (res.success) {
                setDados(res.data);
            }
        } catch (error) {
            console.error('Erro ao gerar folha:', error);
            alert('Erro ao gerar relatório');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDesconto = (item: FolhaItem) => {
        setSelectedPrestador(item);
        setDescontoValor('');
        setDescontoDescricao('');
        setShowModal(true);
    };

    const handleOpenHistorico = async (item: FolhaItem) => {
        setSelectedPrestador(item);
        setShowHistoryModal(true);
        setLoadingHistory(true);
        setHistoryData([]);

        try {
            const res = await frequenciaApi.getDescontos(item.id, inicio, fim);
            if (res.success) {
                setHistoryData(res.data);
            }
        } catch (error) {
            console.error('Erro ao buscar histórico:', error);
        } finally {
            setLoadingHistory(false);
        }
    };

    const handleSalvarDesconto = async () => {
        if (!selectedPrestador || !descontoValor) return;

        const valorNumerico = parseFloat(descontoValor.replace(',', '.'));
        if (isNaN(valorNumerico) || valorNumerico <= 0) {
            alert('Valor inválido');
            return;
        }

        setSavingDesconto(true);
        try {
            await frequenciaApi.addDesconto({
                prestadorId: selectedPrestador.id,
                data: fim, // Data do desconto será a data final do período (ou hoje)
                valor: valorNumerico,
                descricao: descontoDescricao || 'Desconto em Folha'
            });
            setShowModal(false);
            gerarRelatorio(); // Recarrega os dados para atualizar totais
        } catch (error) {
            console.error('Erro ao salvar desconto:', error);
            alert('Erro ao salvar desconto');
        } finally {
            setSavingDesconto(false);
        }
    };

    // Carregar ao abrir
    useEffect(() => {
        gerarRelatorio();
    }, []);

    const totalGeral = dados.reduce((acc, item) => acc + item.valorTotal, 0);

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="pb-20 print:p-0 print:bg-white w-full relative">
            {/* Header - Oculto na impressão */}
            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 mb-8 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm print:hidden">
                <div className="flex-1">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-1">
                        Folha Detalhada
                    </h2>
                    <p className="text-sm text-gray-500">
                        {inicio} até {fim}
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 items-end w-full xl:w-auto">
                    <div>
                        <label className="text-xs font-semibold text-gray-500 mb-1 block">Início</label>
                        <input
                            type="date"
                            value={inicio}
                            onChange={(e) => setInicio(e.target.value)}
                            className="px-4 py-2 border border-gray-200 rounded-xl focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 outline-none text-gray-700"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-gray-500 mb-1 block">Fim</label>
                        <input
                            type="date"
                            value={fim}
                            onChange={(e) => setFim(e.target.value)}
                            className="px-4 py-2 border border-gray-200 rounded-xl focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 outline-none text-gray-700"
                        />
                    </div>
                    <button
                        onClick={gerarRelatorio}
                        className="px-5 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium transition-colors h-[42px]"
                    >
                        Filtrar
                    </button>
                    <button
                        onClick={handlePrint}
                        className="px-5 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-medium transition-colors flex items-center gap-2 h-[42px]"
                    >
                        <Printer size={20} /> Imprimir
                    </button>
                </div>
            </div>

            {/* Cabeçalho de Impressão (Só aparece ao imprimir) */}
            <div className="hidden print:block mb-6 text-center border-b pb-4">
                <h1 className="text-2xl font-bold text-gray-900">Relatório de Pagamento - Prestadores</h1>
                <p className="text-gray-600">Período: {formatDate(inicio)} a {formatDate(fim)}</p>
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><Spinner className="animate-spin text-blue-600" size={40} /></div>
            ) : dados.length === 0 ? (
                <div className="text-center py-20 text-gray-500 bg-white rounded-2xl border border-dashed border-gray-200">
                    Nenhum registro encontrado neste período.
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm print:shadow-none print:border-black">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-100 print:bg-gray-100 print:text-black">
                                <tr>
                                    <th className="px-6 py-4">Nome / Função</th>
                                    <th className="px-6 py-4 text-center">Referência</th>
                                    <th className="px-6 py-4 text-right">Base Calc.</th>
                                    <th className="px-6 py-4 text-right">Descontos / Vales</th>
                                    <th className="px-6 py-4 text-right font-bold w-40">Líquido</th>
                                    <th className="px-6 py-4">Dados Pagamento</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {dados.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50 transition-colors print:hover:bg-transparent">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">{item.nome}</div>
                                            <div className="text-xs text-gray-500">{item.funcao}</div>
                                            {item.tipoContrato === 'clt' && <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded ml-1">CLT</span>}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {item.tipoContrato === 'clt' ? (
                                                <span className="text-xs text-gray-500">Mês Ref.</span>
                                            ) : (
                                                <span className="inline-block bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-md font-medium border border-blue-100 print:border-0 print:bg-transparent print:text-black">
                                                    {item.diasTrabalhados} Dias
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right text-gray-600">
                                            {item.tipoContrato === 'clt' ? (
                                                <div className="text-xs">
                                                    Salário: {formatCurrency(Number(item.salario || 0))}<br />
                                                    Vale: {formatCurrency(Number(item.valorAdiantamento || 0))}
                                                </div>
                                            ) : (
                                                formatCurrency(Number(item.valorDiaria))
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 group">
                                                <span className="text-red-500 font-medium">
                                                    {item.descontos > 0 ? `-${formatCurrency(item.descontos)}` : '-'}
                                                </span>
                                                <button
                                                    onClick={() => handleOpenDesconto(item)}
                                                    className="w-6 h-6 flex items-center justify-center rounded bg-blue-50 text-blue-600 hover:bg-blue-100 hover:scale-105 transition-all print:hidden"
                                                    title="Adicionar Desconto"
                                                >
                                                    <Plus size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleOpenHistorico(item)}
                                                    className="w-6 h-6 flex items-center justify-center rounded bg-zinc-100 text-zinc-600 hover:bg-zinc-200 hover:scale-105 transition-all print:hidden"
                                                    title="Ver Histórico de Descontos"
                                                >
                                                    <HistoryIcon size={14} />
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-gray-900 text-base">
                                            {formatCurrency(item.valorTotal)}
                                        </td>
                                        <td className="px-6 py-4 text-xs text-gray-500 max-w-[200px]">
                                            {item.pixChave ? (
                                                <>
                                                    <span className="font-semibold text-gray-700 uppercase">{item.pixTipo}:</span> <br />
                                                    {item.pixChave}
                                                </>
                                            ) : (
                                                <span className="text-orange-400 italic">Sem Pix</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-gray-50 font-bold text-gray-900 border-t border-gray-200 print:bg-gray-100">
                                <tr>
                                    <td colSpan={4} className="px-6 py-4 text-right uppercase text-xs tracking-wider text-gray-500">Total a Pagar</td>
                                    <td className="px-6 py-4 text-right text-lg text-blue-600 print:text-black">{formatCurrency(totalGeral)}</td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            )}

            {/* Modal de Desconto */}
            {showModal && selectedPrestador && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 relative">
                        <button
                            onClick={() => setShowModal(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                        >
                            <X size={24} />
                        </button>

                        <h3 className="text-xl font-bold text-gray-900 mb-1">Adicionar Desconto</h3>
                        <p className="text-sm text-gray-500 mb-6">Prestador: {selectedPrestador.nome}</p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Valor do Desconto (R$)</label>
                                <input
                                    type="number"
                                    value={descontoValor}
                                    onChange={(e) => setDescontoValor(e.target.value)}
                                    placeholder="0,00"
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-lg font-semibold outline-none"
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Motivo / Descrição</label>
                                <input
                                    type="text"
                                    value={descontoDescricao}
                                    onChange={(e) => setDescontoDescricao(e.target.value)}
                                    placeholder="Ex: Adiantamento, EPI, Atraso"
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 outline-none"
                                />
                            </div>

                            <button
                                onClick={handleSalvarDesconto}
                                disabled={savingDesconto}
                                className="w-full py-3 bg-red-500 text-white font-medium rounded-xl hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20 disabled:opacity-70 mt-4"
                            >
                                {savingDesconto ? 'Salvando...' : 'Confirmar Desconto'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Histórico */}
            {showHistoryModal && selectedPrestador && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-0 overflow-hidden relative flex flex-col max-h-[80vh]">
                        <div className="p-4 border-b flex items-center justify-between bg-zinc-50">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Histórico de Descontos</h3>
                                <p className="text-xs text-gray-500">{selectedPrestador.nome}</p>
                            </div>
                            <button
                                onClick={() => setShowHistoryModal(false)}
                                className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-zinc-200"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="overflow-y-auto p-4 flex-1">
                            {loadingHistory ? (
                                <div className="flex justify-center py-6"><Spinner className="animate-spin text-blue-500" size={24} /></div>
                            ) : historyData.length === 0 ? (
                                <div className="text-center py-8 text-gray-400">
                                    <HistoryIcon className="mx-auto mb-2 opacity-50" size={32} />
                                    Nenhum desconto ou adiantamento lançado neste período.
                                </div>
                            ) : (
                                <ul className="space-y-3">
                                    {historyData.map((item) => (
                                        <li key={item.id} className="flex items-start justify-between p-3 bg-zinc-50 rounded-lg border border-zinc-100">
                                            <div>
                                                <p className="font-medium text-gray-900 text-sm">{item.descricao}</p>
                                                <p className="text-xs text-gray-500">{formatDate(item.data)}</p>
                                            </div>
                                            <span className="font-bold text-red-600 text-sm">
                                                - {formatCurrency(Number(item.valor))}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <div className="p-4 bg-zinc-50 border-t">
                            <button
                                onClick={() => setShowHistoryModal(false)}
                                className="w-full py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
