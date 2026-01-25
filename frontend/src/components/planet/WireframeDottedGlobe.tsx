import { Line } from '@react-three/drei'
import { useEffect, useMemo, useState } from 'react'
import {
  AdditiveBlending,
  BackSide,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
} from 'three'

const LAND_GEOJSON_URL =
  'https://raw.githubusercontent.com/martynafford/natural-earth-geojson/refs/heads/master/110m/physical/ne_110m_land.json'

let cachedLand: FeatureCollection | null = null
let cachedLandPromise: Promise<FeatureCollection> | null = null

const DEG2RAD = Math.PI / 180

type Vec3Tuple = [number, number, number]

type PolygonCoordinates = number[][][]
type MultiPolygonCoordinates = number[][][][]

type Geometry =
  | { type: 'Polygon'; coordinates: PolygonCoordinates }
  | { type: 'MultiPolygon'; coordinates: MultiPolygonCoordinates }

type Feature = {
  type: 'Feature'
  properties?: Record<string, unknown>
  geometry: Geometry
}

type FeatureCollection = {
  type: 'FeatureCollection'
  features: Feature[]
}

function clampLongitude(lon: number) {
  if (lon > 180) return lon - 360
  if (lon < -180) return lon + 360
  return lon
}

export function latLonToVec3(lat: number, lon: number, radius: number): Vec3Tuple {
  const phi = (90 - lat) * DEG2RAD
  const theta = (clampLongitude(lon) + 180) * DEG2RAD

  const x = -radius * Math.sin(phi) * Math.cos(theta)
  const z = radius * Math.sin(phi) * Math.sin(theta)
  const y = radius * Math.cos(phi)

  return [x, y, z]
}

function pointInPolygon(point: [number, number], polygon: number[][]): boolean {
  const [x, y] = point
  let inside = false

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i]
    const [xj, yj] = polygon[j]

    const intersects = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi
    if (intersects) inside = !inside
  }

  return inside
}

function pointInFeature(point: [number, number], feature: Feature): boolean {
  const { geometry } = feature

  if (geometry.type === 'Polygon') {
    const coordinates = geometry.coordinates
    if (!pointInPolygon(point, coordinates[0])) return false

    for (let ringIndex = 1; ringIndex < coordinates.length; ringIndex += 1) {
      if (pointInPolygon(point, coordinates[ringIndex])) return false
    }

    return true
  }

  if (geometry.type === 'MultiPolygon') {
    for (const polygon of geometry.coordinates) {
      if (!pointInPolygon(point, polygon[0])) continue

      let inHole = false
      for (let ringIndex = 1; ringIndex < polygon.length; ringIndex += 1) {
        if (pointInPolygon(point, polygon[ringIndex])) {
          inHole = true
          break
        }
      }

      if (!inHole) return true
    }

    return false
  }

  return false
}

function polygonBounds(rings: number[][][]) {
  let minLon = Infinity
  let minLat = Infinity
  let maxLon = -Infinity
  let maxLat = -Infinity

  for (const ring of rings) {
    for (const [lon, lat] of ring) {
      minLon = Math.min(minLon, lon)
      minLat = Math.min(minLat, lat)
      maxLon = Math.max(maxLon, lon)
      maxLat = Math.max(maxLat, lat)
    }
  }

  return { minLon, minLat, maxLon, maxLat }
}

function featureBounds(feature: Feature) {
  const { geometry } = feature

  if (geometry.type === 'Polygon') {
    return polygonBounds(geometry.coordinates)
  }

  let minLon = Infinity
  let minLat = Infinity
  let maxLon = -Infinity
  let maxLat = -Infinity

  for (const polygon of geometry.coordinates) {
    const bounds = polygonBounds(polygon)
    minLon = Math.min(minLon, bounds.minLon)
    minLat = Math.min(minLat, bounds.minLat)
    maxLon = Math.max(maxLon, bounds.maxLon)
    maxLat = Math.max(maxLat, bounds.maxLat)
  }

  return { minLon, minLat, maxLon, maxLat }
}

function randomInRange(min: number, max: number) {
  return min + Math.random() * (max - min)
}

