export type Language = 'KO' | 'EN';

export type PlanetTheme = 'FUTURE_CITY' | 'LAB_DOME' | 'PRIMITIVE_FOREST' | 'START_TREE';

export interface RepoDetail {
    name: string;
    description?: string;
    language?: string;
    stars: number;
    updated_at?: string;
    building_type?: string;
    analysis_type?: string;
    analysis_summary?: string;
    analysis_sub1?: string;
    analysis_sub2?: string;
    analysis_sub3?: string;
    last_analyzed?: string;
}

export interface PlanetData {
    username: string;
    persona: string;
    theme: string;
    total_score: number;
    overall_analysis?: string;
    repositories: RepoDetail[];
}

export interface User {
    login: string;
    avatar_url: string;
    name: string;
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