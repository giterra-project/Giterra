import type { CommitData, PlanetAsset, PlanetConfig, PlanetTheme, PlanetAssetType, Vector3 } from '../types';

const FEAT_THRESHOLD = 5;
const FIX_THRESHOLD = 5;
const PLANET_RADIUS = 100;

// [좌표계 일치] Three.js SphereGeometry의 세그먼트 구조와 동일한 각도 범위 계산
const getSegmentLimits = (segmentIndex: number) => {
    // 0~3: 북반구 (Top), 4~7: 남반구 (Bottom)
    const isTop = segmentIndex < 4;
    const quadrant = segmentIndex % 4;

    const padding = 0.15; // 경계선에 너무 딱 붙지 않게 여백 추가

    // Phi (위도): Y축 기준 (0: 북극, PI: 남극)
    // isTop ? 0~PI/2 : PI/2~PI
    const phiMin = isTop ? padding : (Math.PI / 2) + padding;
    const phiMax = isTop ? (Math.PI / 2) - padding : Math.PI - padding;

    // Theta (경도): Y축 회전각
    // 0, 90, 180, 270도 순서
    const thetaMin = quadrant * (Math.PI / 2) + padding;
    const thetaMax = (quadrant + 1) * (Math.PI / 2) - padding;

    return { phiMin, phiMax, thetaMin, thetaMax };
};

// [핵심 수정] Three.js Vertex Generation Formula 적용
const sphericalToCartesianConstrained = (
    radius: number,
    phiRatio: number,
    thetaRatio: number,
    segmentIndex: number
): Vector3 => {
    const { phiMin, phiMax, thetaMin, thetaMax } = getSegmentLimits(segmentIndex);

    // 비율을 실제 각도로 변환
    const phi = phiMin + (phiRatio * (phiMax - phiMin));
    const theta = thetaMin + (thetaRatio * (thetaMax - thetaMin));

    // ★ Three.js SphereGeometry 내부 공식과 100% 일치시킴
    // x = -r * cos(theta) * sin(phi)
    // y = r * cos(phi)
    // z = r * sin(theta) * sin(phi)
    return {
        x: -radius * Math.cos(theta) * Math.sin(phi),
        y: radius * Math.cos(phi),
        z: radius * Math.sin(theta) * Math.sin(phi)
    };
};

const determineTheme = (featCount: number, fixCount: number): PlanetTheme => {
    if (featCount < 3) return 'ORIGIN_TREE';

    const isHighFeat = featCount >= FEAT_THRESHOLD;
    const isHighFix = fixCount >= FIX_THRESHOLD;

    if (isHighFeat && isHighFix) return 'FUTURE_CITY';
    if (!isHighFeat && isHighFix) return 'RESEARCH_DOME';
    return 'PRIMEVAL_FOREST';
};

