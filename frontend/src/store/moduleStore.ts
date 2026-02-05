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
            activeModule: 'OPERATIONAL', // Default para não quebrar fluxo atual
            setModule: (module) => set({ activeModule: module }),
        }),
        {
            name: 'obravista-module-storage',
        }
    )
);
