import { useState, useEffect } from 'react';
import { frequenciaApi, obrasApi } from '../lib/api';
import type { FrequenciaDiaria, Obra } from '../types';
import {
    PiCalendarCheck as CalendarIcon,
    PiBuildings as Building,
    PiSpinner as Spinner,
    PiMagnifyingGlass as Search,
    PiFloppyDisk as Save,
    PiCheckCircle as CheckCircle
} from 'react-icons/pi';
import { cn } from '../utils/cn';
import { toast } from 'sonner';

export function Frequencia() {
    const [dataSelecionada, setDataSelecionada] = useState(new Date().toISOString().split('T')[0]);
    const [prestadores, setPrestadores] = useState<FrequenciaDiaria[]>([]);
    const [obras, setObras] = useState<Obra[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [salvandoId, setSalvandoId] = useState<number | null>(null);
    const [sucessoId, setSucessoId] = useState<number | null>(null);
    const [activeTab, setActiveTab] = useState<'pendentes' | 'presentes'>('pendentes');
    const [filtroObra, setFiltroObra] = useState<string>('');

    // Estado local para controle de edições antes de salvar
    const [edicoes, setEdicoes] = useState<Record<number, { obraId?: number | null, presente: boolean }>>({});

    useEffect(() => {
        loadDados();
    }, [dataSelecionada]);

    const loadDados = async () => {
        setLoading(true);
        try {
            const [freqRes, obrasRes] = await Promise.all([
                frequenciaApi.getByData(dataSelecionada),
                obrasApi.getAll()
            ]);

            if (freqRes.success) {
                setPrestadores(freqRes.data);
                // Inicializa o estado de edições com os dados vindos do banco
                const estadoInicial: Record<number, any> = {};
                freqRes.data.forEach(p => {
                    estadoInicial[p.prestadorId] = {
                        obraId: p.obraId,
                        presente: p.presente
                    };
                });
                setEdicoes(estadoInicial);
            }
            if (obrasRes.success) setObras(obrasRes.data.filter(o => o.status !== 'concluido' && o.status !== 'cancelado'));

        } catch (error) {
            console.error('Erro ao carregar dados:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (prestadorId: number, campo: 'presente' | 'obraId', valor: any) => {
        setEdicoes(prev => ({
            ...prev,
            [prestadorId]: {
                ...prev[prestadorId],
                [campo]: valor
            }
        }));
    };

    const handleSalvar = async (prestador: FrequenciaDiaria, presenteOverride?: boolean) => {
        const dadosEditados = edicoes[prestador.prestadorId];
        // Se undefined, assume obra nula e presente false, mas aqui queremos forçar presença se botao clicado
        const obraId = dadosEditados?.obraId;
        const presente = presenteOverride !== undefined ? presenteOverride : (dadosEditados?.presente ?? true);

        if (presente && !obraId) {
            // Toast ou balanço visual seria melhor, mas alert simples por enquanto ou validação no botão
            return;
        }

        setSalvandoId(prestador.prestadorId);
        try {
            await frequenciaApi.salvar({
                data: dataSelecionada,
                prestadorId: prestador.prestadorId,
                obraId: obraId,
                presente: presente,
                observacao: ''
            });

            // Atualiza estado local
            setPrestadores(prev => prev.map(p =>
                p.prestadorId === prestador.prestadorId
                    ? { ...p, obraId: obraId, presente: presente }
                    : p
            ));

            // Atualiza edições também para manter sinc
            setEdicoes(prev => ({
                ...prev,
                [prestador.prestadorId]: { obraId, presente }
            }));

            setSucessoId(prestador.prestadorId);
            setTimeout(() => setSucessoId(null), 2000);

        } catch (error) {
            console.error('Erro ao salvar:', error);
            // Idealmente usar toast aqui
        } finally {
            setSalvandoId(null);
        }
    };

    // Separação das listas
    const prestadoresFiltradosBusca = prestadores.filter(p =>
        p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.especialidade.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const listaPendentes = prestadoresFiltradosBusca.filter(p => {
        const estado = edicoes[p.prestadorId];
        return !estado?.presente;
    });

    const listaPresentes = prestadoresFiltradosBusca.filter(p => {
        const estado = edicoes[p.prestadorId];
        // Se tem filtro de obra, aplica
        if (filtroObra && estado?.obraId?.toString() !== filtroObra) return false;
        return estado?.presente;
    });

    const totalPresentes = Object.values(edicoes).filter(e => e?.presente).length;

    // Componente de Linha da Tabela (para evitar repetição e limpar o render principal)
    const PrestadorRow = ({ p, isPresentesTab }: { p: FrequenciaDiaria, isPresentesTab: boolean }) => {
        const estado = edicoes[p.prestadorId] || { presente: false, obraId: null };
        const isSaving = salvandoId === p.prestadorId;
        const isSuccess = sucessoId === p.prestadorId;

        return (
            <div className={cn(
                "group flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl border transition-all hover:shadow-md",
                estado.presente ? "bg-green-50/30 border-green-100" : "bg-white border-gray-100"
            )}>
                {/* Info Prestador */}
                <div className="flex items-center gap-4 flex-1 w-full sm:w-auto">
                    <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0",
                        estado.presente ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                    )}>
                        {p.nome.charAt(0)}
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900">{p.nome}</h3>
                        <span className="text-xs px-2 py-0.5 bg-gray-100 rounded text-gray-600 font-medium">
                            {p.especialidade}
                        </span>
                    </div>
                </div>

                {/* Controles */}
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">

                    {/* Select Obra */}
                    <select
                        value={estado.obraId || ''}
                        onChange={(e) => handleChange(p.prestadorId, 'obraId', e.target.value ? parseInt(e.target.value) : null)}
                        className={cn(
                            "w-full sm:w-64 text-sm p-2 rounded-lg border outline-none transition-all",
                            (estado.presente || estado.obraId)
                                ? "border-blue-200 bg-white focus:border-blue-500"
                                : "border-gray-200 bg-gray-50 text-gray-600"
                        )}
                    >
                        <option value="">Selecione a obra...</option>
                        {obras.map(obra => (
                            <option key={obra.id} value={obra.id}>{obra.nome}</option>
                        ))}
                    </select>

                    {/* Toggle Switch (Ativar/Desativar) */}
                    <button
                        onClick={() => {
                            const novoEstado = !estado.presente;
                            if (novoEstado && !estado.obraId) {
                                return toast.warning('Selecione uma obra antes de ativar a presença.');
                            }
                            // Se estiver desativando, pede confirmação
                            if (estado.presente && !novoEstado) {
                                if (!confirm('Remover presença?')) return;
                            }
                            handleSalvar(p, novoEstado);
                        }}
                        disabled={isSaving}
                        className={cn(
                            "w-14 h-8 rounded-full transition-colors relative focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 box-content border-2",
                            estado.presente ? "bg-green-500 border-green-500" : "bg-gray-200 border-transparent hover:bg-gray-300",
                            isSaving ? "opacity-50 cursor-wait" : ""
                        )}
                        title={estado.presente ? "Desativar presença" : "Confirmar presença"}
                    >
                        <span
                            className={cn(
                                "block w-6 h-6 bg-white rounded-full shadow-sm transform transition-transform absolute top-0.5 left-0.5 flex items-center justify-center",
                                estado.presente ? "translate-x-6" : "translate-x-0"
                            )}
                        >
                            {isSaving && <Spinner className="animate-spin text-gray-400" size={12} />}
                        </span>
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="p-6 max-w-[1600px] mx-auto min-h-screen pb-20">
            {/* Cabecalho */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm sticky top-4 z-10">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <CalendarIcon className="text-blue-600" />
                        Ponto Virtual
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Controle de presença diário. {totalPresentes} de {prestadores.length} presentes.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                    <input
                        type="date"
                        value={dataSelecionada}
                        onChange={(e) => setDataSelecionada(e.target.value)}
                        className="px-4 py-2 border border-gray-200 rounded-xl focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 outline-none font-medium text-gray-700"
                    />
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar prestador..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 w-full sm:w-64 border border-gray-200 rounded-xl focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 outline-none"
                        />
                    </div>
                </div>
            </div>

            {/* Tabs & Filtros */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                <div className="flex p-1 bg-gray-100 rounded-xl w-full sm:w-auto">
                    <button
                        onClick={() => setActiveTab('pendentes')}
                        className={cn(
                            "flex-1 sm:flex-none px-6 py-2 rounded-lg text-sm font-medium transition-all",
                            activeTab === 'pendentes'
                                ? "bg-white text-blue-600 shadow-sm"
                                : "text-gray-500 hover:text-gray-700"
                        )}
                    >
                        Lista de Chamada ({listaPendentes.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('presentes')}
                        className={cn(
                            "flex-1 sm:flex-none px-6 py-2 rounded-lg text-sm font-medium transition-all",
                            activeTab === 'presentes'
                                ? "bg-white text-green-600 shadow-sm"
                                : "text-gray-500 hover:text-gray-700"
                        )}
                    >
                        Presentes Hoje ({listaPresentes.length}/{totalPresentes})
                    </button>
                </div>

                {/* Filtro Extra para Aba Presentes */}
                {activeTab === 'presentes' && (
                    <div className="w-full sm:w-64 animate-in fade-in slide-in-from-right-4 duration-300">
                        <select
                            value={filtroObra}
                            onChange={(e) => setFiltroObra(e.target.value)}
                            className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:border-blue-500 outline-none text-sm"
                        >
                            <option value="">Todas as obras</option>
                            {obras.map(obra => (
                                <option key={obra.id} value={obra.id}>{obra.nome}</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><Spinner className="animate-spin text-blue-600" size={40} /></div>
            ) : (
                <div className="space-y-3">
                    {activeTab === 'pendentes' ? (
                        <>
                            {listaPendentes.length === 0 ? (
                                <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed text-gray-500">
                                    <CheckCircle size={48} className="mx-auto text-green-500 mb-3 opacity-20" />
                                    <p>Todos os prestadores foram registrados hoje!</p>
                                </div>
                            ) : (
                                listaPendentes.map(p => (
                                    <PrestadorRow key={p.prestadorId} p={p} isPresentesTab={false} />
                                ))
                            )}
                        </>
                    ) : (
                        <>
                            {listaPresentes.length === 0 ? (
                                <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed text-gray-500">
                                    <p>Nenhum prestador presente encontrado com os filtros atuais.</p>
                                </div>
                            ) : (
                                listaPresentes.map(p => (
                                    <PrestadorRow key={p.prestadorId} p={p} isPresentesTab={true} />
                                ))
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
