"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Header from "@/components/Header";
import Navbar from "@/components/Navbar";
import { motion, AnimatePresence } from "framer-motion";
import { Info, ShieldAlert, CheckCircle2, Eye, MapPin, X, LogIn } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { supabase } from "@/lib/supabaseClient";

// Dynamically import Map to bypass SSR Node build error
const Map = dynamic(() => import("@/components/Map"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[320px] bg-surface-container-high rounded-2xl flex items-center justify-center animate-pulse border border-outline-variant/20">
      <div className="text-center space-y-2">
        <span className="material-symbols-outlined text-4xl text-primary animate-spin">
          progress_activity
        </span>
        <p className="text-xs text-on-surface-variant font-bold">Loading Sacred Map...</p>
      </div>
    </div>
  )
});

interface Ghat {
  id: string;
  name: string;
  crowdLevel: "LOW" | "MODERATE" | "HIGH";
  flagColor: "GREEN" | "YELLOW" | "RED";
  desc: string;
  lat: number;
  lng: number;
  flowSpeed: string;
  lastUpdated: string;
  distance?: number;
}

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

const initialGhats: Ghat[] = [
  {
    id: "ghat-1",
    name: "Ram Kund (Main Ghat)",
    crowdLevel: "HIGH",
    flagColor: "RED",
    desc: "Holy spot of Asthi Visarjan. High crowd density due to auspicious bathing hour. RTO restrictions active.",
    lat: 20.0092,
    lng: 73.7915,
    flowSpeed: "1.2 m/s (Fast)",
    lastUpdated: "5 mins ago"
  },
  {
    id: "ghat-2",
    name: "Talkuteshwar Ghat",
    crowdLevel: "MODERATE",
    flagColor: "YELLOW",
    desc: "Bathing ghat downstream. Moderate crowds. Ideal for families looking for peaceful holy dip.",
    lat: 20.0158,
    lng: 73.7995,
    flowSpeed: "0.8 m/s (Moderate)",
    lastUpdated: "12 mins ago"
  },
  {
    id: "ghat-3",
    name: "Lakshman Kund",
    crowdLevel: "LOW",
    flagColor: "GREEN",
    desc: "Spacious bathing site with dedicated volunteers and security barricades. Highly recommended.",
    lat: 20.0078,
    lng: 73.7885,
    flowSpeed: "0.5 m/s (Calm)",
    lastUpdated: "20 mins ago"
  },
  {
    id: "ghat-4",
    name: "Kushavarta Kund",
    crowdLevel: "HIGH",
    flagColor: "RED",
    desc: "The sacred source of the Godavari river in Trimbakeshwar. Extremely crowded during Shahi Snan.",
    lat: 19.9324,
    lng: 73.5303,
    flowSpeed: "0.2 m/s (Still)",
    lastUpdated: "10 mins ago"
  },
  {
    id: "ghat-5",
    name: "Ahilya Godavari Sangam Ghat",
    crowdLevel: "MODERATE",
    flagColor: "YELLOW",
    desc: "Confluence of rivers. Great alternative for pilgrims wanting to avoid the Ram Kund rush.",
    lat: 20.0069,
    lng: 73.7850,
    flowSpeed: "0.9 m/s (Moderate)",
    lastUpdated: "15 mins ago"
  },
  {
    id: "ghat-6",
    name: "Someshwar Ghat",
    crowdLevel: "LOW",
    flagColor: "GREEN",
    desc: "Serene bathing spot near Someshwar Temple. Scenic, clean, and highly secure for elderly.",
    lat: 19.9855,
    lng: 73.7310,
    flowSpeed: "0.6 m/s (Calm)",
    lastUpdated: "1 hour ago"
  },
  {
    id: "ghat-7",
    name: "Sita Kund",
    crowdLevel: "LOW",
    flagColor: "GREEN",
    desc: "A quiet, sacred pool situated near Sita Gufa in Tapovan. Frequented by devotees looking for serene prayers.",
    lat: 20.0135,
    lng: 73.7858,
    flowSpeed: "0.3 m/s (Still)",
    lastUpdated: "15 mins ago"
  },
  {
    id: "ghat-8",
    name: "Surya Kund",
    crowdLevel: "MODERATE",
    flagColor: "YELLOW",
    desc: "Bathing pond dedicated to the Sun God. Located downstream on the Panchavati riverbanks.",
    lat: 20.0098,
    lng: 73.7930,
    flowSpeed: "0.7 m/s (Moderate)",
    lastUpdated: "30 mins ago"
  },
  {
    id: "ghat-9",
    name: "Ahilya Kund",
    crowdLevel: "LOW",
    flagColor: "GREEN",
    desc: "Sacred tank near the main Godavari flow named after Queen Ahilyabai Holkar. Clean and well-barricaded.",
    lat: 20.0089,
    lng: 73.7908,
    flowSpeed: "0.4 m/s (Calm)",
    lastUpdated: "45 mins ago"
  },
  {
    id: "ghat-10",
    name: "Gautama Kund",
    crowdLevel: "MODERATE",
    flagColor: "YELLOW",
    desc: "Sacred pond near Trimbakeshwar Temple. Believed to be where Sage Gautama performed penance to bring the Godavari down.",
    lat: 19.9332,
    lng: 73.5315,
    flowSpeed: "0.2 m/s (Still)",
    lastUpdated: "10 mins ago"
  }
];

