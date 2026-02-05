import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ModuleType = 'OPERATIONAL' | 'FINANCIAL' | 'CRM' | 'MANAGEMENT' | null;

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
