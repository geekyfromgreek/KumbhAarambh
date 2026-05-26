"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Navigation, Crosshair, Map } from "lucide-react";

interface LocationPromptProps {
  onComplete?: () => void;
  forceOpen?: boolean;
}

const hotspots = [
  { name: "Panchavati (Ram Kund)", lat: 20.0092, lng: 73.7915 },
  { name: "Trimbakeshwar Temple", lat: 19.9310, lng: 73.5290 },
  { name: "Nashik Railway Station", lat: 19.9975, lng: 73.7898 },
  { name: "Tapovan (Sita Gufa)", lat: 20.0138, lng: 73.7862 },
  { name: "Gangapur Road", lat: 19.9990, lng: 73.7240 },
  { name: "Someshwar Area", lat: 19.9850, lng: 73.7300 },
  { name: "Muktidham (Nashik Road)", lat: 19.9970, lng: 73.7820 }
];

const getNearestHotspot = (lat: number, lng: number) => {
  let minDistance = Infinity;
  let nearestName = "Nashik Mela Area";
  
  hotspots.forEach(h => {
    const dLat = (h.lat - lat) * Math.PI / 180;
    const dLng = (h.lng - lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat * Math.PI / 180) * Math.cos(h.lat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const d = 6371 * c; // Distance in km
    
    if (d < minDistance) {
      minDistance = d;
      nearestName = h.name;
    }
  });
  
  return nearestName;
};

export default function LocationPrompt({ onComplete, forceOpen = false }: LocationPromptProps) {
  const [show, setShow] = useState(forceOpen);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (forceOpen) {
      setShow(true);
      return;
    }
    
    const lat = localStorage.getItem("kumbh_user_latitude");
    const lng = localStorage.getItem("kumbh_user_longitude");
    
    // Only ask once (if not already set)
    if (!lat || !lng) {
      const hasIntroRun = sessionStorage.getItem("kumbh_intro_run");
      const delay = hasIntroRun === "true" ? 800 : 3500;
      
      const timer = setTimeout(() => {
        setShow(true);
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [forceOpen]);

  const saveLocation = (lat: number, lng: number, name: string) => {
    localStorage.setItem("kumbh_user_latitude", lat.toString());
    localStorage.setItem("kumbh_user_longitude", lng.toString());
    localStorage.setItem("kumbh_user_location_name", name);
    setShow(false);
    if (onComplete) onComplete();
  };

  const handleGPS = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`, {
            headers: {
              "Accept-Language": "en",
              "User-Agent": "KumbhAarambh-App"
            }
          });
          let name = "";
          if (res.ok) {
            const data = await res.json();
            const addr = data.address;
            if (addr) {
              name = addr.hotel || addr.tourism || addr.amenity || addr.suburb || addr.neighbourhood || addr.village || addr.road || addr.county || "";
            }
            if (!name) {
              name = data.name || data.display_name?.split(",")[0] || "";
            }
          }
          if (!name) {
            name = getNearestHotspot(lat, lng);
          }
          saveLocation(lat, lng, name);
        } catch (e) {
          saveLocation(lat, lng, getNearestHotspot(lat, lng));
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        console.warn("GPS error:", error);
        setLoading(false);
        alert("Unable to retrieve GPS. Please select a hotspot manually.");
      },
      { timeout: 10000 }
    );
  };

  return (
    <AnimatePresence>
      {show && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-[100]"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm bg-surface rounded-3xl p-6 z-[110] sacred-shadow-lg border border-outline-variant/30 text-center"
          >
            <div className="w-16 h-16 bg-primary-fixed rounded-2xl flex items-center justify-center mx-auto border border-primary/20 shadow-inner mb-4">
              <MapPin size={32} className="text-primary animate-bounce mt-1" />
            </div>
            
            <h3 className="text-xl font-extrabold text-on-surface mb-2 tracking-tight">Set Your Location</h3>
            <p className="text-xs text-on-surface-variant leading-relaxed mb-6">
              KumbhAarambh personalizes stays, free food spots, and ghat safety warnings based on your proximity.
            </p>

            <div className="space-y-3">
              <button
                onClick={handleGPS}
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-primary text-on-primary font-bold text-sm shadow-md hover:bg-primary-container transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
              >
                {loading ? (
                  <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                ) : (
                  <Crosshair size={18} />
                )}
                {loading ? "Locating..." : "Use Current GPS Location"}
              </button>

              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-outline-variant/30"></div>
                <span className="flex-shrink-0 mx-4 text-[10px] uppercase font-bold text-outline">or manually select</span>
                <div className="flex-grow border-t border-outline-variant/30"></div>
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <Map size={16} className="text-primary/70" />
                </div>
                <select
                  onChange={(e) => {
                    const hotspot = hotspots.find(h => h.name === e.target.value);
                    if (hotspot) saveLocation(hotspot.lat, hotspot.lng, hotspot.name);
                  }}
                  className="w-full py-3.5 pl-10 pr-4 bg-surface-container-low border border-outline-variant/30 rounded-xl text-sm font-bold text-on-surface-variant cursor-pointer hover:border-primary/50 transition-all outline-none appearance-none"
                  defaultValue=""
                >
                  <option value="" disabled>Choose a Nashik Hotspot...</option>
                  {hotspots.map(h => (
                    <option key={h.name} value={h.name}>{h.name}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-outline">expand_more</span>
                </div>
              </div>
            </div>
            
            <p className="text-[9px] text-outline mt-5 italic">
              Your location is stored locally on your device for privacy.
            </p>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
