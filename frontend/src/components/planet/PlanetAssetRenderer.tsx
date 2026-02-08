import { useRef, useLayoutEffect } from 'react';
import * as THREE from 'three';
import { Float, Cone, Cylinder, Box, Sphere, Torus } from '@react-three/drei';
import type { PlanetAsset } from '../../types';

interface PlanetAssetRendererProps {
    asset: PlanetAsset;
}

// 🌆 City Architecture Components

const WindowLayer = ({ width, height, floors, color }: { width: number, height: number, floors: number, color: string }) => {
    return (
        <group>
            {Array.from({ length: floors }).map((_, i) => (
                <Box key={i} args={[width * 0.85, height / floors * 0.6, width * 0.85]} position={[0, (i - floors / 2 + 0.5) * (height / floors), 0]}>
                    <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
                </Box>
            ))}
        </group>
    )
}

const SkyscraperModern = ({ scale }: { scale: number }) => {
    // Glassy, tall, sleek
    const height = 3.5 * scale;
    const width = 1.2 * scale;

    return (
        <group position={[0, height / 2, 0]}>
            <Box args={[width, height, width]}>
                <meshPhysicalMaterial
                    color="#88ccff"
                    transparent
                    opacity={0.8}
                    metalness={0.9}
                    roughness={0.1}
                    clearcoat={1}
                />
            </Box>
            <Box args={[width * 1.05, height, width * 1.05]}>
                <meshStandardMaterial color="#1e293b" wireframe />
            </Box>
            <Box args={[width * 0.8, 0.2, width * 0.8]} position={[0, height / 2 + 0.1, 0]}>
                <meshBasicMaterial color="#00ffff" />
                <pointLight distance={3} intensity={2} color="#00ffff" />
            </Box>
        </group>
    );
};

const SkyscraperClassic = ({ scale }: { scale: number }) => {
    // Empire state style
    const tier1H = 1.5 * scale;
    const tier2H = 1.2 * scale;
    const tier3H = 0.8 * scale;

    return (
        <group>
            <Box args={[1.5 * scale, tier1H, 1.5 * scale]} position={[0, tier1H / 2, 0]}>
                <meshStandardMaterial color="#475569" />
            </Box>
            <Box args={[1.2 * scale, tier2H, 1.2 * scale]} position={[0, tier1H + tier2H / 2, 0]}>
                <meshStandardMaterial color="#64748b" />
            </Box>
            <WindowLayer width={1.21 * scale} height={tier2H} floors={4} color="#fef08a" />

            <Box args={[0.8 * scale, tier3H, 0.8 * scale]} position={[0, tier1H + tier2H + tier3H / 2, 0]}>
                <meshStandardMaterial color="#94a3b8" />
            </Box>
            <Cylinder args={[0.05, 0.1, 0.8]} position={[0, tier1H + tier2H + tier3H + 0.4, 0]}>
                <meshStandardMaterial color="#cbd5e1" metalness={0.8} />
            </Cylinder>
        </group>
    );
};

const ResidentialComplex = ({ scale }: { scale: number }) => {
    return (
        <group position={[0, scale, 0]}>
            <Box args={[1.8 * scale, 2 * scale, 1 * scale]}>
                <meshStandardMaterial color="#f8fafc" />
            </Box>
            <group position={[0, 0, 0.51 * scale]}>
                <Box args={[0.4 * scale, 0.4 * scale, 0.05]} position={[-0.5 * scale, 0.5 * scale, 0]}>
                    <meshStandardMaterial color="#38bdf8" />
                </Box>
                <Box args={[0.4 * scale, 0.4 * scale, 0.05]} position={[0.5 * scale, 0.5 * scale, 0]}>
                    <meshStandardMaterial color="#38bdf8" />
                </Box>
                <Box args={[0.4 * scale, 0.4 * scale, 0.05]} position={[-0.5 * scale, -0.5 * scale, 0]}>
                    <meshStandardMaterial color="#1e293b" />
                </Box>
                <Box args={[0.4 * scale, 0.4 * scale, 0.05]} position={[0.5 * scale, -0.5 * scale, 0]}>
                    <meshStandardMaterial color="#38bdf8" />
                </Box>
            </group>
        </group>
    )
}

