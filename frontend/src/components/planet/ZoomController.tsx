import { useFrame, useThree } from '@react-three/fiber'
import { useMemo, type RefObject } from 'react'
import { Vector3 } from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'

import type { ViewMode } from '../../scenes/PlanetExperience'

interface ZoomControllerProps {
  viewMode: ViewMode
  controlsRef: RefObject<OrbitControlsImpl | null>
}

function ZoomController({ viewMode, controlsRef }: ZoomControllerProps) {
  const camera = useThree((state) => state.camera)

  const config = useMemo(() => {
    if (viewMode === 'detail') {
      return {
        desiredPosition: new Vector3(0, 0, 4.2),
        desiredTarget: new Vector3(0, 0, 0),
        minDistance: 3.8,
        maxDistance: 6,
      }
    }

    return {
      desiredPosition: new Vector3(0, 0, 8),
      desiredTarget: new Vector3(0, 0, 0),
      minDistance: 5,
      maxDistance: 14,
    }
  }, [viewMode])

  useFrame(() => {
    camera.position.lerp(config.desiredPosition, 0.08)

    const controls = controlsRef.current
    if (!controls) return

    controls.minDistance = config.minDistance
    controls.maxDistance = config.maxDistance

    controls.target.lerp(config.desiredTarget, 0.12)
    controls.update()
  })

  return null
}

export default ZoomController
