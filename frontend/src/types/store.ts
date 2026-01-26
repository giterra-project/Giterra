export type Language = 'KO' | 'EN';

export type PlanetTheme = 'FUTURE_CITY' | 'LAB_DOME' | 'PRIMITIVE_FOREST' | 'START_TREE';

export interface User {
    id: string;
    githubId: string;
    name: string;
    avatarUrl: string;
}

export interface AuthState {
    user: User | null;
    accessToken: string | null;
    isAuthenticated: boolean;
    setAuth: (user: User, token: string) => void;
    clearAuth: () => void;
}

export interface PlanetConfig {
    theme: PlanetTheme;
    repsitoryCount: number;
    isCustomized: boolean;
}

export interface PlanetState {
    config: PlanetConfig;
    setTheme: (theme: PlanetTheme) => void;
    updateConfig: (config: Partial<PlanetConfig>) => void;
    resetConfig: () => void;
}

export interface LanguageState {
    language: Language;
    toggleLanguage: () => void;
    t: (ko: string, en: string) => string;
}