import { Line } from '@react-three/drei'
import { useMemo } from 'react'

interface OctantBoundariesProps {
  radius: number
  segments?: number
}

type Axis = 'x' | 'y' | 'z'

function buildGreatCirclePoints(axis: Axis, radius: number, segments: number) {
  const points: [number, number, number][] = []

  for (let i = 0; i <= segments; i += 1) {
    const t = (i / segments) * Math.PI * 2
    const c = Math.cos(t) * radius
    const s = Math.sin(t) * radius

    if (axis === 'x') points.push([0, c, s])
    if (axis === 'y') points.push([c, 0, s])
    if (axis === 'z') points.push([c, s, 0])
  }

  return points
}

function OctantBoundaries({ radius, segments = 128 }: OctantBoundariesProps) {
  const xCircle = useMemo(
    () => buildGreatCirclePoints('x', radius, segments),
    [radius, segments],
  )
  const yCircle = useMemo(
    () => buildGreatCirclePoints('y', radius, segments),
    [radius, segments],
  )
  const zCircle = useMemo(
    () => buildGreatCirclePoints('z', radius, segments),
    [radius, segments],
  )

  return (
    <group>
      <Line points={xCircle} color="#cfe8ff" opacity={0.22} transparent />
      <Line points={yCircle} color="#cfe8ff" opacity={0.22} transparent />
      <Line points={zCircle} color="#cfe8ff" opacity={0.22} transparent />
    </group>
  )
}

export default OctantBoundaries
