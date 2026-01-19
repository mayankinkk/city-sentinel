import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Issue, issueTypeIcons, issueTypeLabels, statusLabels } from '@/types/issue';
import { formatDistanceToNow } from 'date-fns';

interface MapViewProps {
  issues: Issue[];
  center?: [number, number];
  zoom?: number;
  onIssueClick?: (issue: Issue) => void;
  showHeatmap?: boolean;
}

// Fix Leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const statusColors = {
  pending: '#f59e0b',
  in_progress: '#3b82f6',
  resolved: '#22c55e',
};

const priorityColors = {
  low: '#22c55e',
  medium: '#f59e0b',
  high: '#ef4444',
};

export function MapView({ 
  issues, 
  center = [40.7128, -74.0060], 
  zoom = 12,
  onIssueClick,
  showHeatmap = false
}: MapViewProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const heatLayerRef = useRef<any>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize map
    mapRef.current = L.map(mapContainerRef.current).setView(center, zoom);

    // Add tile layer with a modern style
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(mapRef.current);

    // Initialize markers layer group
    markersRef.current = L.layerGroup().addTo(mapRef.current);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !markersRef.current) return;

    // Clear existing markers
    markersRef.current.clearLayers();

    // Remove existing heat layer
    if (heatLayerRef.current && mapRef.current.hasLayer(heatLayerRef.current)) {
      mapRef.current.removeLayer(heatLayerRef.current);
    }

    if (showHeatmap && issues.length > 0) {
      // Dynamic import for heatmap
      import('leaflet.heat').then((heat) => {
        if (!mapRef.current) return;
        
        const heatData = issues.map(issue => [
          issue.latitude,
          issue.longitude,
          issue.priority === 'high' ? 1 : issue.priority === 'medium' ? 0.6 : 0.3
        ]) as [number, number, number][];

        heatLayerRef.current = (L as any).heatLayer(heatData, {
          radius: 25,
          blur: 15,
          maxZoom: 17,
          gradient: {
            0.2: '#22c55e',
            0.5: '#f59e0b',
            1: '#ef4444'
          }
        }).addTo(mapRef.current);
      });
    }

    // Add markers for each issue
    issues.forEach((issue) => {
      const markerColor = statusColors[issue.status];
      const priorityColor = priorityColors[issue.priority];
      
      // Create custom icon
      const icon = L.divIcon({
        className: 'custom-marker',
        html: `
          <div style="
            background: ${markerColor};
            width: 36px;
            height: 36px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            border: 3px solid white;
          ">
            ${issueTypeIcons[issue.issue_type]}
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      const marker = L.marker([issue.latitude, issue.longitude], { icon })
        .addTo(markersRef.current!);

      // Create popup content
      const popupContent = `
        <div style="padding: 12px; min-width: 200px; font-family: 'Plus Jakarta Sans', sans-serif;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
            <span style="font-size: 24px;">${issueTypeIcons[issue.issue_type]}</span>
            <div>
              <h3 style="font-weight: 600; font-size: 14px; margin: 0; color: #1e293b;">${issue.title}</h3>
              <p style="font-size: 12px; color: #64748b; margin: 0;">${issueTypeLabels[issue.issue_type]}</p>
            </div>
          </div>
          <p style="font-size: 13px; color: #475569; margin: 0 0 12px 0; line-height: 1.4;">${issue.description.substring(0, 100)}${issue.description.length > 100 ? '...' : ''}</p>
          <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 8px;">
            <span style="
              display: inline-flex;
              align-items: center;
              gap: 4px;
              padding: 2px 8px;
              border-radius: 9999px;
              font-size: 11px;
              font-weight: 600;
              background: ${markerColor}20;
              color: ${markerColor};
            ">
              ${statusLabels[issue.status]}
            </span>
            <span style="
              display: inline-flex;
              align-items: center;
              gap: 4px;
              padding: 2px 8px;
              border-radius: 9999px;
              font-size: 11px;
              font-weight: 600;
              background: ${priorityColor}20;
              color: ${priorityColor};
            ">
              ${issue.priority.charAt(0).toUpperCase() + issue.priority.slice(1)} Priority
            </span>
          </div>
          <p style="font-size: 11px; color: #94a3b8; margin: 0;">
            Reported ${formatDistanceToNow(new Date(issue.created_at), { addSuffix: true })}
          </p>
          ${issue.image_url ? `<img src="${issue.image_url}" alt="Issue" style="width: 100%; height: 120px; object-fit: cover; border-radius: 8px; margin-top: 8px;" />` : ''}
          <a href="/issues/${issue.id}" style="
            display: block;
            text-align: center;
            padding: 8px 16px;
            background: linear-gradient(135deg, #3b82f6 0%, #14b8a6 100%);
            color: white;
            border-radius: 8px;
            text-decoration: none;
            font-size: 13px;
            font-weight: 600;
            margin-top: 12px;
          ">View Details</a>
        </div>
      `;

      marker.bindPopup(popupContent, {
        maxWidth: 300,
        className: 'custom-popup'
      });

      if (onIssueClick) {
        marker.on('click', () => onIssueClick(issue));
      }
    });

    // Fit bounds if there are issues
    if (issues.length > 0) {
      const bounds = L.latLngBounds(issues.map(issue => [issue.latitude, issue.longitude]));
      mapRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [issues, showHeatmap, onIssueClick]);

  return (
    <div 
      ref={mapContainerRef} 
      className="w-full h-full rounded-xl overflow-hidden shadow-lg"
      style={{ minHeight: '400px' }}
    />
  );
}
