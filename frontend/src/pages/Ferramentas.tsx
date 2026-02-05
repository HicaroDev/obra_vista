import { useState, useEffect } from 'react';
// import { useAuthStore } from '../store/authStore';
import { ferramentasApi, obrasApi, prestadoresApi } from '../lib/api';
import type { Ferramenta, MovimentacaoFerramenta } from '../lib/api';
import {
    PiWrench as ToolIcon,
    PiPlus as Plus,
    PiMagnifyingGlass as Search,
    PiPencilSimple as Edit2,
    // PiTrash as Trash2,
    PiArrowsLeftRight as Exchange,
    PiClock as History,
    // PiCheck as Check,
    // PiWarning as Warning,
    PiX as X,
    PiSpinner as Loader2,
    PiMapPin as Location,
    PiUser as User
} from 'react-icons/pi';
import { cn } from '../utils/cn';

export function Ferramentas() {
    // const { user } = useAuthStore();
    const [ferramentas, setFerramentas] = useState<Ferramenta[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [stats, setStats] = useState({ total: 0, disponiveis: 0, em_uso: 0, manutencao: 0 });

    // Modais
    const [showCadastroModal, setShowCadastroModal] = useState(false);
    const [showMovimentacaoModal, setShowMovimentacaoModal] = useState(false);
    const [showHistoricoModal, setShowHistoricoModal] = useState(false);

    // Estados de Seleção/Edição
    const [selectedFerramenta, setSelectedFerramenta] = useState<Ferramenta | null>(null);
    const [historico, setHistorico] = useState<MovimentacaoFerramenta[]>([]);

    // Dados para Selects
    const [obras, setObras] = useState<any[]>([]);
    const [prestadores, setPrestadores] = useState<any[]>([]);

    // Formulários
    const [formCadastro, setFormCadastro] = useState({ nome: '', marca: '', codigo: '', status: 'disponivel' });
    const [formMovimentacao, setFormMovimentacao] = useState({
        acao: 'saida',
        obraId: '',
        responsavelId: '',
        observacao: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [ferramentasRes, statsRes] = await Promise.all([
                ferramentasApi.getAll(),
                ferramentasApi.getStats()
            ]);

            if (ferramentasRes.success) setFerramentas(ferramentasRes.data);
            if (statsRes.success) setStats(statsRes.data);
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadSelectData = async () => {
        if (obras.length > 0) return; // Já carregado
        try {
            const [obrasRes, prestadoresRes] = await Promise.all([
                obrasApi.getAll(),
                prestadoresApi.getAll()
            ]);
            if (obrasRes.success) setObras(obrasRes.data);
            if (prestadoresRes.success) setPrestadores(prestadoresRes.data);
        } catch (error) {
            console.error('Erro ao carregar auxiliares:', error);
        }
    };

    // --- CADASTRO ---
    const handleSaveCadastro = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (selectedFerramenta) {
                await ferramentasApi.update(selectedFerramenta.id, formCadastro as any);
                alert('Ferramenta atualizada!');
            } else {
                await ferramentasApi.create(formCadastro as any);
                alert('Ferramenta criada!');
            }
            setShowCadastroModal(false);
            loadData();
        } catch (error) {
            alert('Erro ao salvar');
        }
    };

    // --- MOVIMENTAÇÃO ---
    const handleOpenMovimentacao = async (f: Ferramenta) => {
        setSelectedFerramenta(f);
        await loadSelectData();

        // Se estiver disponivel: Saida
        // Se estiver em uso: Devolução ou Transferência
        const acao = f.status === 'disponivel' ? 'saida' : 'devolucao';

        setFormMovimentacao({
            acao,
            obraId: '',
            responsavelId: '',
            observacao: ''
        });
        setShowMovimentacaoModal(true);
    };

    const handleSaveMovimentacao = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFerramenta) return;

        try {
            await ferramentasApi.registrarMovimentacao({
                ferramentaId: selectedFerramenta.id,
                acao: formMovimentacao.acao as any,
                obraId: formMovimentacao.obraId ? Number(formMovimentacao.obraId) : undefined,
                responsavelId: formMovimentacao.responsavelId ? Number(formMovimentacao.responsavelId) : undefined,
                observacao: formMovimentacao.observacao
            });
            setShowMovimentacaoModal(false);
            loadData();
            alert('Movimentação registrada!');
        } catch (error) {
            alert('Erro ao registrar movimentação');
        }
    };

    // --- HISTÓRICO ---
    const handleOpenHistorico = async (f: Ferramenta) => {
        setSelectedFerramenta(f);
        setShowHistoricoModal(true);
        try {
            const res = await ferramentasApi.getHistorico(f.id);
            if (res.success) setHistorico(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    // Filtros
    const filtered = ferramentas.filter(f =>
        f.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.codigo?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusColor = (status: string) => {
        const map: any = {
            'disponivel': 'bg-green-100 text-green-800',
            'em_uso': 'bg-blue-100 text-blue-800',
            'manutencao': 'bg-yellow-100 text-yellow-800',
            'extraviada': 'bg-red-100 text-red-800'
        };
        return map[status] || 'bg-gray-100 text-gray-800';
    };

    return (
        <div className="p-6 max-w-[1600px] mx-auto">
            {/* Header */}
            <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestão de Ferramentas</h1>
                    <p className="text-muted-foreground">Controle de patrimônio, rastreio e manutenção</p>
                </div>
                <button
                    onClick={() => {
                        setSelectedFerramenta(null);
                        setFormCadastro({ nome: '', marca: '', codigo: '', status: 'disponivel' });
                        setShowCadastroModal(true);
                    }}
                    className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2 font-medium"
                >
                    <Plus size={20} /> Nova Ferramenta
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                    <p className="text-gray-500 text-sm font-medium">Total de Itens</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                    <p className="text-green-600 text-sm font-medium">Disponíveis</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{stats.disponiveis}</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                    <p className="text-blue-600 text-sm font-medium">Em Uso</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{stats.em_uso}</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                    <p className="text-yellow-600 text-sm font-medium">Em Manutenção</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{stats.manutencao}</p>
                </div>
            </div>

            {/* Search */}
            <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                    type="text"
                    placeholder="Buscar por nome, código ou marca..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all shadow-sm"
                />
            </div>

            {/* Tabela */}
            {loading ? (
                <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-600" size={40} /></div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
                    <ToolIcon className="mx-auto text-gray-300 mb-4" size={50} />
                    <p className="text-gray-500 font-medium">Nenhuma ferramenta encontrada.</p>
                </div>
            ) : (
                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Ferramenta</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Localização Atual</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filtered.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500">
                                                <ToolIcon size={20} />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900">{item.nome}</p>
                                                <p className="text-xs text-gray-500">{item.marca} • {item.codigo || 'S/N'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium uppercase", getStatusColor(item.status))}>
                                            {item.status.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {item.status === 'em_uso' && item.localizacao_atual ? (
                                            <div className="text-sm">
                                                {item.localizacao_atual.obra && (
                                                    <div className="flex items-center gap-1.5 text-gray-900 font-medium">
                                                        <Location size={14} className="text-blue-500" />
                                                        {item.localizacao_atual.obra.nome}
                                                    </div>
                                                )}
                                                {item.localizacao_atual.responsavel && (
                                                    <div className="flex items-center gap-1.5 text-gray-500 mt-1">
                                                        <User size={14} />
                                                        {item.localizacao_atual.responsavel.nome}
                                                    </div>
                                                )}
                                                <div className="text-xs text-gray-400 mt-1">
                                                    Desde: {new Date(item.localizacao_atual.dataSaida!).toLocaleDateString()}
                                                </div>
                                            </div>
                                        ) : (
                                            <span className="text-gray-400 text-sm">-</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => handleOpenMovimentacao(item)}
                                                className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                                                title="Movimentar (Entrada/Saída)"
                                            >
                                                <Exchange size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleOpenHistorico(item)}
                                                className="p-2 hover:bg-purple-50 text-purple-600 rounded-lg transition-colors border border-transparent hover:border-purple-100"
                                                title="Histórico"
                                            >
                                                <History size={18} />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSelectedFerramenta(item);
                                                    setFormCadastro(item as any);
                                                    setShowCadastroModal(true);
                                                }}
                                                className="p-2 hover:bg-gray-100 text-gray-500 rounded-lg transition-colors"
                                                title="Editar"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* MODAL CADASTRO */}
            {showCadastroModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold">{selectedFerramenta ? 'Editar Ferramenta' : 'Nova Ferramenta'}</h2>
                            <button onClick={() => setShowCadastroModal(false)}><X size={24} /></button>
                        </div>
                        <form onSubmit={handleSaveCadastro} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Nome da Ferramenta</label>
                                <input required type="text" value={formCadastro.nome} onChange={e => setFormCadastro({ ...formCadastro, nome: e.target.value })} className="w-full input-field border rounded-lg p-2" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Marca</label>
                                    <input type="text" value={formCadastro.marca} onChange={e => setFormCadastro({ ...formCadastro, marca: e.target.value })} className="w-full input-field border rounded-lg p-2" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Código/Patrimônio</label>
                                    <input type="text" value={formCadastro.codigo} onChange={e => setFormCadastro({ ...formCadastro, codigo: e.target.value })} className="w-full input-field border rounded-lg p-2" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Status Inicial</label>
                                <select value={formCadastro.status} onChange={e => setFormCadastro({ ...formCadastro, status: e.target.value })} className="w-full input-field border rounded-lg p-2">
                                    <option value="disponivel">Disponível</option>
                                    <option value="manutencao">Em Manutenção</option>
                                    <option value="extraviada">Extraviada</option>
                                </select>
                            </div>
                            <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium mt-2">Salvar</button>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL MOVIMENTAÇÃO */}
            {showMovimentacaoModal && selectedFerramenta && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold">Registrar Movimentação</h2>
                            <button onClick={() => setShowMovimentacaoModal(false)}><X size={24} /></button>
                        </div>

                        <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-lg">
                            {selectedFerramenta.status === 'disponivel' ? (
                                <button
                                    className="flex-1 py-2 rounded-md font-medium bg-white text-blue-700 shadow-sm transition-all"
                                >
                                    Saída (Retirada)
                                </button>
                            ) : (
                                <>
                                    <button
                                        onClick={() => setFormMovimentacao({ ...formMovimentacao, acao: 'devolucao' })}
                                        className={cn(
                                            "flex-1 py-2 rounded-md font-medium transition-all text-sm",
                                            formMovimentacao.acao === 'devolucao' ? "bg-white text-green-700 shadow-sm" : "text-gray-500 hover:bg-gray-200"
                                        )}
                                    >
                                        Devolução (Base)
                                    </button>
                                    <button
                                        onClick={() => setFormMovimentacao({ ...formMovimentacao, acao: 'transferencia' })}
                                        className={cn(
                                            "flex-1 py-2 rounded-md font-medium transition-all text-sm",
                                            formMovimentacao.acao === 'transferencia' ? "bg-white text-orange-700 shadow-sm" : "text-gray-500 hover:bg-gray-200"
                                        )}
                                    >
                                        Transferir (Outra Obra)
                                    </button>
                                </>
                            )}
                        </div>

                        <form onSubmit={handleSaveMovimentacao} className="space-y-4">
                            {(formMovimentacao.acao === 'saida' || formMovimentacao.acao === 'transferencia') ? (
                                <>
                                    {formMovimentacao.acao === 'transferencia' && (
                                        <div className="text-sm text-orange-600 bg-orange-50 p-3 rounded-lg border border-orange-100 mb-2">
                                            Transferência direta: A ferramenta sairá da obra atual e irá para a nova obra selecionada.
                                        </div>
                                    )}
                                    <div>
                                        <label className="block text-sm font-medium mb-1">
                                            {formMovimentacao.acao === 'transferencia' ? 'Nova Obra de Destino' : 'Obra de Destino'}
                                        </label>
                                        <select required value={formMovimentacao.obraId} onChange={e => setFormMovimentacao({ ...formMovimentacao, obraId: e.target.value })} className="w-full input-field border rounded-lg p-2">
                                            <option value="">Selecione a Obra...</option>
                                            {obras.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Responsável</label>
                                        <select required value={formMovimentacao.responsavelId} onChange={e => setFormMovimentacao({ ...formMovimentacao, responsavelId: e.target.value })} className="w-full input-field border rounded-lg p-2">
                                            <option value="">Selecione o Prestador...</option>
                                            {prestadores.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                                        </select>
                                    </div>
                                </>
                            ) : (
                                <div className="p-4 bg-green-50 border border-green-100 rounded-lg text-green-800 text-sm">
                                    <p className="font-semibold">Confirmar devolução para o estoque?</p>
                                    <p className="mt-1 opacity-80">
                                        Local Atual: <b>{selectedFerramenta.localizacao_atual?.obra?.nome || 'N/A'}</b>
                                    </p>
                                    <p className="mt-1 opacity-80">A ferramenta ficará disponível novamente na base.</p>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium mb-1">Observações</label>
                                <textarea className="w-full border rounded-lg p-2" rows={3} value={formMovimentacao.observacao} onChange={e => setFormMovimentacao({ ...formMovimentacao, observacao: e.target.value })}></textarea>
                            </div>

                            <button
                                type="submit"
                                className={cn(
                                    "w-full text-white py-3 rounded-xl font-medium mt-2 transition-colors",
                                    formMovimentacao.acao === 'transferencia' ? "bg-orange-600 hover:bg-orange-700" :
                                        formMovimentacao.acao === 'devolucao' ? "bg-green-600 hover:bg-green-700" :
                                            "bg-blue-600 hover:bg-blue-700"
                                )}
                            >
                                {formMovimentacao.acao === 'transferencia' ? 'Confirmar Transferência' :
                                    formMovimentacao.acao === 'devolucao' ? 'Confirmar Devolução' : 'Confirmar Saída'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL HISTÓRICO */}
            {showHistoricoModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
                        <div className="p-6 border-b flex justify-between items-center bg-gray-50 rounded-t-2xl">
                            <div>
                                <h2 className="text-xl font-bold">Histórico de Movimentações</h2>
                                <p className="text-sm text-gray-500">{selectedFerramenta?.nome}</p>
                            </div>
                            <button onClick={() => setShowHistoricoModal(false)}><X size={24} /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6">
                            {historico.length === 0 ? (
                                <p className="text-center text-gray-500 py-10">Nenhum histórico encontrado.</p>
                            ) : (
                                <div className="relative border-l-2 border-gray-200 ml-3 space-y-8">
                                    {historico.map((mov) => (
                                        <div key={mov.id} className="relative pl-8">
                                            <div className={cn(
                                                "absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 bg-white",
                                                mov.status === 'devolvida' ? "border-green-500" : "border-blue-500"
                                            )}></div>

                                            <div className="mb-1">
                                                <span className="text-sm text-gray-500">{new Date(mov.dataSaida).toLocaleDateString()} às {new Date(mov.dataSaida).toLocaleTimeString().slice(0, 5)}</span>
                                            </div>

                                            <div className="bg-white border rounded-lg p-3 shadow-sm">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <p className="font-semibold text-gray-900">
                                                            {mov.status === 'devolvida' ? 'Devolução Concluída' : 'Saída Registrada'}
                                                        </p>
                                                        <p className="text-sm text-gray-600 mt-1">
                                                            Obra: <span className="font-medium text-gray-900">{mov.obraNome || 'N/A'}</span>
                                                        </p>
                                                        <p className="text-sm text-gray-600">
                                                            Responsável: <span className="font-medium text-gray-900">{mov.responsavelNome || 'N/A'}</span>
                                                        </p>
                                                    </div>
                                                    {mov.dataDevolucao && (
                                                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Devolvido em {new Date(mov.dataDevolucao).toLocaleDateString()}</span>
                                                    )}
                                                </div>
                                                {mov.observacao && (
                                                    <p className="text-sm text-gray-500 mt-2 italic bg-gray-50 p-2 rounded">"{mov.observacao}"</p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
