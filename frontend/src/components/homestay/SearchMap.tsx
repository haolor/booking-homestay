import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import type { HomestayListItem } from '../../types';

const icon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

type Props = {
  items: HomestayListItem[];
  center: [number, number];
};

type MarkerPoint = {
  homestay: HomestayListItem;
  position: [number, number];
};

function FitMapBounds({ markers }: { markers: MarkerPoint[] }) {
  const map = useMap();

  useEffect(() => {
    if (markers.length === 0) return;
    if (markers.length === 1) {
      map.setView(markers[0].position, 12);
      return;
    }
    const bounds = L.latLngBounds(markers.map((m) => m.position));
    map.fitBounds(bounds, { padding: [30, 30], maxZoom: 13 });
  }, [map, markers]);

  return null;
}

export function SearchMap({ items, center }: Props) {
  const withCoords = items.filter((h) => {
    if (h.latitude === null || h.longitude === null) return false;
    const latRaw = String(h.latitude).trim();
    const lngRaw = String(h.longitude).trim();
    if (!latRaw || !lngRaw) return false;
    const lat = Number(latRaw);
    const lng = Number(lngRaw);
    return Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  });
  const grouped = new Map<string, number>();

  const markers = withCoords.map((h) => {
    const lat = Number(h.latitude);
    const lng = Number(h.longitude);
    const key = `${lat.toFixed(6)},${lng.toFixed(6)}`;
    const idx = grouped.get(key) ?? 0;
    grouped.set(key, idx + 1);

    // If multiple homestays share exact same coordinates, spread markers slightly
    // so users can see and click each one.
    if (idx === 0) {
      return { homestay: h, position: [lat, lng] as [number, number] };
    }
    const radius = 0.00025 * Math.ceil(idx / 6);
    const angle = (idx % 6) * (Math.PI / 3);
    const adjLat = lat + radius * Math.sin(angle);
    const adjLng = lng + radius * Math.cos(angle);
    return { homestay: h, position: [adjLat, adjLng] as [number, number] };
  });

  return (
    <div className="relative h-full rounded-none overflow-hidden border-0 z-0 bg-stone-100">
      <MapContainer center={center} zoom={12} className="h-full w-full" scrollWheelZoom>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <FitMapBounds markers={markers} />
        {markers.map(({ homestay, position }) => (
          <Marker
            key={homestay.id}
            position={position}
            icon={icon}
          >
            <Popup>
              <Link to={`/homestays/${homestay.id}`} className="font-semibold text-brand-700">
                {homestay.title}
              </Link>
              <div className="text-xs text-slate-600">{homestay.city}</div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      {items.length === 0 && (
        <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] grid place-items-center p-6 text-center">
          <div>
            <p className="text-sm font-semibold text-stone-700">Không có dữ liệu để hiển thị trên bản đồ</p>
            <p className="text-xs text-stone-500 mt-1">Thử đổi thành phố hoặc xóa bộ lọc để xem thêm homestay.</p>
          </div>
        </div>
      )}
    </div>
  );
}
