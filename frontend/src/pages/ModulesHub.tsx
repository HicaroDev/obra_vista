import { useNavigate } from 'react-router-dom';
import { useModuleStore } from '../store/moduleStore';
import type { ModuleType } from '../store/moduleStore';
import {
    PiHardHat,
    PiCurrencyDollar,
    PiHandshake,
    PiGear,
    PiArrowRight
} from 'react-icons/pi';
import { cn } from '../utils/cn';
import { SYSTEM_MODULES } from '../constants/modules';

export function ModulesHub() {
    const navigate = useNavigate();
    const { setModule } = useModuleStore();

    const getModuleConfig = (id: string) => {
        switch (id) {
            case 'operacional':
                return { color: 'bg-blue-600', lightColor: 'bg-blue-50 text-blue-600', path: '/obras' };
            case 'financeiro':
                return { color: 'bg-emerald-600', lightColor: 'bg-emerald-50 text-emerald-600', path: '/financeiro' };
            case 'crm':
                return { color: 'bg-purple-600', lightColor: 'bg-purple-50 text-purple-600', path: '/crm' };
            case 'gestao':
                return { color: 'bg-slate-700', lightColor: 'bg-slate-50 text-slate-700', path: '/' };
            default:
                return { color: 'bg-gray-600', lightColor: 'bg-gray-50 text-gray-600', path: '/' };
        }
    };

    const modules = SYSTEM_MODULES.map(m => {
        const config = getModuleConfig(m.id);
        return {
            id: m.id as ModuleType,
            title: m.label,
            description: m.description,
            icon: m.icon,
            ...config
        };
    });

    const handleSelectModule = (module: ModuleType, path: string) => {
        setModule(module);
        navigate(path);
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background Decorativo Suave */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-100/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-100/40 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

            <div className="w-full max-w-6xl z-10">
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4 text-slate-900 tracking-tight">
                        Bem-vindo ao <span className="text-blue-600">Obra Vista</span>
                    </h1>
                    <p className="text-slate-500 text-lg max-w-2xl mx-auto font-medium">
                        Selecione o módulo que deseja acessar para iniciar suas atividades.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {modules.map((m) => (
                        <button
                            key={m.id}
                            onClick={() => handleSelectModule(m.id, m.path)}
                            className="group bg-white border border-slate-200 hover:border-blue-400 rounded-2xl p-6 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 text-left flex flex-col h-full relative overflow-hidden shadow-sm"
                        >
                            <div className={cn("w-14 h-14 rounded-xl flex items-center justify-center mb-5 text-2xl transition-colors", m.lightColor)}>
                                <m.icon />
                            </div>

                            <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-blue-700 transition-colors">
                                {m.title}
                            </h3>

                            <p className="text-slate-500 text-sm leading-relaxed mb-8 flex-1 group-hover:text-slate-600">
                                {m.description}
                            </p>

                            <div className="flex items-center text-sm font-bold text-blue-600 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all mt-auto">
                                Acessar Módulo <PiArrowRight className="ml-2" />
                            </div>
                        </button>
                    ))}
                </div>

                <div className="mt-16 text-center">
                    <p className="text-slate-400 text-sm font-medium">
                        © 2024 Obra Vista. Todos os direitos reservados.
                    </p>
                </div>
            </div>
        </div>
    );
}
