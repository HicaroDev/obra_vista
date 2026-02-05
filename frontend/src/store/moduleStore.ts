import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Adaptação para novos módulos (ids minúsculos vindos de SYSTEM_MODULES)
export type ModuleType = 'gestao' | 'operacional' | 'recursos' | 'suprimentos' | 'financeiro' | 'sistema' | 'OPERATIONAL' | 'FINANCIAL' | 'CRM' | 'MANAGEMENT' | null;

interface ModuleState {
    activeModule: ModuleType;
    setModule: (module: ModuleType) => void;
}

export const useModuleStore = create<ModuleState>()(
    persist(
        (set) => ({
            activeModule: null, // Default é null para forçar a seleção
            setModule: (module) => set({ activeModule: module }),
        }),
        {
            name: 'obravista-module-storage',
        }
    )
);
