import { point, booleanPointInPolygon } from '@turf/turf'

interface SectorWithPolygon {
  id: number
  nombre: string
  centerLat: number | null
  centerLng: number | null
  polygon: string | null
}

export function detectSectorForPoint(lat: number, lng: number, sectors: SectorWithPolygon[]) {
  const pt = point([lng, lat]) // GeoJSON uses [lng, lat]
  for (const sector of sectors) {
    if (!sector.polygon) continue
    try {
      const geom = JSON.parse(sector.polygon)
      if (booleanPointInPolygon(pt, geom)) return sector
    } catch {}
  }
  return null
}

export function createRectPolygon(
  centerLat: number,
  centerLng: number,
  dLat: number,
  dLng: number
): string {
  const coords = [
    [centerLng - dLng, centerLat - dLat],
    [centerLng + dLng, centerLat - dLat],
    [centerLng + dLng, centerLat + dLat],
    [centerLng - dLng, centerLat + dLat],
    [centerLng - dLng, centerLat - dLat],
  ]
  return JSON.stringify({ type: 'Polygon', coordinates: [coords] })
}
