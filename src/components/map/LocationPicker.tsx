import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { Navigation, MapPin } from 'lucide-react';

// Fix Leaflet marker icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface LocationPickerProps {
  latitude: number | null;
  longitude: number | null;
  onLocationChange: (lat: number, lng: number) => void;
  onAddressChange: (address: string) => void;
  isLocating: boolean;
  onLocate: () => void;
}

export function LocationPicker({
  latitude,
  longitude,
  onLocationChange,
  onAddressChange,
  isLocating,
  onLocate,
}: LocationPickerProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const defaultLat = latitude || 28.6139;
    const defaultLng = longitude || 77.209;

    mapRef.current = L.map(mapContainer.current).setView([defaultLat, defaultLng], 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(mapRef.current);

    // Add draggable marker
    markerRef.current = L.marker([defaultLat, defaultLng], {
      draggable: true,
    }).addTo(mapRef.current);

    // Handle marker drag
    markerRef.current.on('dragend', async () => {
      const position = markerRef.current?.getLatLng();
      if (position) {
        onLocationChange(position.lat, position.lng);
        await reverseGeocode(position.lat, position.lng);
      }
    });

    // Handle map click
    mapRef.current.on('click', async (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      markerRef.current?.setLatLng([lat, lng]);
      onLocationChange(lat, lng);
      await reverseGeocode(lat, lng);
    });

    setIsMapReady(true);

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // Update marker when location changes from outside
  useEffect(() => {
    if (!mapRef.current || !markerRef.current || !latitude || !longitude) return;
    
    markerRef.current.setLatLng([latitude, longitude]);
    mapRef.current.setView([latitude, longitude], 15);
  }, [latitude, longitude]);

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const data = await response.json();
      if (data.display_name) {
        onAddressChange(data.display_name);
      }
    } catch (error) {
      console.error('Failed to get address:', error);
    }
  };

  return (
    <div className="space-y-2">
      <div className="relative rounded-lg overflow-hidden border border-border">
        <div ref={mapContainer} className="h-[200px] w-full" />
        <div className="absolute bottom-2 right-2 z-[1000]">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onLocate}
            disabled={isLocating}
            className="shadow-md"
          >
            <Navigation className="h-4 w-4 mr-1" />
            {isLocating ? 'Locating...' : 'My Location'}
          </Button>
        </div>
      </div>
      <p className="text-xs text-muted-foreground flex items-center gap-1">
        <MapPin className="h-3 w-3" />
        Click on the map or drag the marker to adjust location
      </p>
    </div>
  );
}
