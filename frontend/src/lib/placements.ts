import { Vector3 } from 'three'

import type { CityType } from '../types/city'
import type { SelectedRepo } from '../types/repo'

export interface Placement {
  repoId: string
  zoneId: number
  position: [number, number, number]
  cityType: CityType
}

interface StoredPayload {
  version: number
  placements: Placement[]
}

const STORAGE_KEY = 'giterra:placements:v1'
const STORAGE_VERSION = 1

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function hasValidPosition(value: unknown): value is [number, number, number] {
  return (
    Array.isArray(value) &&
    value.length === 3 &&
    value.every((v) => isFiniteNumber(v))
  )
}

function loadStoredPayload(): StoredPayload | null {
  if (typeof window === 'undefined') return null

  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) return null

  try {
    return JSON.parse(raw) as StoredPayload
  } catch {
    return null
  }
}

function isValidPayload(payload: StoredPayload, repos: SelectedRepo[]) {
  if (payload.version !== STORAGE_VERSION) return false
  if (!Array.isArray(payload.placements)) return false
  if (payload.placements.length !== 8) return false

  const repoIds = new Set(repos.map((r) => r.id))
  const zones = new Set<number>()

  for (const placement of payload.placements) {
    if (!repoIds.has(placement.repoId)) return false
    if (!Number.isInteger(placement.zoneId)) return false
    if (placement.zoneId < 0 || placement.zoneId > 7) return false
    if (zones.has(placement.zoneId)) return false
    zones.add(placement.zoneId)

    if (!hasValidPosition(placement.position)) return false
  }

  return zones.size === 8
}

function randomInRange(min: number, max: number) {
  return min + Math.random() * (max - min)
}

function zoneSigns(zoneId: number) {
  const sx = zoneId & 1 ? 1 : -1
  const sy = zoneId & 2 ? 1 : -1
  const sz = zoneId & 4 ? 1 : -1
  return { sx, sy, sz }
}

function randomPositionInZone(zoneId: number, orbitRadius: number): [number, number, number] {
  const { sx, sy, sz } = zoneSigns(zoneId)
  const v = new Vector3(
    sx * randomInRange(0.2, 1),
    sy * randomInRange(0.2, 1),
    sz * randomInRange(0.2, 1),
  )

  v.normalize().multiplyScalar(orbitRadius)
  return [v.x, v.y, v.z]
}

function createPlacements(repos: SelectedRepo[], orbitRadius: number): Placement[] {
  return Array.from({ length: 8 }, (_, zoneId) => {
    const repo = repos[zoneId % repos.length]

    return {
      repoId: repo.id,
      zoneId,
      position: randomPositionInZone(zoneId, orbitRadius),
      cityType: repo.cityType,
    }
  })
}

function savePlacements(placements: Placement[]) {
  if (typeof window === 'undefined') return

  const payload: StoredPayload = {
    version: STORAGE_VERSION,
    placements,
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
}

export function getOrCreatePlacements(repos: SelectedRepo[], orbitRadius: number): Placement[] {
  const stored = loadStoredPayload()
  if (stored && isValidPayload(stored, repos)) return stored.placements

  const placements = createPlacements(repos, orbitRadius)
  savePlacements(placements)
  return placements
}
