import { useState } from 'react';
import { Html } from '@react-three/drei';

interface PlanetSegmentsProps {
    onSegmentDrop: (segmentIndex: number) => void;
    onSegmentClick: (segmentIndex: number) => void;
    hoveredRepo: string | null;
}

const SegmentMesh = ({ index, onClick, hoveredRepo }: any) => {
    const [hovered, setHovered] = useState(false);

    const getPosition = (idx: number) => {
        const isTop = idx < 4;
        const quadrant = idx % 4;
        const y = isTop ? 50 : -50;
        const radius = 50;
        const angle = (quadrant * Math.PI) / 2 + Math.PI / 4;
        const x = radius * Math.cos(angle);
        const z = radius * Math.sin(angle);
        return [x, y, z] as [number, number, number];
    };

    return (
        <group position={getPosition(index)}>
            <mesh
                onPointerOver={() => setHovered(true)}
                onPointerOut={() => setHovered(false)}
                onClick={(e) => {
                    e.stopPropagation();
                    onClick(index);
                }}
            >
                <sphereGeometry args={[45, 16, 16]} />
                <meshBasicMaterial
                    color={hovered && hoveredRepo ? "#6366f1" : "white"}
                    transparent
                    opacity={hovered ? 0.3 : 0}
                    wireframe={true}
                />
            </mesh>

            {hovered && hoveredRepo && (
                <Html center distanceFactor={200} style={{ pointerEvents: 'none' }}>
                    <div className="bg-indigo-600 text-white px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap shadow-lg">
                        Drop to Sector {index + 1}
                    </div>
                </Html>
            )}
        </group>
    );
};

const PlanetSegments = ({ onSegmentClick, hoveredRepo }: PlanetSegmentsProps) => {
    return (
        <group>
            {Array.from({ length: 8 }).map((_, i) => (
                <SegmentMesh
                    key={i}
                    index={i}
                    onClick={onSegmentClick}
                    hoveredRepo={hoveredRepo}
                />
            ))}
        </group>
    );
};

export default PlanetSegments;