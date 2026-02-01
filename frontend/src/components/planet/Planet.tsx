import { useCursor } from '@react-three/drei'
import { useState } from 'react'

import WireframeDottedGlobe from './WireframeDottedGlobe'

interface PlanetProps {
  radius: number
  isDetail: boolean
  onSelect: () => void
}

function Planet({ radius, isDetail, onSelect }: PlanetProps) {
  const [hovered, setHovered] = useState(false)
  useCursor(hovered)

  return (
    <group>
      <WireframeDottedGlobe
        radius={radius}
        dotDensity={isDetail ? 1 : 0.65}
        dotSize={isDetail ? 0.026 : 0.022}
      />

      {/* click target */}
      <mesh
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onClick={(event) => {
          event.stopPropagation()
          onSelect()
        }}
      >
        <sphereGeometry args={[radius * 1.02, 32, 32]} />
        <meshBasicMaterial transparent opacity={hovered ? 0.08 : 0.02} color="#ffffff" />
      </mesh>

      {isDetail && (
        <mesh>
          <sphereGeometry args={[radius * 1.012, 64, 64]} />
          <meshBasicMaterial wireframe transparent opacity={0.08} color="#ffffff" />
        </mesh>
      )}
    </group>
  )
}

export default Planet