const CyberTree = ({ scale }: { scale: number }) => (
    <group scale={scale}>
        <Cylinder args={[0.1, 0.2, 0.8]} position={[0, 0.4, 0]}>
            <meshStandardMaterial color="#7dd3fc" emissive="#0284c7" emissiveIntensity={0.5} />
        </Cylinder>
        {[0, 1, 2].map(i => (
            <Cone key={i} args={[0.6 - i * 0.15, 0.8, 4]} position={[0, 0.8 + i * 0.4, 0]}>
                <meshStandardMaterial color="#0ea5e9" transparent opacity={0.6} wireframe />
            </Cone>
        ))}
    </group>
);

const CityPark = ({ scale }: { scale: number }) => (
    <group scale={scale}>
        <Cylinder args={[1.2, 1.2, 0.1, 6]} position={[0, 0.05, 0]}>
            <meshStandardMaterial color="#166534" />
        </Cylinder>
        <Cylinder args={[0.4, 0.4, 0.3, 6]} position={[0, 0.2, 0]}>
            <meshStandardMaterial color="#e2e8f0" />
        </Cylinder>
        <Cylinder args={[0.3, 0.3, 0.35, 6]} position={[0, 0.2, 0]}>
            <meshStandardMaterial color="#3b82f6" opacity={0.8} transparent />
        </Cylinder>
        {[0, 1, 2].map(i => {
            const angle = (i / 3) * Math.PI * 2;
            return (
                <group key={i} position={[Math.cos(angle) * 0.8, 0, Math.sin(angle) * 0.8]}>
                    <Cylinder args={[0.05, 0.05, 0.3]} position={[0, 0.15, 0]}><meshStandardMaterial color="#78350f" /></Cylinder>
                    <Sphere args={[0.25]} position={[0, 0.4, 0]}><meshStandardMaterial color="#22c55e" /></Sphere>
                </group>
            )
        })}
    </group>
);

const StreetSegment = ({ scale, type }: { scale: number, type: string }) => {
    const isNeon = type.includes('NEON');
    return (
        <group scale={scale}>
            <Box args={[1.5, 0.05, 1.5]} position={[0, 0.025, 0]}>
                <meshStandardMaterial color="#1e293b" />
            </Box>
            <Box args={[0.2, 0.06, 0.8]} position={[0, 0.026, 0]}>
                <meshStandardMaterial color={isNeon ? "#a855f7" : "#fbbf24"} emissive={isNeon ? "#d8b4fe" : undefined} />
            </Box>
            {isNeon && (
                <>
                    <Box args={[1.5, 0.06, 0.1]} position={[0, 0.026, 0.7]}><meshStandardMaterial color="#06b6d4" emissive="#06b6d4" emissiveIntensity={2} /></Box>
                    <Box args={[1.5, 0.06, 0.1]} position={[0, 0.026, -0.7]}><meshStandardMaterial color="#06b6d4" emissive="#06b6d4" emissiveIntensity={2} /></Box>
                </>
            )}
        </group>
    );
};

const DataMonolith = ({ scale }: { scale: number }) => (
    <group scale={scale}>
        <Box args={[0.8, 2.5, 0.8]} position={[0, 1.25, 0]}>
            <meshStandardMaterial color="#000000" metalness={0.9} roughness={0.1} />
        </Box>
        {[0.5, 1.5, 2.2].map((y, i) => (
            <Torus key={i} args={[0.6, 0.02, 16, 32]} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <meshBasicMaterial color="#ef4444" />
            </Torus>
        ))}
        <Float speed={5} rotationIntensity={0} floatIntensity={0.2}>
            <Box args={[0.2, 0.2, 0.2]} position={[0, 3, 0]}>
                <meshBasicMaterial color="#ef4444" wireframe />
            </Box>
        </Float>
    </group>
);

