
'use client';

import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useState, memo, useRef, useCallback } from 'react';

// Fix for default icon issue with webpack that could arise
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface MapSelectorProps {
  onPositionChange: (position: { lat: number; lng: number }) => void;
  initialPosition: { lat: number; lng: number };
  height?: string;
}

function MapResizer({ height }: { height?: string }) {
    const map = useMap();
    useEffect(() => {
        const timer = setTimeout(() => {
            map.invalidateSize();
        }, 100); 
        return () => clearTimeout(timer);
    }, [height, map]);
    return null;
}

function LocationMarker({ onPositionChange, initialPosition }: Omit<MapSelectorProps, 'height'>) {
  const [position, setPosition] = useState(initialPosition);
  const map = useMap();

  useEffect(() => {
    if (initialPosition.lat !== position.lat || initialPosition.lng !== position.lng) {
      map.flyTo(initialPosition, map.getZoom());
      setPosition(initialPosition);
    }
  }, [initialPosition, map, position.lat, position.lng]);
  
  useMapEvents({
    click(e) {
      const newPos = e.latlng;
      setPosition(newPos);
      onPositionChange(newPos);
    },
  });

  return position === null ? null : (
    <Marker 
      position={position} 
      draggable={true} 
      eventHandlers={{
        dragend(e) {
          const newPos = e.target.getLatLng();
          setPosition(newPos);
          onPositionChange(newPos);
        },
      }}
    />
  );
}

const MapSelector = memo(function MapSelector({ onPositionChange, initialPosition, height }: MapSelectorProps) {
  const mapRef = useRef<L.Map | null>(null);

  // This is the key change: we use a ref to hold the map instance and a cleanup effect.
  // This ensures that even with React's Strict Mode double-invoking effects in development,
  // we clean up the old map instance before creating a new one.
  const mapContainerRef = useCallback((node: HTMLDivElement | null) => {
    if (node !== null) {
      // If a map instance already exists, remove it before re-initializing
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      
      const map = L.map(node, {
        center: initialPosition,
        zoom: 13,
        zoomControl: true,
      });

      L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community' }
      ).addTo(map);

      const marker = L.marker(initialPosition, { draggable: true }).addTo(map);

      marker.on('dragend', (e) => {
        const newPos = e.target.getLatLng();
        onPositionChange(newPos);
      });

      map.on('click', (e) => {
        const newPos = e.latlng;
        marker.setLatLng(newPos);
        onPositionChange(newPos);
      });
      
      mapRef.current = map;
    }
  }, [initialPosition, onPositionChange]);
  
  return (
    <div ref={mapContainerRef} style={{ height: height || '400px' }} className="w-full rounded-md z-0 transition-all duration-500 ease-in-out">
      {/* The MapContainer is no longer used directly to prevent react-leaflet's initialization logic from conflicting. */}
    </div>
  );
});

export default MapSelector;
