import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { env } from '@/config/env';
import type { LatLng, MapMarker } from '@/types/common';

// Fix Leaflet's default marker icons в Vite
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface FlyToProps {
  center?: LatLng;
}

function FlyTo({ center }: FlyToProps) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo([center.lat, center.lng], map.getZoom());
  }, [center, map]);
  return null;
}

interface AppMapProps {
  center?: LatLng;
  zoom?: number;
  markers?: MapMarker[];
  className?: string;
  onMarkerClick?: (marker: MapMarker) => void;
}

/**
 * Готовый компонент карты на Leaflet (OpenStreetMap, бесплатно).
 * ИИ использует <AppMap /> для отображения карт.
 *
 * @example
 * <AppMap
 *   center={{ lat: 55.75, lng: 37.61 }}
 *   markers={[{ id: '1', lat: 55.75, lng: 37.61, title: 'Москва' }]}
 * />
 */
export function AppMap({
  center = { lat: 55.751244, lng: 37.618423 },
  zoom = 12,
  markers = [],
  className,
  onMarkerClick,
}: AppMapProps) {
  return (
    <div className={cn('rounded-lg overflow-hidden border border-border', className)}>
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={zoom}
        style={{ height: '100%', width: '100%', minHeight: 300 }}
      >
        <TileLayer
          url={env.MAP_TILE_URL}
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        <FlyTo center={center} />
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            position={[marker.lat, marker.lng]}
            eventHandlers={{ click: () => onMarkerClick?.(marker) }}
          >
            {(marker.title || marker.description) && (
              <Popup>
                {marker.title && (
                  <strong className="block font-semibold">{marker.title}</strong>
                )}
                {marker.description && (
                  <span className="text-sm text-muted-foreground">
                    {marker.description}
                  </span>
                )}
              </Popup>
            )}
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
