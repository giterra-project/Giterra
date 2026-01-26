export interface Repository {
    id: number;
    name: string;
    description: string;
    featCount: number;
    fixCount: number;
    language: string;
}

export interface PlanetStats {
    theme: 'FUTURE_CITY' | 'LAB_DOME' | 'PRIMITIVE_FOREST' | 'START_TREE';
    totalCommits: number;
    level: number;
}