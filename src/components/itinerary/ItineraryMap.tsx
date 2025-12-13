'use client';

import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix icon marker default Leaflet di Next.js/React
const iconDefault = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Custom green leaf icon untuk eco-friendly
const greenIcon = L.icon({
  iconUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Cpath fill='%2342C296' d='M16 2C8.3 2 2 8.3 2 16s6.3 14 14 14 14-6.3 14-14S23.7 2 16 2zm0 26c-6.6 0-12-5.4-12-12S9.4 4 16 4s12 5.4 12 12-5.4 12-12 12z'/%3E%3Cpath fill='%2342C296' d='M16 8c-4.4 0-8 3.6-8 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zm0 14c-3.3 0-6-2.7-6-6s2.7-6 6-6 6 2.7 6 6-2.7 6-6 6z'/%3E%3C/svg%3E",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

interface Place {
  id: string;
  name: string;
  description: string;
  category: string;
  timeSlot: string;
  duration: number;
  coordinates: {
    lat: number;
    lng: number;
  };
}

interface ItineraryMapProps {
  mapCenter: { lat: number; lng: number };
  places: Place[];
  selectedPlaceId?: string | null;
  onPlaceClick?: (placeId: string) => void;
}

export default function ItineraryMap({
  mapCenter,
  places,
  selectedPlaceId,
  onPlaceClick,
}: ItineraryMapProps) {
  // Generate polyline untuk route
  const routePath: [number, number][] = places.map((place) => [
    place.coordinates.lat,
    place.coordinates.lng,
  ]);

  return (
    <div className="w-full h-full relative">
      <MapContainer
        center={[mapCenter.lat, mapCenter.lng]}
        zoom={13}
        style={{ height: '100%', width: '100%', zIndex: 0 }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Polyline untuk route */}
        {routePath.length > 1 && (
          <Polyline
            positions={routePath}
            color="#42C296"
            weight={4}
            opacity={0.7}
          />
        )}

        {/* Markers untuk setiap place */}
        {places.map((place) => (
          <Marker
            key={place.id}
            position={[place.coordinates.lat, place.coordinates.lng]}
            icon={greenIcon}
            eventHandlers={{
              click: () => {
                if (onPlaceClick) {
                  onPlaceClick(place.id);
                }
              },
            }}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-semibold text-sm mb-1">{place.name}</h3>
                <p className="text-xs text-gray-600 mb-1">{place.description}</p>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-gray-500">⏰ {place.timeSlot}</span>
                  <span className="text-gray-500">•</span>
                  <span className="text-gray-500">{place.duration} min</span>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

