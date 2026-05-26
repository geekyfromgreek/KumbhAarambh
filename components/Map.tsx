"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

interface MarkerData {
  id: string;
  title: string;
  lat: number;
  lng: number;
  price?: string;
  type?: "stay" | "food" | "ghat" | "sos" | "lost_found";
  status?: string;
}

interface MapProps {
  center: [number, number];
  zoom: number;
  markers: MarkerData[];
  onMarkerClick?: (marker: MarkerData) => void;
}

export default function Map({ center, zoom, markers, onMarkerClick }: MapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const initMap = async () => {
      if (mapRef.current) return;

      // Dynamic import to bypass SSR node compilation
      const L = await import("leaflet");

      if (mapRef.current) return;

      // Initialize map instance
      const mapInstance = L.map(mapContainerRef.current!, {
        zoomControl: false,
        attributionControl: false
      });
      mapRef.current = mapInstance;

      // Set view
      mapInstance.setView(center, zoom);

      // Add modern clean map tiles (OpenStreetMap warm style or similar)
      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        maxZoom: 19,
      }).addTo(mapInstance);

      // Add zoom control to top-right
      L.control.zoom({ position: "topright" }).addTo(mapInstance);

      // Create a layer group for markers
      markersLayerRef.current = L.layerGroup().addTo(mapInstance);

      // Render markers
      renderMarkers(L);
    };

    initMap();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update markers when props change
  useEffect(() => {
    if (mapRef.current && markersLayerRef.current) {
      import("leaflet").then((L) => {
        markersLayerRef.current.clearLayers();
        renderMarkers(L);
      });
    }
  }, [markers]);

  const renderMarkers = (L: any) => {
    markers.forEach((marker) => {
      // Define custom color based on type
      let markerColor = "#a33800"; // primary saffron
      let markerIcon = "location_on";

      if (marker.type === "stay") {
        markerColor = "#cc4800"; // stays orange
        markerIcon = "hotel";
      } else if (marker.type === "food") {
        markerColor = "#765700"; // gold food
        markerIcon = "local_dining";
      } else if (marker.type === "ghat") {
        markerColor = marker.status === "HIGH" ? "#ba1a1a" : "#2e7d32"; // red/green flag
        markerIcon = "waves";
      } else if (marker.type === "sos") {
        markerColor = "#ba1a1a"; // SOS red
        markerIcon = "warning";
      } else if (marker.type === "lost_found") {
        markerColor = marker.status === "LOST" ? "#ba1a1a" : "#8e24aa"; // red for lost, purple for found
        markerIcon = "search";
      }

      // Create a premium custom glowing SVG marker icon
      const customSvgIcon = L.divIcon({
        className: "custom-leaflet-icon",
        html: `
          <div style="
            display: flex;
            align-items: center;
            justify-content: center;
            width: 38px;
            height: 38px;
            background-color: ${markerColor}20;
            border: 2px solid ${markerColor};
            border-radius: 50%;
            box-shadow: 0 0 10px ${markerColor}40;
            cursor: pointer;
            transition: all 0.3s;
          " class="hover:scale-110 active:scale-95">
            <div style="
              display: flex;
              align-items: center;
              justify-content: center;
              width: 28px;
              height: 28px;
              background-color: ${markerColor};
              border-radius: 50%;
              color: white;
            ">
              <span class="material-symbols-outlined" style="font-size: 16px; font-weight: bold;">
                ${markerIcon}
              </span>
            </div>
          </div>
        `,
        iconSize: [38, 38],
        iconAnchor: [19, 19],
        popupAnchor: [0, -20]
      });

      const mapMarker = L.marker([marker.lat, marker.lng], { icon: customSvgIcon })
        .addTo(markersLayerRef.current);

      // Create a nice styled popup
      const popupContent = `
        <div style="font-family: sans-serif; padding: 4px; min-width: 140px;">
          <h4 style="margin: 0 0 4px 0; font-size: 13px; font-weight: bold; color: #1e1b16;">${marker.title}</h4>
          ${marker.price ? `<p style="margin: 0; font-size: 11px; font-weight: bold; color: #a33800;">Price: ${marker.price}</p>` : ""}
          ${marker.status ? `<p style="margin: 0; font-size: 11px; font-weight: bold; color: #765700;">Status: ${marker.status}</p>` : ""}
        </div>
      `;

      mapMarker.bindPopup(popupContent);

      if (onMarkerClick) {
        mapMarker.on("click", () => {
          onMarkerClick(marker);
        });
      }
    });
  };

  return (
    <div 
      ref={mapContainerRef} 
      className="w-full h-full bg-surface-container border border-outline-variant/30 rounded-2xl sacred-shadow-lg" 
      style={{ minHeight: "350px" }}
    />
  );
}
