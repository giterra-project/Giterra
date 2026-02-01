import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, Environment } from '@react-three/drei';
import type { PlanetAsset, PlanetTheme } from '../../types';
import PlanetAssetRenderer from './PlanetAssetRenderer';

interface PlanetSceneProps {
    assets: PlanetAsset[];
    theme: PlanetTheme;
    onAssetClick?: (assetId: string) => void;
}

const PlanetScene = ({ assets }: PlanetSceneProps) => {
    return (
        <div className="h-full w-full absolute inset-0">
            <Canvas camera={{ position: [0, 0, 280], fov: 45 }}>
                <color attach="background" args={['#050505']} />

                <ambientLight intensity={0.3} />
                <pointLight position={[100, 100, 100]} intensity={2} color="#ffffff" />
                <pointLight position={[-100, -50, -100]} intensity={1} color="#4f46e5" />

                <group>
                    <mesh receiveShadow>
                        <sphereGeometry args={[99, 64, 64]} />
                        <meshStandardMaterial
                            color="#1a1a1a"
                            roughness={0.7}
                            metalness={0.2}
                        />
                    </mesh>

                    {assets.map((asset) => (
                        <PlanetAssetRenderer key={asset.id} asset={asset} />
                    ))}
                </group>

                <OrbitControls
                    minDistance={150}
                    maxDistance={500}
                    enablePan={false}
                    autoRotate={true}
                    autoRotateSpeed={0.5}
                />

                <Stars radius={300} depth={50} count={3000} factor={4} fade speed={1} />
                <Environment preset="city" />
            </Canvas>
        </div>
    );
};

export default PlanetScene;