function sampleDots(feature: Feature, targetCount: number): [number, number][] {
  const dots: [number, number][] = []
  const { minLon, minLat, maxLon, maxLat } = featureBounds(feature)

  const maxTries = Math.max(600, targetCount * 60)
  let tries = 0

  while (dots.length < targetCount && tries < maxTries) {
    tries += 1
    const lon = randomInRange(minLon, maxLon)
    const lat = randomInRange(minLat, maxLat)

    if (pointInFeature([lon, lat], feature)) {
      dots.push([lon, lat])
    }
  }

  return dots
}

function ringToLinePoints(ring: number[][], radius: number, stride: number): Vec3Tuple[] {
  const points: Vec3Tuple[] = []

  for (let index = 0; index < ring.length; index += stride) {
    const [lon, lat] = ring[index]
    points.push(latLonToVec3(lat, lon, radius))
  }

  if (points.length > 1) points.push(points[0])
  return points
}

function buildGraticuleLines(radius: number) {
  const lines: Vec3Tuple[][] = []
  const step = 15
  const lonSegments = 72

  for (let lat = -75; lat <= 75; lat += step) {
    const pts: Vec3Tuple[] = []
    for (let i = 0; i <= lonSegments; i += 1) {
      const lon = -180 + (360 * i) / lonSegments
      pts.push(latLonToVec3(lat, lon, radius))
    }
    lines.push(pts)
  }

  for (let lon = -180; lon < 180; lon += step) {
    const pts: Vec3Tuple[] = []
    for (let latStep = -90; latStep <= 90; latStep += 2.5) {
      pts.push(latLonToVec3(latStep, lon, radius))
    }
    lines.push(pts)
  }

  return lines
}

interface WireframeDottedGlobeProps {
  radius: number
  showLand?: boolean
  dotDensity?: number
  dotSize?: number
}

