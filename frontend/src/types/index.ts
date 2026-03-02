export type PlanetType = '수성' | '금성' | '지구' | '화성' | '목성' | '토성' | '천왕성' | '해왕성';
export type SlotIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type CommitType = 'feat' | 'fix' | 'docs' | 'refactor' | 'chore' | 'style';

export interface Vector3 {
    x: number;
    y: number;
    z: number;
}

export interface CommitData {
    id: string;
    message: string;
    type: CommitType;
    date: string;
}

export interface Repository {
    id: number;
    name: string;
    description: string;
    featCount: number;
    fixCount: number;
    language: string;
}

export interface PlacementData {
    repo_id: number;
    slot_index: SlotIndex;
    planet_type: PlanetType;
}

export interface SolarSystemConfig {
    userId: number;
    placements: PlacementData[];
}