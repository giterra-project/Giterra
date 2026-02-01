import { Float } from '@react-three/drei'
import { useEffect, useMemo, useState } from 'react'
import { Color, Quaternion, Vector3 } from 'three'

import mockSelectedRepos from '../../data/mockSelectedRepos'
import { getOrCreatePlacements, type Placement } from '../../lib/placements'
import { CITY_STYLE } from '../../types/city'

interface CitiesProps {
  orbitRadius: number
}

function geometryForType(shape: (typeof CITY_STYLE)[keyof typeof CITY_STYLE]['shape']) {
  if (shape === 'cone') return <coneGeometry args={[0.18, 0.45, 16]} />
  if (shape === 'cylinder') return <cylinderGeometry args={[0.18, 0.18, 0.45, 16]} />
  if (shape === 'torus') return <torusGeometry args={[0.22, 0.07, 12, 24]} />
  return <boxGeometry args={[0.34, 0.34, 0.34]} />
}

function City({ placement }: { placement: Placement }) {
  const style = CITY_STYLE[placement.cityType]
  const position = placement.position

  const outward = useMemo(
    () => new Vector3(position[0], position[1], position[2]).normalize(),
    [position],
  )
  const quaternion = useMemo(
    () => new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), outward),
    [outward],
  )

  const emissive = useMemo(() => new Color(style.color).multiplyScalar(0.6), [style.color])

  return (
    <Float speed={1.25} rotationIntensity={0.25} floatIntensity={0.55}>
      <mesh position={position} quaternion={quaternion}>
        {geometryForType(style.shape)}
        <meshStandardMaterial
          color={style.color}
          emissive={emissive}
          emissiveIntensity={0.85}
          roughness={0.35}
          metalness={0.35}
        />
      </mesh>
    </Float>
  )
}

function Cities({ orbitRadius }: CitiesProps) {
  const [placements, setPlacements] = useState<Placement[] | null>(null)

  useEffect(() => {
    setPlacements(getOrCreatePlacements(mockSelectedRepos, orbitRadius))
  }, [orbitRadius])

  if (!placements) return null

  return (
    <group>
      {placements.map((placement) => (
        <City key={placement.repoId} placement={placement} />
      ))}
    </group>
  )
}

export default Cities
