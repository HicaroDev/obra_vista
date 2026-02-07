import { useState, useEffect } from 'react';
import {
    PiPackage, PiWrench, PiMagnifyingGlass, PiPlus,
    PiPencil, PiTrash, PiSpinner, PiCoins
} from 'react-icons/pi';
import { toast } from 'sonner';
import { insumosApi, composicoesApi } from '../lib/api';

type TabType = 'insumos' | 'composicoes';

export function Catalogos() {
    const [activeTab, setActiveTab] = useState<TabType>('insumos');
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any[]>([]);
    const [search, setSearch] = useState('');

    const fetchData = async () => {
        setLoading(true);
        try {
            const api = activeTab === 'insumos' ? insumosApi : composicoesApi;
            const response = await api.getAll({ busca: search });
            setData(response.data || []);
        } catch (error) {
            toast.error('Erro ao carregar dados');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchData();
        }, 500);
        return () => clearTimeout(timer);
    }, [activeTab, search]);

    const handleDelete = async (id: number) => {
        if (!confirm('Tem certeza que deseja excluir?')) return;
        try {
            const api = activeTab === 'insumos' ? insumosApi : composicoesApi;
            await api.delete(id);
            toast.success('Item excluído com sucesso');
            fetchData();
        } catch (error) {
            toast.error('Erro ao excluir item');
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Catálogos</h1>
                    <p className="text-gray-600">Gerencie insumos e composições padrão</p>
                </div>
                <button
                    onClick={() => toast.info('Funcionalidade de criação em breve!')}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <PiPlus /> Novo {activeTab === 'insumos' ? 'Insumo' : 'Composição'}
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Tabs */}
                <div className="flex border-b border-gray-100">
                    <button
                        onClick={() => setActiveTab('insumos')}
                        className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${activeTab === 'insumos'
                            ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                            : 'text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        <PiPackage size={20} />
                        Insumos
                    </button>
                    <button
                        onClick={() => setActiveTab('composicoes')}
                        className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${activeTab === 'composicoes'
                            ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                            : 'text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        <PiWrench size={20} />
                        Composições
                    </button>
                </div>

                {/* Search */}
                <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                    <div className="relative">
                        <PiMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder={`Buscar ${activeTab}...`}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                    </div>
                </div>

                {/* List */}
                <div className="divide-y divide-gray-100">
                    {loading ? (
                        <div className="p-8 flex justify-center text-gray-400">
                            <PiSpinner className="animate-spin text-2xl" />
                        </div>
                    ) : data.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            Nenhum item encontrado.
                        </div>
                    ) : (
                        data.map((item) => (
                            <div key={item.id} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between group">
                                <div className="flex items-center gap-4">
                                    <div className={`p-2 rounded-lg ${activeTab === 'insumos' ? 'bg-orange-100 text-orange-600' : 'bg-purple-100 text-purple-600'}`}>
                                        {activeTab === 'insumos' ? <PiPackage size={20} /> : <PiWrench size={20} />}
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-gray-900 flex items-center gap-2">
                                            {item.descricao}
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-normal">
                                                {item.codigo}
                                            </span>
                                        </h3>
                                        <div className="text-sm text-gray-500 flex items-center gap-4 mt-1">
                                            <span className="flex items-center gap-1">
                                                <PiCoins size={14} />
                                                {activeTab === 'insumos'
                                                    ? Number(item.custoPadrao || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                                                    : 'Composição'
                                                }
                                            </span>
                                            <span className="text-gray-300">|</span>
                                            <span>Un: {item.unidade}</span>
                                            {item.tipo && (
                                                <>
                                                    <span className="text-gray-300">|</span>
                                                    <span className="capitalize">{item.tipo.replace('_', ' ')}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => toast.info('Edição em breve')}
                                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    >
                                        <PiPencil size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(item.id)}
                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <PiTrash size={18} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
