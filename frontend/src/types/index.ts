export type PlanetTheme =
    | 'FUTURE_CITY'
    | 'RESEARCH_DOME'
    | 'PRIMEVAL_FOREST'
    | 'ORIGIN_TREE';

export type CommitType = 'feat' | 'fix' | 'docs' | 'refactor' | 'chore' | 'style';

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

export interface PlanetAsset {
    id: string;
    type: PlanetAssetType;
    position: Vector3;
    rotation?: Vector3;
    scale: number;
    sourceCommitId: string;
}

export interface Repository {
    id: number;
    name: string;
    description: string;
    featCount: number;
    fixCount: number;
    language: string;
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