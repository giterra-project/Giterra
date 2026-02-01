import { useMemo, useRef, useLayoutEffect } from 'react';
import * as THREE from 'three';
import type { PlanetAsset } from '../../types';

interface PlanetAssetRendererProps {
    asset: PlanetAsset;
}

const PlanetAssetRenderer = ({ asset }: PlanetAssetRendererProps) => {
    const groupRef = useRef<THREE.Group>(null);
    const { position, type, scale } = asset;

    useLayoutEffect(() => {
        if (groupRef.current) {
            groupRef.current.lookAt(0, 0, 0);
        }
    }, [position]);

    const color = useMemo(() => {
        if (type.includes('BUILDING_GLASS')) return '#60a5fa';
        if (type.includes('BUILDING_SOLID')) return '#475569';
        if (type.includes('TREE')) return '#10b981';
        if (type.includes('FLOWER')) return '#facc15';
        if (type.includes('PATH_NEON')) return '#06b6d4';
        if (type.includes('PATH')) return '#78716c';
        if (type.includes('DOCS')) return '#818cf8';
        if (type.includes('DECO')) return '#f472b6';
        return '#ffffff';
    }, [type]);

    const renderGeometry = () => {
        if (type.includes('BUILDING')) {
            return <boxGeometry args={[2, 2, 2]} />;
        }
        if (type.includes('TREE_WORLD')) {
            return <coneGeometry args={[2, 6, 8]} />;
        }
        if (type.includes('TREE')) {
            return <coneGeometry args={[1, 3, 8]} />;
        }
        if (type.includes('PATH')) {
            return <boxGeometry args={[1.5, 0.2, 1.5]} />;
        }
        if (type.includes('DOCS')) {
            return <boxGeometry args={[0.5, 3, 1]} />;
        }
        return <dodecahedronGeometry args={[1, 0]} />;
    };

    return (
        <group ref={groupRef} position={[position.x, position.y, position.z]}>
            <mesh
                rotation={[Math.PI / 2, 0, 0]}
                scale={[scale, scale, scale]}
            >
                {renderGeometry()}
                <meshStandardMaterial
                    color={color}
                    emissive={type.includes('NEON') || type.includes('GLASS') ? color : undefined}
                    emissiveIntensity={0.5}
                    roughness={0.2}
                    metalness={0.8}
                />
            </mesh>
        </group>
    );
};

export default PlanetAssetRenderer;