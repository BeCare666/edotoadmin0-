import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

// Même fond de carte que le site client (OpenFreeMap : gratuit, usage commercial autorisé, sans clé).
const MAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty';
const COTONOU: [number, number] = [2.4183, 6.3654];

interface Props {
  value: { lat: number; lng: number } | null;
  onChange: (p: { lat: number; lng: number }) => void;
}

/** Position du centre de traitement : clic sur la carte ou déplacement du repère. */
export default function CenterMap({ value, onChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    const map = new maplibregl.Map({
      container: containerRef.current as HTMLDivElement,
      style: MAP_STYLE,
      center: value ? [value.lng, value.lat] : COTONOU,
      zoom: value ? 15 : 12,
      attributionControl: false,
    });
    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-left');
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    map.on('click', (e) => onChangeRef.current({ lat: e.lngLat.lat, lng: e.lngLat.lng }));
    mapRef.current = map;
    return () => {
      markerRef.current = null;
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !value) return;
    const lngLat: [number, number] = [value.lng, value.lat];
    if (!markerRef.current) {
      const marker = new maplibregl.Marker({ color: '#FF6EA9', draggable: true })
        .setLngLat(lngLat)
        .addTo(map);
      marker.on('dragend', () => {
        const p = marker.getLngLat();
        onChangeRef.current({ lat: p.lat, lng: p.lng });
      });
      markerRef.current = marker;
    } else {
      markerRef.current.setLngLat(lngLat);
    }
    if (!map.getBounds().contains(lngLat)) map.easeTo({ center: lngLat, duration: 500 });
  }, [value]);

  return (
    <div className="relative h-72 w-full overflow-hidden rounded-lg border border-border-200">
      <div
        ref={containerRef}
        style={{ position: 'absolute', inset: 0 }}
        aria-label="Carte : placez le centre de traitement"
      />
    </div>
  );
}