export default function GhatsMonitor() {
  const router = useRouter();
  const { isSignedIn } = useUser();
  const [ghats, setGhats] = useState<Ghat[]>([]);
  const [selectedGhat, setSelectedGhat] = useState<Ghat | null>(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Report state
  const [reportGhatId, setReportGhatId] = useState("ghat-1");
  const [reportedDensity, setReportedDensity] = useState<"LOW" | "MODERATE" | "HIGH">("MODERATE");
  const [reportSuccess, setReportSuccess] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const fetchGhats = async (uLat: number | null, uLng: number | null) => {
    const { data, error } = await supabase.from("ghats").select("*");
    if (!error && data) {
      let loaded = data.map((g: any) => ({
        id: g.id,
        name: g.name,
        crowdLevel: g.crowd_level,
        flagColor: g.flag_color,
        desc: g.desc,
        lat: g.lat,
        lng: g.lng,
        flowSpeed: g.flow_speed,
        lastUpdated: g.last_updated
      }));

      if (uLat && uLng) {
        loaded = loaded.map((g: any) => ({
          ...g,
          distance: getDistance(uLat, uLng, g.lat, g.lng)
        })).sort((a: any, b: any) => (a.distance || 0) - (b.distance || 0));
      }
      setGhats(loaded);
    }
  };

  useEffect(() => {
    const lat = localStorage.getItem("kumbh_user_latitude");
    const lng = localStorage.getItem("kumbh_user_longitude");
    let uLat: number | null = null;
    let uLng: number | null = null;
    if (lat && lng) {
      uLat = parseFloat(lat);
      uLng = parseFloat(lng);
      setUserLocation({ lat: uLat, lng: uLng });
    }

    fetchGhats(uLat, uLng);

    const subscription = supabase
      .channel("ghat-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "ghats" }, () => {
        fetchGhats(uLat, uLng);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  // Map markers translation
  const mapMarkers = ghats.map((g) => ({
    id: g.id,
    title: `${g.name} (${g.crowdLevel} Crowd)`,
    lat: g.lat,
    lng: g.lng,
    status: g.crowdLevel,
    type: "ghat" as const
  }));

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSignedIn) {
      setShowLoginPrompt(true);
      return;
    }

    const targetGhat = ghats.find(g => g.id === reportGhatId);
    if (!targetGhat) return;

    if (!userLocation) {
      setLocationError("We need your location to verify you are at the ghat. Please enable GPS sharing.");
      return;
    }

    const dist = getDistance(userLocation.lat, userLocation.lng, targetGhat.lat, targetGhat.lng);
    if (dist > 2.0) {
      setLocationError(`Verification failed: You are ${dist.toFixed(1)} km away. You must be within 2.0 km of ${targetGhat.name} to submit a report.`);
      return;
    }

    setLocationError(null);
    const flag = reportedDensity === "HIGH" ? "RED" : reportedDensity === "MODERATE" ? "YELLOW" : "GREEN";

    const { error } = await supabase
      .from("ghats")
      .update({
        crowd_level: reportedDensity,
        flag_color: flag,
        last_updated: "Just now"
      })
      .eq("id", reportGhatId);

    if (!error) {
      setReportSuccess(true);
      setTimeout(() => {
        setReportSuccess(false);
      }, 2500);
    } else {
      console.error("Failed to update crowd level:", error);
    }
  };

  return (
    <div className="min-h-screen bg-surface pb-32">
      <Header />

      <main className="max-w-md mx-auto px-margin-mobile pt-6 space-y-6">
        
        {/* Page Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-fixed rounded-xl flex items-center justify-center text-primary border border-primary/10">
            <span className="material-symbols-outlined text-2xl font-bold">
              waves
            </span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-on-surface">Safe Ghats Monitor</h2>
            <p className="text-xs text-on-surface-variant">
              {userLocation ? "Sorted by distance from your location" : "Live crowd indicators and water safety flags"}
            </p>
          </div>
        </div>

        {/* Dynamic map */}
        <div className="w-full h-[320px] rounded-2xl overflow-hidden sacred-shadow border border-outline-variant/20 relative">
          <Map
            center={userLocation ? [userLocation.lat, userLocation.lng] : [20.0092, 73.7915]}
            zoom={userLocation ? 12 : 14}
            markers={mapMarkers}
            onMarkerClick={(marker) => {
              const ghat = ghats.find((g) => g.id === marker.id);
              if (ghat) setSelectedGhat(ghat);
            }}
          />
        </div>

        {/* Ghat List */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-lg">
              visibility
            </span>
            Simhastha Bathing Ghats Status
          </h3>

          <div className="space-y-4">
            {ghats.map((ghat) => {
              // Flag styles
              let flagStyle = "bg-green-500 text-white shadow-[0_0_12px_rgba(34,197,94,0.4)]";
              let textStyle = "text-green-700";
              if (ghat.flagColor === "RED") {
                flagStyle = "bg-red-500 text-white shadow-[0_0_12px_rgba(239,68,68,0.4)]";
                textStyle = "text-red-700";
              } else if (ghat.flagColor === "YELLOW") {
                flagStyle = "bg-amber-500 text-black shadow-[0_0_12px_rgba(245,158,11,0.4)]";
                textStyle = "text-amber-700 font-bold";
              }

              return (
                <div
                  key={ghat.id}
                  onClick={() => setSelectedGhat(ghat)}
                  className={`p-4 rounded-xl border bg-surface-container-lowest transition-all cursor-pointer sacred-shadow flex items-center justify-between ${
                    selectedGhat?.id === ghat.id
                      ? "border-primary ring-2 ring-primary/10 bg-primary-fixed/5 scale-[1.01]"
                      : "border-outline-variant/30 hover:border-primary/45"
                  }`}
                >
                  <div className="flex-1 pr-4">
                    <h4 className="font-bold text-sm text-on-surface">{ghat.name}</h4>
                    <p className="text-[11px] text-on-surface-variant mt-1 line-clamp-1">
                      {ghat.desc}
                    </p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[10px] text-outline font-bold">
                      <span>Water Flow: {ghat.flowSpeed}</span>
                      <span>Updated: {ghat.lastUpdated}</span>
                      {ghat.distance !== undefined && (
                        <span className="text-secondary">{ghat.distance.toFixed(1)} km away</span>
                      )}
                    </div>
                  </div>

                  <div className="text-center flex flex-col items-center gap-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${flagStyle}`}>
                      🏴
                    </div>
                    <span className={`text-[9px] font-extrabold uppercase ${textStyle}`}>
                      {ghat.crowdLevel}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Report Crowd Update Form */}
        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-5 sacred-shadow space-y-4">
          <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
            <ShieldAlert size={16} className="text-primary animate-pulse" />
            Report Crowd Density
          </h3>
          <p className="text-[11px] text-on-surface-variant leading-relaxed">
            Help fellow pilgrims stay safe. If you are currently at a bathing ghat, report the crowd levels to update the live safety dashboard.
          </p>

          {locationError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-error-container/30 border border-error/25 rounded-xl flex gap-2.5 text-left mb-2"
            >
              <ShieldAlert size={18} className="text-error shrink-0 mt-0.5" />
              <p className="text-[11px] text-error font-semibold leading-relaxed">
                {locationError}
              </p>
            </motion.div>
          )}

          {reportSuccess ? (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center py-6 space-y-2 bg-green-50 border border-green-200 rounded-xl"
            >
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 mx-auto">
                <CheckCircle2 size={24} />
              </div>
              <h4 className="text-xs font-bold text-green-700">Crowd Update Logged!</h4>
              <p className="text-[10px] text-on-surface-variant max-w-xs mx-auto px-4">
                Thank you for contributing to crowd safety at KumbhAarambh. The dashboard flags have adjusted.
              </p>
            </motion.div>
          ) : (
            <form onSubmit={handleReportSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wide">Select Ghat Location</label>
                <select
                  value={reportGhatId}
                  onChange={(e) => setReportGhatId(e.target.value)}
                  className="w-full p-2.5 bg-surface-container-low border border-outline-variant/30 rounded-lg text-xs outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                >
                  {ghats.map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wide">Current Observed Crowd</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["LOW", "MODERATE", "HIGH"] as const).map((density) => {
                    let label = "Low (Safe)";
                    let btnColor = "hover:border-green-500 hover:text-green-600";
                    let activeColor = "border-green-500 bg-green-50 text-green-700";

                    if (density === "MODERATE") {
                      label = "Moderate";
                      btnColor = "hover:border-amber-500 hover:text-amber-600";
                      activeColor = "border-amber-500 bg-amber-50 text-amber-700";
                    } else if (density === "HIGH") {
                      label = "High (Heavy)";
                      btnColor = "hover:border-red-500 hover:text-red-600";
                      activeColor = "border-red-500 bg-red-50 text-red-700";
                    }

                    const isSelected = reportedDensity === density;

                    return (
                      <button
                        key={density}
                        type="button"
                        onClick={() => setReportedDensity(density)}
                        className={`p-2 rounded-lg border text-center transition-all text-[11px] font-bold cursor-pointer ${
                          isSelected ? activeColor : `bg-surface-container-low border-outline-variant/20 text-on-surface-variant ${btnColor}`
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-primary text-on-primary font-bold text-xs shadow-md hover:bg-primary-container transition-colors cursor-pointer text-center"
              >
                Submit Crowd Report
              </button>
            </form>
          )}
        </div>

      </main>

      {/* Ghat Details Modal */}
      <AnimatePresence>
        {selectedGhat && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedGhat(null)}
              className="fixed inset-0 bg-black z-[1200]"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm bg-surface rounded-2xl p-6 z-[1300] border border-outline-variant/30 sacred-shadow-lg"
            >
              <div className="flex justify-between items-start mb-4">
                <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded border ${
                  selectedGhat.flagColor === "RED"
                    ? "bg-red-50 border-red-200 text-red-700"
                    : selectedGhat.flagColor === "YELLOW"
                    ? "bg-amber-50 border-amber-200 text-amber-700"
                    : "bg-green-50 border-green-200 text-green-700"
                }`}>
                  Flag: {selectedGhat.flagColor} • Crowd: {selectedGhat.crowdLevel}
                </span>
                <button
                  onClick={() => setSelectedGhat(null)}
                  className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center border border-outline-variant/20 hover:bg-surface-container-highest cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-on-surface">{selectedGhat.name}</h3>
                  <p className="text-xs text-on-surface-variant flex items-center gap-1 mt-1">
                    <MapPin size={14} className="text-secondary" />
                    Nashik Trimbakeshwar Region
                  </p>
                </div>

                <div className="p-4 bg-surface-container-low rounded-xl border border-outline-variant/15 space-y-2 text-left">
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    {selectedGhat.desc}
                  </p>
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-outline-variant/10 text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-outline block">CURRENT WATER FLOW</span>
                      <strong className="text-primary">{selectedGhat.flowSpeed}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-outline block">LAST REPORTED</span>
                      <strong className="text-primary">{selectedGhat.lastUpdated}</strong>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-primary-fixed/20 border border-primary/10 rounded-xl flex gap-3 text-xs text-left">
                  <Info size={18} className="text-primary shrink-0" />
                  <p className="text-on-surface-variant leading-relaxed">
                    Always consult local lifesavers and check safety lines before taking a dip in the River Godavari.
                  </p>
                </div>

                <div className="flex gap-3">
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${selectedGhat.lat},${selectedGhat.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-3 rounded-xl border border-primary text-primary font-bold text-center text-xs hover:bg-primary/5 transition-all flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[16px]">navigation</span>
                    Navigate
                  </a>
                  <button
                    onClick={() => setSelectedGhat(null)}
                    className="flex-1 py-3 rounded-xl bg-primary text-on-primary font-bold shadow-md hover:bg-primary-container transition-colors cursor-pointer text-center text-xs"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <Navbar />

      {/* Login Required Prompt Modal */}
      <AnimatePresence>
        {showLoginPrompt && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLoginPrompt(false)}
              className="fixed inset-0 bg-black z-[1200]"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm bg-surface rounded-2xl p-6 z-[1300] sacred-shadow-lg border border-outline-variant/30 text-center space-y-4"
            >
              <div className="w-14 h-14 bg-primary-fixed rounded-full flex items-center justify-center mx-auto border border-primary/20">
                <LogIn size={24} className="text-primary" />
              </div>
              <h3 className="text-lg font-bold text-on-surface">Login Required</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                To report crowd density, you need to be logged in with a Yatri account. Guest access does not support reporting.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLoginPrompt(false)}
                  className="flex-1 py-2.5 rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface-variant font-bold text-xs cursor-pointer hover:bg-surface-container-highest transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => router.push("/login")}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-on-primary font-bold text-xs shadow-md hover:bg-primary-container cursor-pointer transition-all"
                >
                  Log In Now
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