export const generatePlanetFromCommits = (commits: CommitData[], segmentIndex: number): PlanetConfig => {
    const feats = commits.filter(c => c.type === 'feat');
    const fixes = commits.filter(c => c.type === 'fix');
    const refactors = commits.filter(c => c.type === 'refactor');
    const docs = commits.filter(c => c.type === 'docs');
    const chores = commits.filter(c => c.type === 'chore');
    const styles = commits.filter(c => c.type === 'style');

    const featCount = feats.length;
    const fixCount = fixes.length;
    const theme = determineTheme(featCount, fixCount);

    const assets: PlanetAsset[] = [];

    // ==========================================
    // 1. Feat (Main Structures)
    // ==========================================
    if (theme === 'ORIGIN_TREE') {
        const treeScale = Math.min(25, 8 + (featCount * 2));
        assets.push({
            id: `origin-tree-${segmentIndex}`,
            type: 'TREE_WORLD',
            // 구역의 정중앙 (0.5, 0.5)
            position: sphericalToCartesianConstrained(PLANET_RADIUS, 0.5, 0.5, segmentIndex),
            scale: treeScale,
            sourceCommitId: 'combined-feats'
        });
    } else {
        feats.forEach((commit, index) => {
            let type: PlanetAssetType;
            let scale = 1;
            let phiRatio = 0.5, thetaRatio = 0.5;

            if (theme === 'FUTURE_CITY') {
                const cols = Math.ceil(Math.sqrt(feats.length));
                const row = Math.floor(index / cols);
                const col = index % cols;
                phiRatio = (row + 0.5) / cols;
                thetaRatio = (col + 0.5) / cols;
                type = 'BUILDING_GLASS';
                scale = 1.5;
            } else if (theme === 'RESEARCH_DOME') {
                phiRatio = (index + 0.5) / feats.length;
                thetaRatio = (index % 2 === 0 ? 0.3 : 0.7) + (Math.random() * 0.2 - 0.1);
                type = 'BUILDING_SOLID';
                scale = 1.2;
            } else {
                phiRatio = Math.random();
                thetaRatio = Math.random();
                type = 'TREE_ANCIENT';
                scale = 2 + Math.random();
            }

            const pos = sphericalToCartesianConstrained(PLANET_RADIUS, phiRatio, thetaRatio, segmentIndex);
            assets.push({ id: `feat-${segmentIndex}-${commit.id}`, type, position: pos, scale, sourceCommitId: commit.id });
        });
    }

    // ==========================================
    // 2. Fix (Decorations)
    // ==========================================
    fixes.forEach((commit, index) => {
        let type: PlanetAssetType;
        let scale = 1;
        let phiRatio = Math.random();
        let thetaRatio = Math.random();

        if (theme === 'ORIGIN_TREE') {
            const angleStep = (Math.PI * 2) / (fixes.length || 1);
            const r = 0.3;
            const theta = angleStep * index;
            // 0~1 범위로 정규화 (cos, sin 결과는 -1~1 이므로 보정)
            phiRatio = 0.5 + (r * Math.cos(theta)) * 0.5;
            thetaRatio = 0.5 + (r * Math.sin(theta)) * 0.5;

            type = 'FLOWER_SUNFLOWER';
            scale = 3.0;
        } else if (theme === 'FUTURE_CITY') {
            type = 'TREE_HOLOGRAM';
            scale = 0.8;
        } else if (theme === 'RESEARCH_DOME') {
            type = 'DEFENSE_TURRET';
            scale = 1.0;
        } else {
            type = 'ROCK_MOSS';
            scale = 1.0 + Math.random();
        }

        const pos = sphericalToCartesianConstrained(PLANET_RADIUS, phiRatio, thetaRatio, segmentIndex);
        assets.push({ id: `fix-${segmentIndex}-${commit.id}`, type, position: pos, scale, sourceCommitId: commit.id });
    });

    // ==========================================
    // 3. Refactor (Paths)
    // ==========================================
    refactors.forEach((commit, index) => {
        let type: PlanetAssetType;
        let scale = 1;
        let phiRatio = Math.random();
        let thetaRatio = Math.random();

        if (theme === 'ORIGIN_TREE') {
            const angleStep = (Math.PI * 2) / (refactors.length || 1);
            const r = 0.15;
            const theta = angleStep * index;
            phiRatio = 0.5 + (r * Math.cos(theta)) * 0.5;
            thetaRatio = 0.5 + (r * Math.sin(theta)) * 0.5;
            type = 'PATH_STONE';
            scale = 0.5 + Math.random() * 0.5;
        } else if (theme === 'FUTURE_CITY') {
            type = 'PATH_NEON';
            scale = 1.0;
        } else if (theme === 'RESEARCH_DOME') {
            type = 'PATH_METAL';
            scale = 0.8;
        } else {
            type = 'PATH_ROOT';
            scale = 1.5;
        }

        const pos = sphericalToCartesianConstrained(PLANET_RADIUS, phiRatio, thetaRatio, segmentIndex);
        assets.push({ id: `refactor-${segmentIndex}-${commit.id}`, type, position: pos, scale, sourceCommitId: commit.id });
    });

    // ==========================================
    // 4. Docs
    // ==========================================
    docs.forEach((commit) => {
        let type: PlanetAssetType;
        let scale = 1;
        let phiRatio = Math.random();
        let thetaRatio = Math.random();

        if (theme === 'ORIGIN_TREE') {
            type = 'DOCS_SIGNPOST';
            scale = 0.7;
        } else if (theme === 'PRIMEVAL_FOREST') {
            type = 'DOCS_MONOLITH';
            scale = 1.5;
        } else if (theme === 'FUTURE_CITY') {
            const floatRadius = PLANET_RADIUS + 5;
            const floatPos = sphericalToCartesianConstrained(floatRadius, phiRatio, thetaRatio, segmentIndex);
            assets.push({ id: `docs-${segmentIndex}-${commit.id}`, type: 'DOCS_PANEL', position: floatPos, scale: 1.0, sourceCommitId: commit.id });
            return;
        } else {
            type = 'DOCS_ANTENNA';
            scale = 1.0;
        }

        const pos = sphericalToCartesianConstrained(PLANET_RADIUS, phiRatio, thetaRatio, segmentIndex);
        assets.push({ id: `docs-${segmentIndex}-${commit.id}`, type, position: pos, scale, sourceCommitId: commit.id });
    });

    // ==========================================
    // 5. Chore (Floating)
    // ==========================================
    chores.forEach((commit) => {
        let type: PlanetAssetType;
        let scale = 1;
        const phiRatio = Math.random();
        const thetaRatio = Math.random();
        const altitude = 10 + Math.random() * 15;
        const posBase = sphericalToCartesianConstrained(PLANET_RADIUS + altitude, phiRatio, thetaRatio, segmentIndex);

        if (theme === 'ORIGIN_TREE') {
            type = 'DECO_BUTTERFLY';
            scale = 0.5;
        } else if (theme === 'FUTURE_CITY') {
            type = 'DECO_DRONE';
            scale = 0.8;
        } else if (theme === 'RESEARCH_DOME') {
            type = 'DECO_ROVER';
            scale = 0.7;
            const groundPos = sphericalToCartesianConstrained(PLANET_RADIUS, phiRatio, thetaRatio, segmentIndex);
            assets.push({ id: `chore-${segmentIndex}-${commit.id}`, type, position: groundPos, scale, sourceCommitId: commit.id });
            return;
        } else {
            type = 'DECO_SPIRIT';
            scale = 1.0;
        }

        assets.push({ id: `chore-${segmentIndex}-${commit.id}`, type, position: posBase, scale, sourceCommitId: commit.id });
    });

    // ==========================================
    // 6. Style
    // ==========================================
    styles.forEach((commit) => {
        let type: PlanetAssetType;
        let scale = 1;
        const phiRatio = Math.random();
        const thetaRatio = Math.random();

        if (theme === 'ORIGIN_TREE') {
            type = 'DECO_FENCE';
            scale = 0.6;
        } else if (theme === 'FUTURE_CITY') {
            type = 'DECO_STREETLAMP';
            scale = 1.2;
        } else if (theme === 'RESEARCH_DOME') {
            type = 'DECO_SUPPLY_BOX';
            scale = 0.8;
        } else {
            type = 'DECO_MUSHROOM';
            scale = 0.5 + Math.random();
        }

        const pos = sphericalToCartesianConstrained(PLANET_RADIUS, phiRatio, thetaRatio, segmentIndex);
        assets.push({ id: `style-${segmentIndex}-${commit.id}`, type, position: pos, scale, sourceCommitId: commit.id });
    });

    return {
        theme,
        assets,
        stats: { featCount, fixCount, totalCount: commits.length }
    };
};