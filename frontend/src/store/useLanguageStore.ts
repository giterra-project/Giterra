import { create } from 'zustand';
import type { LanguageState } from '../types/store';

export const useLanguageStore = create<LanguageState>((set, get) => ({
    language: 'KO',
    toggleLanguage: () => set((state) => ({ language: state.language === 'KO' ? 'EN' : 'KO' })),
    t: (koText: string, enText: string) => {
        return get().language === 'KO' ? koText : enText;
    },
}));