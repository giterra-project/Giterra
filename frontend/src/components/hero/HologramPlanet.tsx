import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { MeshDistortMaterial, OrbitControls, Sparkles } from '@react-three/drei';
import type { Group } from 'three';
import { AdditiveBlending } from 'three';

const PARTICLE_COUNT = 1400;

const ParticleShell = () => {
    const pointsRef = useRef<Group>(null);
    const positions = useMemo(() => {
        const data = new Float32Array(PARTICLE_COUNT * 3);

        for (let i = 0; i < PARTICLE_COUNT; i += 1) {
            const radius = 2.05 + Math.random() * 0.95;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);

            data[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
            data[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            data[i * 3 + 2] = radius * Math.cos(phi);
        }

        return data;
    }, []);

    useFrame((state, delta) => {
        if (!pointsRef.current) return;
        pointsRef.current.rotation.y += delta * 0.04;
        pointsRef.current.rotation.z = state.clock.getElapsedTime() * 0.08;
    });

    return (
        <group ref={pointsRef}>
            <points>
                <bufferGeometry>
                    <bufferAttribute
                        attach="attributes-position"
                        args={[positions, 3]}
                    />
                </bufferGeometry>
                <pointsMaterial
                    color="#8CF6FF"
                    size={0.016}
                    transparent
                    opacity={0.6}
                    sizeAttenuation
                    blending={AdditiveBlending}
                    depthWrite={false}
                />
            </points>
        </group>
    );
};

const HologramCore = () => {
    const rootRef = useRef<Group>(null);
    const ringARef = useRef<Group>(null);
    const ringBRef = useRef<Group>(null);

    useFrame((state, delta) => {
        const time = state.clock.getElapsedTime();

        if (rootRef.current) {
            rootRef.current.rotation.y += delta * 0.14;
            rootRef.current.rotation.x = Math.sin(time * 0.35) * 0.15;
        }

        if (ringARef.current) {
            ringARef.current.rotation.z = time * 0.4;
            const pulse = 1 + Math.sin(time * 1.8) * 0.04;
            ringARef.current.scale.setScalar(pulse);
        }

        if (ringBRef.current) {
            ringBRef.current.rotation.z = -time * 0.3;
            const pulse = 1 + Math.cos(time * 1.5) * 0.05;
            ringBRef.current.scale.setScalar(pulse);
        }
    });

    return (
        <group ref={rootRef}>
            <mesh>
                <icosahedronGeometry args={[1.55, 22]} />
                <MeshDistortMaterial
                    color="#59E9FF"
                    speed={1.4}
                    distort={0.2}
                    emissive="#37D7FF"
                    emissiveIntensity={2}
                    metalness={0.6}
                    roughness={0.2}
                    transmission={0.82}
                    thickness={1.2}
                    transparent
                    opacity={0.35}
                />
            </mesh>

            <mesh>
                <icosahedronGeometry args={[1.63, 8]} />
                <meshBasicMaterial
                    color="#96FCFF"
                    wireframe
                    transparent
                    opacity={0.55}
                    blending={AdditiveBlending}
                    depthWrite={false}
                />
            </mesh>

            <mesh scale={0.8}>
                <sphereGeometry args={[1.4, 48, 48]} />
                <meshBasicMaterial
                    color="#4EE8FF"
                    transparent
                    opacity={0.2}
                    blending={AdditiveBlending}
                    depthWrite={false}
                />
            </mesh>

            <group ref={ringARef}>
                <mesh rotation={[Math.PI / 2.6, 0, 0]}>
                    <torusGeometry args={[2.25, 0.03, 18, 280]} />
                    <meshBasicMaterial
                        color="#A7FDFF"
                        transparent
                        opacity={0.6}
                        blending={AdditiveBlending}
                    />
                </mesh>
            </group>

            <group ref={ringBRef}>
                <mesh rotation={[Math.PI / 3.3, 0.6, 0]}>
                    <torusGeometry args={[2.62, 0.018, 18, 280]} />
                    <meshBasicMaterial
                        color="#67E2FF"
                        transparent
                        opacity={0.5}
                        blending={AdditiveBlending}
                    />
                </mesh>
            </group>
        </group>
    );
};

const OrbitShards = () => {
    const shardRef = useRef<Group>(null);
    const shardPositions = useMemo(
        () => [
            [2.2, 0.6, 0.7],
            [-2.1, -0.2, -0.5],
            [1.5, -1.4, 1.2],
            [-1.7, 1.2, 1.4],
            [0.4, 2.1, -1.3],
            [-0.3, -2.2, 0.8],
        ],
        [],
    );

    useFrame((_state, delta) => {
        if (!shardRef.current) return;
        shardRef.current.rotation.y += delta * 0.3;
        shardRef.current.rotation.x += delta * 0.08;
    });

    return (
        <group ref={shardRef}>
            {shardPositions.map((position, index) => (
                <mesh
                    // eslint-disable-next-line react/no-array-index-key
                    key={index}
                    position={[position[0], position[1], position[2]]}
                    scale={0.12 + index * 0.012}
                >
                    <octahedronGeometry args={[1, 0]} />
                    <meshStandardMaterial
                        color="#A6FDFF"
                        emissive="#58EEFF"
                        emissiveIntensity={1.8}
                        roughness={0.25}
                        metalness={0.75}
                        transparent
                        opacity={0.85}
                    />
                </mesh>
            ))}
        </group>
    );
};

const HologramScene = () => (
    <>
        <ambientLight intensity={0.24} />
        <pointLight position={[0, 0, 6]} intensity={1.8} color="#9AF9FF" />
        <pointLight position={[-4, 2, -2]} intensity={0.65} color="#62A4FF" />
        <pointLight position={[3, -2, -1]} intensity={0.75} color="#3BF5D7" />
        <Sparkles
            count={120}
            size={3}
            speed={0.15}
            noise={0.7}
            scale={[6, 6, 6]}
            color="#94F7FF"
        />
        <ParticleShell />
        <OrbitShards />
        <HologramCore />
        <OrbitControls
            enableZoom={false}
            enablePan={false}
            autoRotate
            autoRotateSpeed={0.42}
            minPolarAngle={Math.PI / 2.6}
            maxPolarAngle={(Math.PI / 2.6) * 1.8}
        />
    </>
);

const HologramPlanet = () => {
    return (
        <div className="h-full w-full">
            <Canvas
                camera={{ position: [0, 0, 6], fov: 40 }}
                dpr={[1, 2]}
                gl={{ alpha: true, antialias: true }}
            >
                <HologramScene />
            </Canvas>
        </div>
    );
};

export default HologramPlanet;
