import type { PlanetType, SlotIndex, PlacementData } from './index';

export type Language = 'KO' | 'EN';

export interface User {
    id: string;
    login: string;
    avatar_url: string;
    html_url?: string;
}

export interface AuthState {
    user: User | null;
    accessToken: string | null;
    isAuthenticated: boolean;
    isLoggingIn: boolean;
    login: () => void;
    setAuth: (user: User, token: string) => void;
    clearAuth: () => void;
    resetLoggingIn: () => void;
}

export interface PlanetStore {
    serverPlacements: PlacementData[];
    localPlacements: PlacementData[];
    isSaving: boolean;
    errorMessage: string | null;
    setServerPlacements: (placements: PlacementData[]) => void;
    movePlacement: (repoId: number, targetSlot: SlotIndex, planetType: PlanetType) => void;
    saveToServer: () => Promise<void>;
    resetLocalChanges: () => void;
    clearError: () => void;
}

export interface LanguageState {
    language: Language;
    toggleLanguage: () => void;
    t: (ko: string, en: string) => string;
}