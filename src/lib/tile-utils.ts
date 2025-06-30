import { MapContainer, TileLayer, Marker, Rectangle, useMap, GeoJSON, WMSTileLayer, useMapEvents, Rectangle as LeafletRectangleComponent, Polygon as LeafletPolygonComponent } from "react-leaflet";
import { WmsLayer } from '@sentinel-hub/sentinelhub-js';
import type { Polygon as GeoJSONPolygon, GeoJsonObject, MultiPolygon as GeoJSONMultiPolygon, Feature } from 'geojson';
import { Polygon, EmbeddingData, TileData } from "@/lib/types";

export function latLonToTile(lat: number, lon: number, zoom: number) {
  const n = Math.pow(2, zoom);
  const x = Math.floor((lon + 180) / 360 * n);
  const latRad = lat * Math.PI / 180;
  const y = Math.floor((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n);
  return { x, y, z: zoom };
}

export function tileToBounds(x: number, y: number, z: number) {
  const n = Math.pow(2, z);
  
  const west = x / n * 360 - 180;
  const east = (x + 1) / n * 360 - 180;
  
  const radianToDegree = 180 / Math.PI;
  const north = Math.atan(Math.sinh(Math.PI * (1 - 2 * y / n))) * radianToDegree;
  const south = Math.atan(Math.sinh(Math.PI * (1 - 2 * (y + 1) / n))) * radianToDegree;
  
  return { north, south, east, west };
}

export function latLngToTile(lat: number, lng: number, zoom: number) {
  const n = Math.pow(2, zoom);
  const x = Math.floor((lng + 180) / 360 * n);
  const y = Math.floor((1 - Math.asinh(Math.tan(lat * Math.PI / 180)) / Math.PI) / 2 * n);
  return { x, y };
}

// Convert tile coordinates to lat/lng
export function tileToLatLng(x: number, y: number, zoom: number) {
  const n = Math.pow(2, zoom);
  const lat = Math.atan(Math.sinh(Math.PI * (1 - 2 * y / n))) * 180 / Math.PI;
  const lng = x / n * 360 - 180;
  return { lat, lng };
}

// Get tile bounds
export function getTileBounds(x: number, y: number, zoom: number) {
  const nw = tileToLatLng(x, y, zoom);
  const se = tileToLatLng(x + 1, y + 1, zoom);

  return {
    north: nw.lat,
    south: se.lat,
    east: se.lng,
    west: nw.lng
  };
}

// Get tile center coordinates
export function getTileCenter(x: number, y: number, zoom: number) {
  const bounds = getTileBounds(x, y, zoom);
  return {
    lat: (bounds.north + bounds.south) / 2,
    lng: (bounds.east + bounds.west) / 2
  };
}

// Check if a point is inside a polygon using ray casting algorithm
export function pointInPolygon(point: [number, number], polygon: number[][]): boolean {
  const [x, y] = point;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];

    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }

  return inside;
}

// Check if tile center is within GeoJSON region
export function isTileInRegion(x: number, y: number, zoom: number, geoJson: Feature<GeoJSONPolygon | GeoJSONMultiPolygon>): boolean {
  const nw = tileToLatLng(x, y, zoom);       // top-left
  const ne = tileToLatLng(x + 1, y, zoom);   // top-right
  const sw = tileToLatLng(x, y + 1, zoom);   // bottom-left
  const se = tileToLatLng(x + 1, y + 1, zoom); // bottom-right

  // GeoJSON uses [lng, lat]
  const corners: [number, number][] = [
    [nw.lng, nw.lat],
    [ne.lng, ne.lat],
    [sw.lng, sw.lat],
    [se.lng, se.lat],
  ];

  const geometry = geoJson.geometry;

function cornerInPolygon(point: [number, number]): boolean {
    switch (geometry.type) {
      case 'Polygon':
        return pointInPolygon(point, geometry.coordinates[0]);
      case 'MultiPolygon':
        // Check if any part of the MultiPolygon contains the point
        return geometry.coordinates.some(polygon => pointInPolygon(point, polygon[0]));
      default:
        return false;
    }
  }

  // If any corner is inside or on the boundary of the polygon, return true
  return corners.some(cornerInPolygon);
}

// Get bounding box of GeoJSON
export function getGeoJsonBounds(geoJson: Feature<GeoJSONPolygon | GeoJSONMultiPolygon>) {
  let minLat = Infinity, maxLat = -Infinity;
  let minLng = Infinity, maxLng = -Infinity;

  const processCoordinates = (coords: any) => {
    if (Array.isArray(coords[0]) && typeof coords[0][0] === 'number') { // Detects [lng, lat] array
      coords.forEach(([lng, lat]: number[]) => {
        minLat = Math.min(minLat, lat);
        maxLat = Math.max(maxLat, lat);
        minLng = Math.min(minLng, lng);
        maxLng = Math.max(maxLng, lng);
      });
    } else if (Array.isArray(coords[0])) { // Nested arrays (e.g., [ [[...]] ] for Polygon)
      coords.forEach(processCoordinates);
    }
    // Base case: coords is [lng, lat] -- already handled by the first if or implicitly by recursion
  };

  processCoordinates(geoJson.geometry.coordinates);

  return { minLat, maxLat, minLng, maxLng };
}

// Generate tiles that intersect with the polygon
export function generateTilesFromPolygon(feature: Feature<GeoJSONPolygon | GeoJSONMultiPolygon>, zoom: number): TileData[] {
  const bounds = getGeoJsonBounds(feature);
  
    const southWest = latLngToTile(bounds.minLat, bounds.minLng, zoom);
    const northEast = latLngToTile(bounds.maxLat, bounds.maxLng, zoom);

    const tiles: TileData[] = [];
    const uniqueTiles = new Set<string>();
  
  // Generate all tiles within the bounding box
  for (let x = southWest.x; x <= northEast.x; x++) {
    for (let y = northEast.y; y <= southWest.y; y++) {
      const tileKey = `${x}-${y}-${zoom}`;

      if (uniqueTiles.has(tileKey)) continue;
      uniqueTiles.add(tileKey);

      if (isTileInRegion(x, y, zoom, feature)) {
        const center = getTileCenter(x, y, zoom);
        const tileBounds = getTileBounds(x, y, zoom);

        const tileUrl = `https://services.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/tile/${zoom}/${y}/${x}`;

        tiles.push({
          url: tileUrl,
          x: x,
          y: y,
          zoom: zoom,
          center: {lat: center.lat, lng: center.lng},
          bounds: tileBounds,
          alt: `Satellite tile at ${center.lat.toFixed(6)}, ${center.lng.toFixed(6)}`,
          caption: `ESRI satellite imagery tile (${x}, ${y}) at zoom ${zoom}, center: ${center.lat.toFixed(6)}, ${center.lng.toFixed(6)}`
        });
      }
    }
  }
  
  return tiles;
}

// Calculate the pixel coordinates for a tile
export function tileToPixels(x: number, y: number, z: number) {
  const scale = Math.pow(2, z);
  const pixelX = x * 256;
  const pixelY = y * 256;
  return { pixelX, pixelY, scale };
}