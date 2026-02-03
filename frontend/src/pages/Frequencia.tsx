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

export function Frequencia() {
    const [dataSelecionada, setDataSelecionada] = useState(new Date().toISOString().split('T')[0]);
    const [prestadores, setPrestadores] = useState<FrequenciaDiaria[]>([]);
    const [obras, setObras] = useState<Obra[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [salvandoId, setSalvandoId] = useState<number | null>(null);
    const [sucessoId, setSucessoId] = useState<number | null>(null);

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

    const handleSalvar = async (prestador: FrequenciaDiaria) => {
        const dadosEditados = edicoes[prestador.prestadorId];
        if (!dadosEditados) return;

        setSalvandoId(prestador.prestadorId);
        try {
            await frequenciaApi.salvar({
                data: dataSelecionada,
                prestadorId: prestador.prestadorId,
                obraId: dadosEditados.obraId,
                presente: dadosEditados.presente,
                observacao: '' // Observação removida
            });

            // Atualiza a lista principal para refletir o salvo (opcional, já que o estado local domina)
            setPrestadores(prev => prev.map(p =>
                p.prestadorId === prestador.prestadorId
                    ? { ...p, ...dadosEditados }
                    : p
            ));

            // Feedback Visual
            setSucessoId(prestador.prestadorId);
            setTimeout(() => setSucessoId(null), 2000);

        } catch (error) {
            console.error('Erro ao salvar:', error);
            alert('Erro ao salvar. Tente novamente.');
        } finally {
            setSalvandoId(null);
        }
    };

    const filteredPrestadores = prestadores.filter(p =>
        p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.especialidade.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPresentes = Object.values(edicoes).filter(e => e?.presente).length;

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

            {loading ? (
                <div className="flex justify-center py-20"><Spinner className="animate-spin text-blue-600" size={40} /></div>
            ) : filteredPrestadores.length === 0 ? (
                <div className="text-center py-20 text-gray-500 bg-white rounded-2xl border border-dashed border-gray-200">
                    Nenhum prestador encontrado.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredPrestadores.map((p) => {
                        const estado = edicoes[p.prestadorId] || { presente: false, obraId: null };
                        const isSaving = salvandoId === p.prestadorId;
                        const isSuccess = sucessoId === p.prestadorId;

                        return (
                            <div
                                key={p.prestadorId}
                                className={cn(
                                    "bg-white rounded-xl border p-4 transition-all shadow-sm hover:shadow-md flex flex-col gap-4",
                                    estado.presente ? "border-green-200 bg-green-50/20" : "border-gray-200"
                                )}
                            >
                                {/* Cabeçalho do Card */}
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm",
                                            estado.presente ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                                        )}>
                                            {p.nome.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900 line-clamp-1">{p.nome}</h3>
                                            <span className="text-xs px-2 py-0.5 bg-gray-100 rounded text-gray-600 font-medium">
                                                {p.especialidade}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Toggle Switch */}
                                    <button
                                        onClick={() => handleChange(p.prestadorId, 'presente', !estado.presente)}
                                        className={cn(
                                            "w-12 h-7 rounded-full transition-colors relative focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
                                            estado.presente ? "bg-green-500" : "bg-gray-300"
                                        )}
                                    >
                                        <span
                                            className={cn(
                                                "block w-5 h-5 bg-white rounded-full shadow transform transition-transform absolute top-1 left-1",
                                                estado.presente ? "translate-x-5" : "translate-x-0"
                                            )}
                                        />
                                    </button>
                                </div>

                                {/* Seletor de Obra */}
                                <div className={cn("transition-opacity", estado.presente ? "opacity-100" : "opacity-60")}>
                                    <label className="text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1">
                                        <Building size={14} /> Obra Atual
                                    </label>
                                    <select
                                        value={estado.obraId || ''}
                                        onChange={(e) => handleChange(p.prestadorId, 'obraId', e.target.value ? parseInt(e.target.value) : null)}
                                        className="w-full text-sm p-2.5 rounded-lg border border-gray-200 bg-white focus:border-blue-500 outline-none"
                                    >
                                        <option value="">Selecione uma obra...</option>
                                        {obras.map(obra => (
                                            <option key={obra.id} value={obra.id}>{obra.nome}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Botão Salvar */}
                                <button
                                    onClick={() => handleSalvar(p)}
                                    disabled={isSaving || (estado.presente && !estado.obraId)}
                                    className={cn(
                                        "mt-auto w-full py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 transition-all",
                                        isSuccess
                                            ? "bg-green-500 text-white shadow-green-200"
                                            : "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200",
                                        "shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
                                    )}
                                    title={estado.presente && !estado.obraId ? "Selecione uma obra para salvar" : ""}
                                >
                                    {isSaving ? (
                                        <><Spinner className="animate-spin" size={18} /> Salvando...</>
                                    ) : isSuccess ? (
                                        <><CheckCircle size={18} /> Salvo!</>
                                    ) : (
                                        <><Save size={18} /> Salvar</>
                                    )}
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
