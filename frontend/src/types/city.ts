export type CityType = 'BUILDER' | 'FIXER' | 'EXPLORER' | 'ARTIST'

export const CITY_TYPES: CityType[] = ['BUILDER', 'FIXER', 'EXPLORER', 'ARTIST']

export const CITY_STYLE: Record<
  CityType,
  {
    color: string
    shape: 'box' | 'cone' | 'cylinder' | 'torus'
  }
> = {
  BUILDER: { color: '#4f8cff', shape: 'box' },
  FIXER: { color: '#ff4f6d', shape: 'cone' },
  EXPLORER: { color: '#3ed38b', shape: 'cylinder' },
  ARTIST: { color: '#b88cff', shape: 'torus' },
}

export function cityTypeForIndex(index: number): CityType {
  return CITY_TYPES[index % CITY_TYPES.length]
}
