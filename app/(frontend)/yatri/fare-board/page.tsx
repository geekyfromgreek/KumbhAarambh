"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Navbar from "@/components/Navbar";
import { motion, AnimatePresence } from "framer-motion";
import { Calculator, AlertTriangle, CheckCircle2, Navigation, MapPin, ExternalLink, LogIn } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { supabase } from "@/lib/supabaseClient";

interface FareRule {
  vehicle: string;
  baseFare: number;
  baseDistance: number; // km
  extraPerKm: number;
  icon: string;
}

interface OverchargeReport {
  vehicleNumber: string;
  chargedFare: number;
  officialFare: number;
  route: string;
  vehicle: string;
  timestamp: string;
}

const officialFares: FareRule[] = [
  { vehicle: "E-Rickshaw (Shared)", baseFare: 10, baseDistance: 2, extraPerKm: 5, icon: "electric_rickshaw" },
  { vehicle: "Auto Rickshaw (Private)", baseFare: 30, baseDistance: 1.5, extraPerKm: 15, icon: "hail" },
  { vehicle: "Simhastha Shuttle Bus", baseFare: 15, baseDistance: 5, extraPerKm: 2.5, icon: "directions_bus" },
  { vehicle: "Prepaid Taxi", baseFare: 100, baseDistance: 4, extraPerKm: 22, icon: "local_taxi" }
];

const locations = [
  "Nashik Railway Station",
  "Ram Kund (Panchavati)",
  "Trimbakeshwar Shiva Temple",
  "Tapovan (Sita Gufa)",
  "Someshwar Temple",
  "Muktidham Temple",
  "Other (Custom Distance)"
];

// Lat/Lng for Google Maps navigation
const locationCoords: Record<string, { lat: number; lng: number }> = {
  "Nashik Railway Station": { lat: 19.9975, lng: 73.7898 },
  "Ram Kund (Panchavati)": { lat: 20.0092, lng: 73.7915 },
  "Trimbakeshwar Shiva Temple": { lat: 19.9322, lng: 73.5310 },
  "Tapovan (Sita Gufa)": { lat: 20.0138, lng: 73.7862 },
  "Someshwar Temple": { lat: 19.9850, lng: 73.7300 },
  "Muktidham Temple": { lat: 19.9970, lng: 73.7820 },
};

// Distance matrix in KM
const distanceMatrix: Record<string, Record<string, number>> = {
  "Nashik Railway Station": {
    "Ram Kund (Panchavati)": 9.5,
    "Trimbakeshwar Shiva Temple": 37.0,
    "Tapovan (Sita Gufa)": 9.0,
    "Someshwar Temple": 13.0,
    "Muktidham Temple": 1.0,
  },
  "Ram Kund (Panchavati)": {
    "Nashik Railway Station": 9.5,
    "Trimbakeshwar Shiva Temple": 28.0,
    "Tapovan (Sita Gufa)": 2.0,
    "Someshwar Temple": 9.0,
    "Muktidham Temple": 9.5,
  },
  "Trimbakeshwar Shiva Temple": {
    "Nashik Railway Station": 37.0,
    "Ram Kund (Panchavati)": 28.0,
    "Tapovan (Sita Gufa)": 30.0,
    "Someshwar Temple": 25.0,
    "Muktidham Temple": 36.5,
  },
  "Tapovan (Sita Gufa)": {
    "Nashik Railway Station": 9.0,
    "Ram Kund (Panchavati)": 2.0,
    "Trimbakeshwar Shiva Temple": 30.0,
    "Someshwar Temple": 11.0,
    "Muktidham Temple": 9.0,
  },
  "Someshwar Temple": {
    "Nashik Railway Station": 13.0,
    "Ram Kund (Panchavati)": 9.0,
    "Trimbakeshwar Shiva Temple": 25.0,
    "Tapovan (Sita Gufa)": 11.0,
    "Muktidham Temple": 13.5,
  },
  "Muktidham Temple": {
    "Nashik Railway Station": 1.0,
    "Ram Kund (Panchavati)": 9.5,
    "Trimbakeshwar Shiva Temple": 36.5,
    "Tapovan (Sita Gufa)": 9.0,
    "Someshwar Temple": 13.5,
  }
};

