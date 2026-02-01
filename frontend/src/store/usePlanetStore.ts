import { create } from 'zustand';
import type { PlanetState, PlanetTheme, PlanetConfig } from '../types/store';

const initialConfig: PlanetConfig = {
    theme: 'START_TREE',
    repsitoryCount: 0,
    isCustomized: false,
};

export const usePlanetStore = create<PlanetState>((set) => ({
    config: initialConfig,
    setTheme: (theme: PlanetTheme) =>
        set((state) => ({
            config: { ...state.config, theme },
        })),
    updateConfig: (newConfig: Partial<PlanetConfig>) =>
        set((state) => ({
            config: { ...state.config, ...newConfig },
        })),
    resetConfig: () => set({ config: initialConfig }),
}));