const StreetLamp = ({ scale }: { scale: number }) => (
    <group scale={scale}>
        <Cylinder args={[0.05, 0.05, 1.5]} position={[0, 0.75, 0]}>
            <meshStandardMaterial color="#475569" />
        </Cylinder>
        <Box args={[0.4, 0.1, 0.1]} position={[0.2, 1.5, 0]}>
            <meshStandardMaterial color="#475569" />
        </Box>
        <Cone args={[0.1, 0.2, 4]} position={[0.35, 1.4, 0]}>
            <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={2} />
        </Cone>
        <Cone args={[0.3, 1, 4]} position={[0.35, 0.8, 0]} geometry-opacity={0.1}>
            <meshBasicMaterial color="#fbbf24" transparent opacity={0.1} depthWrite={false} />
        </Cone>
    </group>
);

const Vehicle = ({ scale, type }: { scale: number, type: string }) => {
    const isFlying = type.includes('DRONE') || type.includes('SPIRIT');
    const color = type.includes('SPIRIT') ? '#a855f7' : '#e2e8f0';

    if (isFlying) {
        return (
            <group scale={scale}>
                <Float speed={5} floatIntensity={1} floatingRange={[1.5, 2.5]}>
                    <Box args={[0.8, 0.2, 0.4]}>
                        <meshStandardMaterial color={color} metalness={0.8} />
                    </Box>
                    <Box args={[0.2, 0.05, 0.6]} position={[0.3, 0, 0]}><meshStandardMaterial color="#000" /></Box>
                    <Box args={[0.2, 0.05, 0.6]} position={[-0.3, 0, 0]}><meshStandardMaterial color="#000" /></Box>
                    <pointLight color={color} distance={2} decay={2} />
                </Float>
            </group>
        )
    }

    // Ground Vehicle (Rover)
    return (
        <group scale={scale} position={[0, 0.25, 0]}>
            <Box args={[0.6, 0.3, 0.4]}>
                <meshStandardMaterial color="#475569" />
            </Box>
            {[1, -1].map(x => [1, -1].map(z => (
                <Cylinder key={`${x}-${z}`} args={[0.15, 0.15, 0.1]} rotation={[Math.PI / 2, 0, 0]} position={[x * 0.2, -0.1, z * 0.2]}>
                    <meshStandardMaterial color="#000" />
                </Cylinder>
            )))}
        </group>
    )
}

const PlanetAssetRenderer = ({ asset }: PlanetAssetRendererProps) => {
    const groupRef = useRef<THREE.Group>(null);
    const { position, type, scale } = asset;

    useLayoutEffect(() => {
        if (groupRef.current) {
            groupRef.current.lookAt(0, 0, 0);
        }
    }, [position]);

    const renderAsset = () => {
        // 🏢 Architecture
        if (type.includes('BUILDING_GLASS')) return <SkyscraperModern scale={scale} />;
        if (type.includes('BUILDING_SOLID')) return <SkyscraperClassic scale={scale} />;
        if (type.includes('RESEARCH_DOME') || type.includes('DEFENSE')) return <ResidentialComplex scale={scale} />;

        // 🌳 Nature
        if (type.includes('TREE_WORLD')) return <CityPark scale={scale * 2} />;
        if (type.includes('TREE_HOLOGRAM')) return <CyberTree scale={scale} />;
        if (type.includes('TREE')) return <CityPark scale={scale} />;

        // 🛣️ Infrastructure
        if (type.includes('PATH')) return <StreetSegment scale={scale} type={type} />;

        // 📄 Data
        if (type.includes('DOCS')) return <DataMonolith scale={scale} />;

        // 🚗 Props & Decor
        if (type.includes('DRONE') || type.includes('ROVER') || type.includes('SPIRIT')) return <Vehicle scale={scale} type={type} />;
        if (type.includes('STREETLAMP') || type.includes('DECO')) return <StreetLamp scale={scale} />;

        // Default
        return (
            <Box args={[1, 1, 1]} position={[0, 0.5, 0]}>
                <meshStandardMaterial color="#94a3b8" />
            </Box>
        );
    };

    return (
        <group ref={groupRef} position={[position.x, position.y, position.z]}>
            <group rotation={[Math.PI / 2, 0, 0]}>
                {renderAsset()}
            </group>
        </group>
    );
};

export default PlanetAssetRenderer;
