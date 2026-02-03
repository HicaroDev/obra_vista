import { useState } from 'react';
import { FolhaPonto } from './FolhaPonto';
import { PiFileText as FileText, PiChartLineUp as ChartLine, PiMoney as Money } from 'react-icons/pi';
import { cn } from '../utils/cn';

export function Relatorios() {
    const [activeTab, setActiveTab] = useState<'folha' | 'dashboards'>('folha');

    return (
        <div className="p-6 max-w-[1600px] mx-auto min-h-screen">
            <h1 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <FileText className="text-blue-600" />
                Relatórios
            </h1>

            {/* Tabs de Navegação */}
            <div className="flex gap-2 border-b border-gray-200 mb-8 overflow-x-auto">
                <button
                    onClick={() => setActiveTab('folha')}
                    className={cn(
                        "px-6 py-3 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap",
                        activeTab === 'folha'
                            ? "border-blue-600 text-blue-600 bg-blue-50/50"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    )}
                >
                    <Money size={18} />
                    Folha de Pagamento
                </button>
                <button
                    onClick={() => setActiveTab('dashboards')}
                    className={cn(
                        "px-6 py-3 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap",
                        activeTab === 'dashboards'
                            ? "border-blue-600 text-blue-600 bg-blue-50/50"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    )}
                >
                    <ChartLine size={18} />
                    Dashboards (Breve)
                </button>
            </div>

            {/* Conteúdo das Abas */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {activeTab === 'folha' && (
                    <div className="bg-gray-50/50 rounded-2xl border border-gray-200/50">
                        {/* Renderiza o componente FolhaPonto (ajustar CSS interno dele se necessário) */}
                        <FolhaPonto />
                    </div>
                )}

                {activeTab === 'dashboards' && (
                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-gray-300 text-gray-400">
                        <ChartLine size={64} className="mb-4 text-gray-200" />
                        <h2 className="text-xl font-semibold mb-2">Dashboards em Construção</h2>
                        <p>Em breve você terá gráficos e métricas detalhadas aqui.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
