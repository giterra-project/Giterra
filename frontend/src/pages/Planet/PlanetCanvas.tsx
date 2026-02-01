import { useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars, useTexture } from '@react-three/drei';
import * as THREE from 'three';

const PlanetMesh = () => {
    const meshRef = useRef<THREE.Mesh>(null);
    const texture = useTexture('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg');

    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.rotation.y += 0.002;
            meshRef.current.position.y = Math.sin(state.clock.elapsedTime) * 0.1;
        }
    });

    return (
        <mesh ref={meshRef}>
            <sphereGeometry args={[2.5, 64, 64]} />
            <meshStandardMaterial map={texture} metalness={0.4} roughness={0.7} />
        </mesh>
    );
};

const ContextCleaner = () => {
    const { gl, scene } = useThree();

    useEffect(() => {
        return () => {
            gl.dispose();
            scene.clear();
            console.log("WebGL Context Disposed");
        };
    }, [gl, scene]);

    return null;
};

const PlanetCanvas = () => {
    return (
        <div className="w-full h-full">
            <Canvas
                camera={{ position: [0, 0, 8], fov: 45 }}
                gl={{ antialias: false, powerPreference: "high-performance" }}
                dpr={[1, 1.5]} // 해상도를 약간 낮춰 부하 감소
            >
                <ContextCleaner />
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1.5} />
                <PlanetMesh />
                <Stars radius={100} depth={50} count={1000} factor={4} saturation={0} fade speed={1} />
                <OrbitControls enableZoom={false} enablePan={false} />
            </Canvas>
        </div>
    );
};

export default PlanetCanvas;