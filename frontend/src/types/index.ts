export type PlanetType =
    | 'SUN'
    | 'MERCURY'
    | 'VENUS'
    | 'EARTH'
    | 'MARS'
    | 'JUPITER'
    | 'SATURN'
    | 'URANUS'
    | 'NEPTUNE';

export const PLANET_TYPES: PlanetType[] = [
    'SUN',
    'MERCURY',
    'VENUS',
    'EARTH',
    'MARS',
    'JUPITER',
    'SATURN',
    'URANUS',
    'NEPTUNE',
];

export const ORBIT_PLANET_TYPES: Exclude<PlanetType, 'SUN'>[] = [
    'MERCURY',
    'VENUS',
    'EARTH',
    'MARS',
    'JUPITER',
    'SATURN',
    'URANUS',
    'NEPTUNE',
];

export const PLANET_TYPE_LABELS: Record<PlanetType, string> = {
    SUN: '태양',
    MERCURY: '수성',
    VENUS: '금성',
    EARTH: '지구',
    MARS: '화성',
    JUPITER: '목성',
    SATURN: '토성',
    URANUS: '천왕성',
    NEPTUNE: '해왕성',
};
export type SlotIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type CommitType = 'feat' | 'fix' | 'docs' | 'refactor' | 'chore' | 'style';

export type PlanetTheme =
    | 'FUTURE_CITY'
    | 'RESEARCH_DOME'
    | 'PRIMEVAL_FOREST'
    | 'ORIGIN_TREE';

export type PlanetAssetType =
    | 'BUILDING_GLASS'
    | 'BUILDING_SOLID'
    | 'TREE_ANCIENT'
    | 'TREE_WORLD'
    | 'TREE_HOLOGRAM'
    | 'DEFENSE_TURRET'
    | 'ROCK_MOSS'
    | 'FLOWER_SUNFLOWER'
    | 'PATH_NEON'
    | 'PATH_METAL'
    | 'PATH_ROOT'
    | 'PATH_STONE'
    | 'DOCS_PANEL'
    | 'DOCS_ANTENNA'
    | 'DOCS_MONOLITH'
    | 'DOCS_SIGNPOST'
    | 'DECO_DRONE'
    | 'DECO_ROVER'
    | 'DECO_SPIRIT'
    | 'DECO_BUTTERFLY'
    | 'DECO_STREETLAMP'
    | 'DECO_SUPPLY_BOX'
    | 'DECO_MUSHROOM'
    | 'DECO_FENCE'
    | 'UNKNOWN';

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

export interface PlanetAsset {
    id: string;
    type: PlanetAssetType;
    position: Vector3;
    rotation?: Vector3;
    scale: number;
    sourceCommitId: string;
}

export interface PlanetStats {
    theme: PlanetTheme;
    totalCommits: number;
    level: number;
}

export interface PlanetConfig {
    theme: PlanetTheme;
    assets: PlanetAsset[];
    stats: {
        featCount: number;
        fixCount: number;
        totalCount: number;
    };
}
