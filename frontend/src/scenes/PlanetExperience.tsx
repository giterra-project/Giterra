import { OrbitControls, Stars } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { useRef } from 'react'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'

import Cities from '../components/cities/Cities'
import OctantBoundaries from '../components/planet/OctantBoundaries'
import Planet from '../components/planet/Planet'
import ZoomController from '../components/planet/ZoomController'

export type ViewMode = 'overview' | 'detail'

interface PlanetExperienceProps {
  viewMode: ViewMode
  onViewModeChange: (next: ViewMode) => void
}

const PLANET_RADIUS = 3
const ORBIT_RADIUS = PLANET_RADIUS * 1.1

function PlanetExperience({ viewMode, onViewModeChange }: PlanetExperienceProps) {
  const controlsRef = useRef<OrbitControlsImpl | null>(null)

  return (
    <Canvas
      camera={{
        position: [0, 0, 8],
        fov: 45,
        near: 0.1,
        far: 120,
      }}
    >
      <color attach="background" args={['#000']} />
      <Stars radius={120} depth={50} count={450} factor={2} fade speed={0.15} />

      <ambientLight intensity={0.28} />
      <directionalLight position={[10, 6, 8]} intensity={1.2} color="#fff1df" />

      <ZoomController viewMode={viewMode} controlsRef={controlsRef} />

      <Planet
        radius={PLANET_RADIUS}
        isDetail={viewMode === 'detail'}
        onSelect={() => onViewModeChange('detail')}
      />

      {viewMode === 'detail' && (
        <>
          <OctantBoundaries radius={PLANET_RADIUS * 1.01} />
          <Cities orbitRadius={ORBIT_RADIUS} />
        </>
      )}

      <OrbitControls
        ref={controlsRef}
        enablePan={false}
        autoRotate={viewMode === 'overview'}
        autoRotateSpeed={0.6}
      />
    </Canvas>
  )
}

export default PlanetExperience
