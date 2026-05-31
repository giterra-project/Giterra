import { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';

import { usePlanetStore } from '../../store/usePlanetStore';
import type { PlanetStore } from '../../store/usePlanetStore';
import { ORBIT_PLANET_TYPES } from '../../types/index';
import type { PlanetType, SlotIndex, PlacementData } from '../../types/index';

const PLANET_CONFIG: Record<PlanetType, { color: string; size: number }> = {
    SUN: { color: '#ffcc00', size: 2 },
    MERCURY: { color: '#a8a8a8', size: 0.3 },
    VENUS: { color: '#e0c090', size: 0.5 },
    EARTH: { color: '#4b90e2', size: 0.55 },
    MARS: { color: '#e27b4b', size: 0.4 },
    JUPITER: { color: '#d39c7e', size: 1.2 },
    SATURN: { color: '#e5d0a1', size: 1.0 },
    URANUS: { color: '#a1cce5', size: 0.8 },
    NEPTUNE: { color: '#4b73e2', size: 0.75 },
};

const getDistance = (index: number) => 4 + index * 2.5;

const Sun = () => {
    const meshRef = useRef<THREE.Mesh>(null);
    useFrame(() => {
        if (meshRef.current) meshRef.current.rotation.y += 0.005;
    });
    return (
        <mesh ref={meshRef}>
            <sphereGeometry args={[2, 64, 64]} />
            <meshBasicMaterial color="#ffcc00" />
        </mesh>
    );
};

const EmptySlot = ({ index, isHovered }: { index: SlotIndex; isHovered: boolean }) => {
    const distance = getDistance(index);
    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} userData={{ isSlot: true, slotIndex: index }}>
            <ringGeometry args={[distance - 0.4, distance + 0.4, 64]} />
            <meshBasicMaterial color={isHovered ? "#6366f1" : "#ffffff"} transparent opacity={isHovered ? 0.6 : 0.1} side={THREE.DoubleSide} />
        </mesh>
    );
};

const Planet = ({ index, type }: { index: number; type: PlanetType }) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const groupRef = useRef<THREE.Group>(null);
    const distance = getDistance(index);
    const config = PLANET_CONFIG[type];
    const speed = 0.5 / distance;

    useFrame(() => {
        if (groupRef.current) groupRef.current.rotation.y += speed * 0.01;
        if (meshRef.current) meshRef.current.rotation.y += 0.02;
    });

    return (
        <group ref={groupRef}>
            <mesh ref={meshRef} position={[distance, 0, 0]}>
                <sphereGeometry args={[config.size, 32, 32]} />
                <meshStandardMaterial color={config.color} metalness={0.4} roughness={0.7} />
            </mesh>
        </group>
    );
};

const DropDetector = ({
    isDragging,
    mousePosRef,
    setHoveredSlot
}: {
    isDragging: boolean;
    mousePosRef: React.MutableRefObject<THREE.Vector2>;
    setHoveredSlot: (s: SlotIndex | null) => void;
}) => {
    const { camera, raycaster, scene } = useThree();

    useFrame(() => {
        if (!isDragging) return;
        raycaster.setFromCamera(mousePosRef.current, camera);

        const intersects = raycaster.intersectObjects(scene.children, true);
        const slotIntersect = intersects.find((intersect) => intersect.object.userData?.isSlot);

        if (slotIntersect) {
            setHoveredSlot(slotIntersect.object.userData.slotIndex as SlotIndex);
        } else {
            setHoveredSlot(null);
        }
    });
    return null;
};

const ContextCleaner = () => {
    const { gl, scene } = useThree();
    useEffect(() => {
        return () => {
            gl.dispose();
            scene.clear();
        };
    }, [gl, scene]);
    return null;
};

const PlanetCanvas = () => {
    const localPlacements = usePlanetStore((state: PlanetStore) => state.localPlacements);
    const movePlacement = usePlanetStore((state: PlanetStore) => state.movePlacement);
    const slots: SlotIndex[] = [0, 1, 2, 3, 4, 5, 6, 7];

    const [isDragging, setIsDragging] = useState(false);
    const [hoveredSlot, setHoveredSlot] = useState<SlotIndex | null>(null);
    const mousePosRef = useRef(new THREE.Vector2());

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
        mousePosRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
        mousePosRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const repoId = Number(e.dataTransfer.getData("repoId"));
        if (repoId && hoveredSlot !== null) {
            movePlacement(repoId, hoveredSlot, ORBIT_PLANET_TYPES[hoveredSlot]);
        }
        setHoveredSlot(null);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
        setHoveredSlot(null);
    };

    return (
        <div
            className="w-full h-full"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onDragLeave={handleDragLeave}
        >
            <Canvas
                camera={{ position: [0, 15, 25], fov: 45 }}
                gl={{ antialias: false, powerPreference: "high-performance" }}
                dpr={[1, 1.5]}
            >
                <ContextCleaner />
                <ambientLight intensity={0.5} />
                <pointLight position={[0, 0, 0]} intensity={2} color="#ffcc00" />

                <Sun />

                <group>
                    {slots.map((slotIndex: SlotIndex) => {
                        const placement = localPlacements.find((p: PlacementData) => p.slot_index === slotIndex);
                        return (
                            <group key={`slot-${slotIndex}`}>
                                <EmptySlot index={slotIndex} isHovered={hoveredSlot === slotIndex} />
                                {placement && <Planet index={slotIndex} type={placement.planet_type} />}
                            </group>
                        );
                    })}
                </group>

                <DropDetector isDragging={isDragging} mousePosRef={mousePosRef} setHoveredSlot={setHoveredSlot} />

                <Stars radius={100} depth={50} count={1000} factor={4} saturation={0} fade speed={1} />
                <OrbitControls enableZoom={true} enablePan={true} maxDistance={50} minDistance={5} />
            </Canvas>
        </div>
    );
};

export default PlanetCanvas;