function WireframeDottedGlobe({
  radius,
  showLand = true,
  dotDensity = 1,
  dotSize = 0.028,
}: WireframeDottedGlobeProps) {
  const [land, setLand] = useState<FeatureCollection | null>(cachedLand)

  const dotSprite = useMemo(() => {
    const size = 64
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size

    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    const g = ctx.createRadialGradient(
      size / 2,
      size / 2,
      0,
      size / 2,
      size / 2,
      size / 2,
    )
    g.addColorStop(0.0, 'rgba(255,255,255,1)')
    g.addColorStop(0.55, 'rgba(255,255,255,1)')
    g.addColorStop(0.9, 'rgba(255,255,255,0.08)')
    g.addColorStop(1.0, 'rgba(255,255,255,0)')

    ctx.fillStyle = g
    ctx.fillRect(0, 0, size, size)

    const texture = new CanvasTexture(canvas)
    texture.needsUpdate = true
    return texture
  }, [])

  useEffect(() => {
    if (!showLand) return
    if (cachedLand) {
      setLand(cachedLand)
      return
    }

    let cancelled = false

    async function load() {
      try {
        if (!cachedLandPromise) {
          cachedLandPromise = fetch(LAND_GEOJSON_URL).then(async (response) => {
            if (!response.ok) throw new Error('Failed to load land geojson')
            return (await response.json()) as FeatureCollection
          })
        }

        const data = await cachedLandPromise
        cachedLand = data
        if (!cancelled) setLand(data)
      } catch {
        if (!cancelled) setLand(null)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [showLand])

  const graticuleLines = useMemo(() => buildGraticuleLines(radius * 1.0015), [radius])

  const outlineLines = useMemo(() => {
    if (!land) return [] as Vec3Tuple[][]

    const lines: Vec3Tuple[][] = []
    const outlineRadius = radius * 1.003

    for (const feature of land.features) {
      if (feature.geometry.type === 'Polygon') {
        for (const ring of feature.geometry.coordinates) {
          lines.push(ringToLinePoints(ring, outlineRadius, 2))
        }
      } else {
        for (const polygon of feature.geometry.coordinates) {
          for (const ring of polygon) {
            lines.push(ringToLinePoints(ring, outlineRadius, 2))
          }
        }
      }
    }

    return lines
  }, [land, radius])

  const dotGeometry = useMemo(() => {
    if (!land) return null

    const positions: number[] = []
    const colors: number[] = []
    const dotRadius = radius * 1.006

    const budget = Math.max(600, Math.round(2400 * dotDensity))

    // Match PlanetExperience directional light direction approximately.
    const lightDir = { x: 10, y: 6, z: 8 }
    const lightLen = Math.sqrt(lightDir.x ** 2 + lightDir.y ** 2 + lightDir.z ** 2) || 1
    lightDir.x /= lightLen
    lightDir.y /= lightLen
    lightDir.z /= lightLen

    const featureAreas = land.features
      .map((feature) => {
        const bounds = featureBounds(feature)
        const approxArea = Math.abs((bounds.maxLon - bounds.minLon) * (bounds.maxLat - bounds.minLat))
        return { feature, approxArea }
      })
      .filter((entry) => entry.approxArea > 1)

    const totalArea = featureAreas.reduce((acc, entry) => acc + entry.approxArea, 0)
    if (totalArea <= 0) return null

    let remaining = budget

    for (const entry of featureAreas) {
      if (remaining <= 0) break

      const weight = entry.approxArea / totalArea
      const targetCount = Math.min(
        remaining,
        Math.max(1, Math.round(weight * budget)),
      )

      const dots = sampleDots(entry.feature, targetCount)
      remaining -= targetCount

      for (const [lon, lat] of dots) {
        const [x, y, z] = latLonToVec3(lat, lon, dotRadius)
        positions.push(x, y, z)

        const nx = x / dotRadius
        const ny = y / dotRadius
        const nz = z / dotRadius
        const ndotl = Math.max(0, nx * lightDir.x + ny * lightDir.y + nz * lightDir.z)

        // Keep a readable floor while adding curvature shading.
        const intensity = 0.55 + 0.45 * ndotl
        colors.push(intensity, intensity, intensity)
      }
    }

    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3))
    geometry.setAttribute('color', new BufferAttribute(new Float32Array(colors), 3))
    return geometry
  }, [land, radius, dotDensity])

  return (
    <group>
      {/* ocean */}
      <mesh>
        <sphereGeometry args={[radius, 96, 96]} />
        <meshStandardMaterial
          color="#061526"
          roughness={0.78}
          metalness={0.05}
          emissive="#02060b"
          emissiveIntensity={0.12}
        />
      </mesh>

      {/* atmosphere */}
      <mesh>
        <sphereGeometry args={[radius * 1.022, 64, 64]} />
        <shaderMaterial
          transparent
          side={BackSide}
          blending={AdditiveBlending}
          depthWrite={false}
          uniforms={
            useMemo(
              () => ({
                uColor: { value: new Color('#cfe3ff') },
                uIntensity: { value: 0.38 },
                uPower: { value: 3.4 },
              }),
              [],
            )
          }
          vertexShader={
            /* glsl */ `
            varying vec3 vWorldPosition;
            varying vec3 vWorldNormal;

            void main() {
              vec4 worldPosition = modelMatrix * vec4(position, 1.0);
              vWorldPosition = worldPosition.xyz;
              vWorldNormal = normalize(mat3(modelMatrix) * normal);
              gl_Position = projectionMatrix * viewMatrix * worldPosition;
            }
          `
          }
          fragmentShader={
            /* glsl */ `
            uniform vec3 uColor;
            uniform float uIntensity;
            uniform float uPower;

            varying vec3 vWorldPosition;
            varying vec3 vWorldNormal;

            void main() {
              vec3 viewDir = normalize(cameraPosition - vWorldPosition);
              float ndotv = max(dot(vWorldNormal, viewDir), 0.0);
              float fresnel = pow(1.0 - ndotv, uPower);
              float alpha = fresnel * uIntensity;
              gl_FragColor = vec4(uColor, alpha);
            }
          `
          }
        />
      </mesh>

      {/* graticule */}
      {graticuleLines.map((points, idx) => (
        <Line
          key={`grat-${idx}`}
          points={points}
          color="#cfe8ff"
          opacity={0.1}
          transparent
        />
      ))}

      {/* land outline */}
      {showLand &&
        outlineLines.map((points, idx) => (
          <Line
            key={`land-${idx}`}
            points={points}
            color="#eaf6ff"
            opacity={0.28}
            transparent
          />
        ))}

      {/* halftone dots */}
      {showLand && dotGeometry && (
        <points geometry={dotGeometry}>
          <pointsMaterial
            color="#ffffff"
            size={dotSize}
            sizeAttenuation
            transparent
            opacity={0.78}
            depthWrite={false}
            vertexColors
            alphaMap={dotSprite}
            alphaTest={0.25}
          />
        </points>
      )}
    </group>
  )
}

export default WireframeDottedGlobe