export default function FareBoard() {
  const router = useRouter();
  const { isSignedIn } = useUser();
  const [selectedVehicle, setSelectedVehicle] = useState<FareRule>(officialFares[0]);
  
  // Route selection states
  const [startLoc, setStartLoc] = useState(locations[0]);
  const [destLoc, setDestLoc] = useState(locations[1]);
  
  // Custom distance slider state (active when "Other" is chosen)
  const [customDistance, setCustomDistance] = useState<number>(5);
  const [activeDistance, setActiveDistance] = useState<number>(9.5);
  const [calculatedFare, setCalculatedFare] = useState<number>(10);

  // Overcharging Report state
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [chargedFare, setChargedFare] = useState("");
  const [reportSuccess, setReportSuccess] = useState(false);

  // Saved overcharge reports
  const [reports, setReports] = useState<OverchargeReport[]>([]);

  // Community verified fare ratings
  const [fareRatings, setFareRatings] = useState<any[]>([]);

  // Login prompt visibility
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const fetchReports = async () => {
    const { data, error } = await supabase
      .from("overcharge_reports")
      .select("*")
      .order("timestamp", { ascending: false })
      .limit(20);

    if (!error && data) {
      setReports(data.map((r: any) => ({
        vehicleNumber: r.vehicle_number,
        chargedFare: r.charged_fare,
        officialFare: r.official_fare,
        route: r.route,
        vehicle: r.vehicle,
        timestamp: r.timestamp
      })));
    }
  };

  const fetchFareRatings = async () => {
    const { data, error } = await supabase
      .from("fare_ratings")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);

    if (!error && data) {
      setFareRatings(data);
    }
  };

  // Load reports and ratings from Supabase and set closest startLoc on mount
  useEffect(() => {
    fetchReports();
    fetchFareRatings();

    const lat = localStorage.getItem("kumbh_user_latitude");
    const lng = localStorage.getItem("kumbh_user_longitude");
    if (lat && lng) {
      const uLat = parseFloat(lat);
      const uLng = parseFloat(lng);
      
      const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
          Math.sin(dLon/2) * Math.sin(dLon/2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      };

      let closestName = locations[0];
      let minDistance = Infinity;
      Object.entries(locationCoords).forEach(([name, coords]) => {
        const d = getDistance(uLat, uLng, coords.lat, coords.lng);
        if (d < minDistance) {
          minDistance = d;
          closestName = name;
        }
      });
      setStartLoc(closestName);
    }

    const reportSubscription = supabase
      .channel("fare-reports")
      .on("postgres_changes", { event: "*", schema: "public", table: "overcharge_reports" }, () => {
        fetchReports();
      })
      .subscribe();

    const ratingsSubscription = supabase
      .channel("fare-ratings-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "fare_ratings" }, () => {
        fetchFareRatings();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(reportSubscription);
      supabase.removeChannel(ratingsSubscription);
    };
  }, []);

  const calculateFare = (dist: number, rule: FareRule) => {
    if (dist <= rule.baseDistance) {
      return rule.baseFare;
    }
    const extraDist = dist - rule.baseDistance;
    return rule.baseFare + Math.ceil(extraDist * rule.extraPerKm);
  };

  // Recalculate distance and fare when selections change
  useEffect(() => {
    let dist = 0;
    
    if (startLoc === "Other (Custom Distance)" || destLoc === "Other (Custom Distance)") {
      dist = customDistance;
    } else if (startLoc === destLoc) {
      dist = 0; // Same location
    } else {
      // Lookup in matrix
      dist = distanceMatrix[startLoc]?.[destLoc] || 5;
    }
    
    setActiveDistance(dist);
    setCalculatedFare(calculateFare(dist, selectedVehicle));
  }, [startLoc, destLoc, customDistance, selectedVehicle]);

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSignedIn) {
      setShowLoginPrompt(true);
      return;
    }
    if (!vehicleNumber || !chargedFare) return;

    const timestampVal = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ", " + new Date().toLocaleDateString();

    const { error } = await supabase.from("overcharge_reports").insert({
      vehicle_number: vehicleNumber,
      charged_fare: Number(chargedFare),
      official_fare: calculatedFare,
      route: `${startLoc} ➜ ${destLoc}`,
      vehicle: selectedVehicle.vehicle,
      timestamp: timestampVal
    });

    if (!error) {
      setReportSuccess(true);
      setTimeout(() => {
        setReportSuccess(false);
        setVehicleNumber("");
        setChargedFare("");
      }, 2500);
    } else {
      console.error("Failed to insert report:", error);
    }
  };

  // Open Google Maps directions
  const openGoogleMaps = () => {
    const startCoords = locationCoords[startLoc];
    const destCoords = locationCoords[destLoc];
    
    if (startCoords && destCoords) {
      const url = `https://www.google.com/maps/dir/${startCoords.lat},${startCoords.lng}/${destCoords.lat},${destCoords.lng}`;
      window.open(url, "_blank");
    } else if (destCoords) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${destCoords.lat},${destCoords.lng}`;
      window.open(url, "_blank");
    } else {
      // Fallback: search by name
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destLoc + ", Nashik")}`;
      window.open(url, "_blank");
    }
  };

  return (
    <div className="min-h-screen md:h-screen md:overflow-hidden bg-surface pb-32 md:pb-0">
      <Header />

      <main className="max-w-md md:max-w-7xl mx-auto px-margin-mobile md:px-6 pt-6 md:pt-4 space-y-6 md:space-y-0 md:h-[calc(100vh-72px)] md:flex md:flex-col">
        
        {/* Page Header */}
        <div className="flex items-center gap-3 md:shrink-0">
          <div className="w-10 h-10 bg-primary-fixed rounded-xl flex items-center justify-center text-primary border border-primary/10">
            <span className="material-symbols-outlined text-2xl font-bold">
              directions_car
            </span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-on-surface">Transit Fare Board</h2>
            <p className="text-xs text-on-surface-variant">Check official rates, navigate, and report overcharging</p>
          </div>
        </div>

        {/* Three-column layout on desktop */}
        <div className="md:flex md:gap-5 md:flex-1 md:overflow-hidden md:py-2 space-y-6 md:space-y-0">

        {/* LEFT: Fare Calculator Card */}
        <div className="md:flex-1 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-5 sacred-shadow space-y-4 md:self-start md:overflow-y-auto md:max-h-full no-scrollbar">
          <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
            <Calculator size={16} className="text-primary" />
            Official Route Fare Estimator
          </h3>

          {/* Vehicle type selector */}
          <div className="grid grid-cols-2 gap-2">
            {officialFares.map((rule) => (
              <button
                key={rule.vehicle}
                onClick={() => setSelectedVehicle(rule)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                  selectedVehicle.vehicle === rule.vehicle
                    ? "border-primary bg-primary-fixed/20 text-primary scale-[1.02]"
                    : "border-outline-variant/20 bg-surface-container-low text-on-surface-variant hover:border-primary/40"
                }`}
              >
                <span className="material-symbols-outlined text-xl">
                  {rule.icon}
                </span>
                <div className="text-[10px] font-extrabold leading-none">{rule.vehicle}</div>
              </button>
            ))}
          </div>

          {/* Route selectors */}
          <div className="grid grid-cols-1 gap-3 pt-2">
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider">Start Location</label>
              <select
                value={startLoc}
                onChange={(e) => setStartLoc(e.target.value)}
                className="w-full p-2.5 bg-surface-container-low border border-outline-variant/30 rounded-lg text-xs outline-none focus:ring-1 focus:ring-primary"
              >
                {locations.map((loc) => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider">Destination</label>
              <select
                value={destLoc}
                onChange={(e) => setDestLoc(e.target.value)}
                className="w-full p-2.5 bg-surface-container-low border border-outline-variant/30 rounded-lg text-xs outline-none focus:ring-1 focus:ring-primary"
              >
                {locations.map((loc) => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Custom Distance Slider (Shown only when Custom is chosen) */}
          {(startLoc === "Other (Custom Distance)" || destLoc === "Other (Custom Distance)") && (
            <div className="space-y-2 pt-2 border-t border-outline-variant/10">
              <div className="flex justify-between items-center text-xs">
                <span className="text-on-surface-variant font-bold">Input Estimated Distance</span>
                <span className="text-primary font-extrabold">{customDistance} KM</span>
              </div>
              <input
                type="range"
                min="1"
                max="50"
                step="0.5"
                value={customDistance}
                onChange={(e) => setCustomDistance(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-surface-container-high rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-[9px] text-outline">
                <span>1 KM</span>
                <span>50 KM</span>
              </div>
            </div>
          )}

          {/* Calculated Output */}
          <div className="bg-surface-container-high/60 p-4 rounded-xl text-center border border-outline-variant/10">
            <div className="flex justify-between items-center px-4 mb-1">
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Calculated Distance:</span>
              <strong className="text-xs text-primary">{activeDistance} KM</strong>
            </div>
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">
              Estimated Official Fare
            </span>
            <span className="text-3xl font-extrabold text-primary block mt-1">
              ₹{calculatedFare}
            </span>
            <span className="text-[9px] text-outline mt-1 block">
              *Base: ₹{selectedVehicle.baseFare} for {selectedVehicle.baseDistance}km, then ₹{selectedVehicle.extraPerKm}/km.
            </span>
          </div>

          {/* Navigate with Google Maps Button */}
          {startLoc !== "Other (Custom Distance)" && destLoc !== "Other (Custom Distance)" && startLoc !== destLoc && (
            <button
              onClick={openGoogleMaps}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold text-xs shadow-md hover:from-blue-700 hover:to-blue-600 transition-all cursor-pointer text-center flex items-center justify-center gap-2"
            >
              <Navigation size={14} />
              Open in Google Maps
              <ExternalLink size={12} className="opacity-60" />
            </button>
          )}
        </div>

        {/* CENTER: Report Overcharging Form & Community Ratings */}
        <div className="md:w-[340px] md:shrink-0 md:flex md:flex-col md:gap-5 md:overflow-y-auto md:max-h-full no-scrollbar space-y-6 md:space-y-0">
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-5 sacred-shadow space-y-4">
            <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
              <AlertTriangle size={16} className="text-secondary animate-pulse" />
              Report Fare Overcharging
            </h3>
            <p className="text-[11px] text-on-surface-variant leading-relaxed">
              Did a driver charge you more than the official rate? Lodge a quick anonymous complaint. Local police and RTO desks monitor these hotspots.
            </p>

            {reportSuccess ? (
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center py-6 space-y-2 bg-green-50 border border-green-200 rounded-xl"
              >
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 mx-auto">
                  <CheckCircle2 size={24} />
                </div>
                <h4 className="text-xs font-bold text-green-700">Complaint Registered!</h4>
                <p className="text-[10px] text-on-surface-variant max-w-xs mx-auto px-4">
                  Thank you. Your report from <strong>{startLoc}</strong> to <strong>{destLoc}</strong> has been logged and is now visible below.
                </p>
              </motion.div>
            ) : (
              <form onSubmit={handleReportSubmit} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wide">Vehicle No.</label>
                    <input
                      type="text"
                      required
                      value={vehicleNumber}
                      onChange={(e) => setVehicleNumber(e.target.value)}
                      placeholder="e.g. MH-15-X-1234"
                      className="w-full p-2.5 bg-surface-container-low border border-outline-variant/30 rounded-lg text-xs outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wide">Charged Fare (₹)</label>
                    <input
                      type="number"
                      required
                      value={chargedFare}
                      onChange={(e) => setChargedFare(e.target.value)}
                      placeholder="e.g. 150"
                      className="w-full p-2.5 bg-surface-container-low border border-outline-variant/30 rounded-lg text-xs outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                    />
                  </div>
                </div>

                <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/10 text-xs text-on-surface-variant">
                  <strong>Complaint Route:</strong> {startLoc} ➜ {destLoc}
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-secondary text-on-secondary font-bold text-xs shadow-md hover:bg-secondary-container transition-colors cursor-pointer text-center"
                >
                  File Overcharge Report
                </button>
              </form>
            )}
          </div>

          {/* Community Verified Fare Ratings (by Nashikkars) */}
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-5 sacred-shadow space-y-4">
            <h3 className="text-sm font-bold text-on-surface flex items-center gap-2 border-b border-outline-variant/10 pb-2">
              <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                stars
              </span>
              Nashikkar Community Verified Fares
            </h3>
            
            {fareRatings.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-[10px] text-outline">No community verified fares logged yet.</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[250px] overflow-y-auto no-scrollbar">
                {fareRatings.map((item) => (
                  <div key={item.id} className="p-3 bg-surface-container-low border border-outline-variant/15 rounded-xl text-[11px] space-y-1">
                    <div className="flex justify-between items-start gap-2">
                      <span className="font-extrabold text-on-surface leading-tight">{item.route}</span>
                      <span className="text-[10px] text-amber-500 font-extrabold flex items-center gap-0.5 shrink-0">
                        ★ {item.rating}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-on-surface-variant">{item.vehicle}</span>
                      <span className="font-black text-primary text-xs">₹{item.fare}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Recent Overcharge Reports Log */}
        <div className="md:w-[320px] md:shrink-0 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-5 sacred-shadow space-y-4 md:self-start md:overflow-y-auto md:max-h-full no-scrollbar">
          <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-error text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
              report
            </span>
            Recent Overcharge Reports ({reports.length})
          </h3>

          {reports.length === 0 ? (
            <div className="text-center py-8 space-y-2">
              <div className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto border border-green-200">
                <CheckCircle2 size={20} />
              </div>
              <h4 className="text-xs font-bold text-on-surface">No Reports Filed Yet</h4>
              <p className="text-[10px] text-outline max-w-xs mx-auto">
                No overcharging incidents reported. Use the form on the left to report any fare violations.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map((report, index) => {
                const overchargeAmount = report.chargedFare - report.officialFare;
                const overchargePercent = report.officialFare > 0 
                  ? Math.round((overchargeAmount / report.officialFare) * 100) 
                  : 0;

                return (
                  <div
                    key={index}
                    className="p-3 rounded-xl border border-error/15 bg-error-container/5 relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 bottom-0 w-1 bg-error" />
                    
                    <div className="pl-2 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold text-on-surface bg-surface-container-high px-2 py-0.5 rounded">
                          🚗 {report.vehicleNumber}
                        </span>
                        <span className="text-[9px] font-bold text-error bg-error-container/30 px-1.5 py-0.5 rounded">
                          +{overchargePercent}% overcharge
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-3 text-[10px]">
                        <span className="text-on-surface-variant">
                          Charged: <strong className="text-error">₹{report.chargedFare}</strong>
                        </span>
                        <span className="text-on-surface-variant">
                          Official: <strong className="text-green-600">₹{report.officialFare}</strong>
                        </span>
                      </div>

                      <p className="text-[10px] text-on-surface-variant flex items-center gap-1">
                        <MapPin size={10} className="text-secondary shrink-0" />
                        {report.route}
                      </p>

                      <div className="flex items-center justify-between">
                        <span className="text-[9px] text-outline">{report.vehicle} • {report.timestamp}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        </div> {/* End three-column wrapper */}

      </main>

      <Navbar />

      {/* Login Required Prompt Modal */}
      <AnimatePresence>
        {showLoginPrompt && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLoginPrompt(false)}
              className="fixed inset-0 bg-black z-[80]"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm bg-surface rounded-2xl p-6 z-[80] sacred-shadow-lg border border-outline-variant/30 text-center space-y-4"
            >
              <div className="w-14 h-14 bg-primary-fixed rounded-full flex items-center justify-center mx-auto border border-primary/20">
                <LogIn size={24} className="text-primary" />
              </div>
              <h3 className="text-lg font-bold text-on-surface">Login Required</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                To file an overcharge report, you need to be logged in with a Yatri account. Guest access does not support reporting.
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
