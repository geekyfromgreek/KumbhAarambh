"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import LocationPrompt from "@/components/LocationPrompt";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, MapPin, HeartHandshake, CheckCircle2, Plus, X, AlertOctagon, ShieldCheck, Star, Navigation, ExternalLink } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { supabase } from "@/lib/supabaseClient";

interface SosAlert {
  name: string;
  phone: string;
  lat: number;
  lng: number;
  timestamp: string;
}

interface OverchargeReport {
  vehicleNumber: string;
  chargedFare: number;
  officialFare: number;
  route: string;
  vehicle: string;
  timestamp: string;
}

interface BookingNotification {
  id: string;
  stayId: string;
  stayTitle: string;
  guestName: string;
  guestPhone: string;
  checkIn: string;
  timestamp: string;
  read: boolean;
}

export default function NashikkarDashboard() {
  const router = useRouter();
  const { isSignedIn, user, isLoaded } = useUser();
  const [sosAlerts, setSosAlerts] = useState<SosAlert[]>([]);
  const [addStayOpen, setAddStayOpen] = useState(false);
  const [staySuccess, setStaySuccess] = useState(false);
  const [userLocationName, setUserLocationName] = useState<string | null>(null);
  const [showLocPrompt, setShowLocPrompt] = useState(false);
  
  // New Stay Form inputs
  const [stayTitle, setStayTitle] = useState("");
  const [stayPrice, setStayPrice] = useState("");
  const [stayAddr, setStayAddr] = useState("");
  const [stayLat, setStayLat] = useState("20.0092");
  const [stayLng, setStayLng] = useState("73.7915");
  const [stayAmen, setStayAmen] = useState("Drinking Water, Mats");
  const [stayDesc, setStayDesc] = useState("");

  // Overcharge reports from yatris
  const [overchargeReports, setOverchargeReports] = useState<OverchargeReport[]>([]);

  // Booking notifications for host stays
  const [bookingNotifications, setBookingNotifications] = useState<BookingNotification[]>([]);

  // Quick food verification
  const [verifiedFoodCount, setVerifiedFoodCount] = useState(0);
  const [verifiedStayCount, setVerifiedStayCount] = useState(0);

  // Crowd report quick action
  const [crowdGhat, setCrowdGhat] = useState("Ram Kund (Main Ghat)");
  const [crowdLevel, setCrowdLevel] = useState<"LOW" | "MODERATE" | "HIGH">("MODERATE");
  const [crowdReported, setCrowdReported] = useState(false);

  // Fare verification
  const [fareVerifyRoute, setFareVerifyRoute] = useState("");
  const [fareVerifyAmount, setFareVerifyAmount] = useState("");
  const [fareVerifyVehicle, setFareVerifyVehicle] = useState("Auto Rickshaw");
  const [fareVerifyRating, setFareVerifyRating] = useState(5);
  const [fareVerified, setFareVerified] = useState(false);

  const fetchBookings = async () => {
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("acknowledged", false)
      .order("timestamp", { ascending: false });

    if (!error && data) {
      setBookingNotifications(data.map((b: any) => ({
        id: b.id,
        stayId: b.stay_id,
        stayTitle: b.stay_title,
        guestName: b.guest_name,
        guestPhone: b.guest_phone,
        checkIn: b.check_in,
        timestamp: b.timestamp,
        read: false
      })));
    }
  };

  const fetchOverchargeReports = async () => {
    const { data, error } = await supabase
      .from("overcharge_reports")
      .select("*")
      .order("timestamp", { ascending: false });

    if (!error && data) {
      setOverchargeReports(data.map((r: any) => ({
        vehicleNumber: r.vehicle_number,
        chargedFare: r.charged_fare,
        officialFare: r.official_fare,
        route: r.route,
        vehicle: r.vehicle,
        timestamp: r.timestamp
      })));
    }
  };

  useEffect(() => {
    if (!isLoaded) return;

    if (isSignedIn && user) {
      const userRoleId = "kumbh_role_" + user.id;
      const signupRole = localStorage.getItem("selected_signup_role");
      let role = signupRole || localStorage.getItem(userRoleId) || "NASHIKKAR";
      
      localStorage.setItem(userRoleId, role);
      localStorage.setItem("kumbh_role", role);
      localStorage.removeItem("selected_signup_role");

      if (role === "YATRI") {
        router.push("/yatri");
        return;
      }
    } else {
      router.push("/login");
      return;
    }

    // Read SOS alerts triggered in Yatri flow from localStorage
    const stored = localStorage.getItem("kumbh_sos_alerts");
    if (stored) {
      try { setSosAlerts(JSON.parse(stored)); } catch { /* ignore */ }
    }

    fetchBookings();
    fetchOverchargeReports();

    // Count verifications
    const vFood = localStorage.getItem("kumbh_verified_food");
    if (vFood) { try { setVerifiedFoodCount(JSON.parse(vFood).length); } catch { /* ignore */ } }
    const vStay = localStorage.getItem("kumbh_verified_stays_list");
    if (vStay) { try { setVerifiedStayCount(JSON.parse(vStay).length); } catch { /* ignore */ } }

    const updateLocation = async () => {
      let locName = localStorage.getItem("kumbh_user_location_name");
      const lat = localStorage.getItem("kumbh_user_latitude");
      const lng = localStorage.getItem("kumbh_user_longitude");
      
      if (lat && lng) {
        if (!locName || locName === "Current GPS Location" || locName.startsWith("Coordinates:")) {
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
            if (name) {
              locName = name;
              localStorage.setItem("kumbh_user_location_name", name);
            }
          } catch (e) {
            console.error("OSM error:", e);
          }
          
          if (!locName) {
            const hotspots = [
              { name: "Panchavati (Ram Kund)", lat: 20.0092, lng: 73.7915 },
              { name: "Trimbakeshwar Temple", lat: 19.9310, lng: 73.5290 },
              { name: "Nashik Railway Station", lat: 19.9975, lng: 73.7898 },
              { name: "Tapovan (Sita Gufa)", lat: 20.0138, lng: 73.7862 },
              { name: "Gangapur Road", lat: 19.9990, lng: 73.7240 },
              { name: "Someshwar Area", lat: 19.9850, lng: 73.7300 },
              { name: "Muktidham (Nashik Road)", lat: 19.9970, lng: 73.7820 }
            ];
            
            let minDistance = Infinity;
            let nearestName = "Panchavati (Ram Kund)";
            const latitude = parseFloat(lat);
            const longitude = parseFloat(lng);
            
            hotspots.forEach(h => {
              const dLat = (h.lat - latitude) * Math.PI / 180;
              const dLng = (h.lng - longitude) * Math.PI / 180;
              const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                        Math.cos(latitude * Math.PI / 180) * Math.cos(h.lat * Math.PI / 180) *
                        Math.sin(dLng/2) * Math.sin(dLng/2);
              const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
              const d = 6371 * c;
              
              if (d < minDistance) {
                minDistance = d;
                nearestName = h.name;
              }
            });
            locName = nearestName;
            localStorage.setItem("kumbh_user_location_name", nearestName);
          }
        }
      }
      
      if (locName) setUserLocationName(locName);
      else if (lat && lng) {
        setUserLocationName(`Coordinates: ${parseFloat(lat).toFixed(4)}, ${parseFloat(lng).toFixed(4)}`);
      }
    };
    updateLocation();

    const bookingsSubscription = supabase
      .channel("bookings-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, () => {
        fetchBookings();
      })
      .subscribe();

    const overchargeSubscription = supabase
      .channel("overcharge-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "overcharge_reports" }, () => {
        fetchOverchargeReports();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(bookingsSubscription);
      supabase.removeChannel(overchargeSubscription);
    };
  }, [isSignedIn, user, isLoaded, router]);

  const handleResolveSos = (index: number) => {
    const updated = [...sosAlerts];
    updated.splice(index, 1);
    setSosAlerts(updated);
    localStorage.setItem("kumbh_sos_alerts", JSON.stringify(updated));
  };

  const dismissBookingNotif = async (index: number) => {
    const notif = bookingNotifications[index];
    const { error } = await supabase
      .from("bookings")
      .update({ acknowledged: true })
      .eq("id", notif.id);

    if (!error) {
      const updated = [...bookingNotifications];
      updated.splice(index, 1);
      setBookingNotifications(updated);
    }
  };

  const handleAddStaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stayTitle || !stayPrice || !stayAddr) return;

    const priceVal = stayPrice.startsWith("₹") ? stayPrice : `₹${stayPrice} / night`;
    const amenitiesArr = stayAmen ? stayAmen.split(",").map(a => a.trim()).filter(Boolean) : ["Clean Water", "Basic Safety"];
    const descVal = stayDesc || "Registered volunteer accommodation.";

    const { error } = await supabase.from("stays").insert({
      title: stayTitle,
      category: "guesthouse",
      price: priceVal,
      address: stayAddr,
      lat: parseFloat(stayLat) || 20.0092,
      lng: parseFloat(stayLng) || 73.7915,
      rating: 5.0,
      amenities: amenitiesArr,
      desc: descVal,
      verified_count: 1
    });

    if (!error) {
      setStaySuccess(true);
      setTimeout(() => {
        setStaySuccess(false);
        setAddStayOpen(false);
        setStayTitle("");
        setStayPrice("");
        setStayAddr("");
        setStayDesc("");
      }, 2000);
    } else {
      console.error("Failed to insert stay:", error);
    }
  };

  const handleCrowdReport = async () => {
    let ghatId = "ghat-1";
    if (crowdGhat === "Talkuteshwar Ghat") ghatId = "ghat-2";
    else if (crowdGhat === "Laxman Kund") ghatId = "ghat-3";

    const flag = crowdLevel === "HIGH" ? "RED" : crowdLevel === "MODERATE" ? "YELLOW" : "GREEN";

    const { error } = await supabase
      .from("ghats")
      .update({
        crowd_level: crowdLevel,
        flag_color: flag,
        last_updated: "Just now"
      })
      .eq("id", ghatId);

    if (!error) {
      setCrowdReported(true);
      setTimeout(() => setCrowdReported(false), 2500);
    }
  };

  const handleFareVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fareVerifyRoute || !fareVerifyAmount) return;

    const { error } = await supabase.from("fare_ratings").insert({
      route: fareVerifyRoute,
      vehicle: fareVerifyVehicle,
      fare: Number(fareVerifyAmount),
      rating: fareVerifyRating
    });

    if (!error) {
      setFareVerified(true);
      setTimeout(() => {
        setFareVerified(false);
        setFareVerifyRoute("");
        setFareVerifyAmount("");
        setFareVerifyRating(5);
      }, 2500);
    } else {
      console.error("Failed to insert fare rating:", error);
    }
  };

  const dismissOverchargeReport = async (index: number) => {
    const report = overchargeReports[index];
    const { error } = await supabase
      .from("overcharge_reports")
      .delete()
      .eq("vehicle_number", report.vehicleNumber);

    if (!error) {
      const updated = [...overchargeReports];
      updated.splice(index, 1);
      setOverchargeReports(updated);
    }
  };

  // Quick action cards for volunteer tasks
  const quickActions = [
    {
      title: "Verify Food Places",
      hindi: "भोजनालय सत्यापन",
      desc: "Check hygiene and food quality of bhandaras & restaurants",
      icon: "restaurant",
      color: "from-orange-500 to-amber-500",
      count: verifiedFoodCount,
      countLabel: "Verified",
      action: () => router.push("/yatri/food")
    },
    {
      title: "Verify Stays",
      hindi: "निवास सत्यापन",
      desc: "Inspect accommodation hygiene and pricing compliance",
      icon: "home",
      color: "from-blue-500 to-cyan-500",
      count: verifiedStayCount,
      countLabel: "Verified",
      action: () => router.push("/yatri/stays")
    },
    {
      title: "Monitor Ghats",
      hindi: "घाट निगरानी",
      desc: "Report crowd density and water safety at bathing ghats",
      icon: "waves",
      color: "from-teal-500 to-green-500",
      count: null,
      countLabel: "",
      action: () => router.push("/yatri/ghats")
    },
    {
      title: "Fare Board",
      hindi: "किराया बोर्ड",
      desc: "Monitor transit fares and act on overcharging reports",
      icon: "directions_car",
      color: "from-purple-500 to-indigo-500",
      count: overchargeReports.length,
      countLabel: "Reports",
      action: () => router.push("/yatri/fare-board")
    },
    {
      title: "Scam Alerts",
      hindi: "धोखाधड़ी चेतावनी",
      desc: "Post warnings about active scams and fraudulent schemes",
      icon: "gpp_maybe",
      color: "from-red-500 to-rose-500",
      count: null,
      countLabel: "",
      action: () => router.push("/yatri/scams")
    },
    {
      title: "Lost & Found",
      hindi: "खोया और पाया",
      desc: "Report found pilgrim items, view active logs, and verify claims",
      icon: "find_in_page",
      color: "from-purple-600 to-pink-600",
      count: null,
      countLabel: "",
      action: () => router.push("/yatri/lost-found")
    },
    {
      title: "Add Stay Listing",
      hindi: "निवास जोड़ें",
      desc: "Register new pilgrim accommodations for the Stay Finder",
      icon: "add_home",
      color: "from-secondary to-pink-500",
      count: null,
      countLabel: "",
      action: () => setAddStayOpen(true)
    }
  ];

  return (
    <div className="min-h-screen md:h-screen md:overflow-hidden bg-surface pb-16 md:pb-0">
      <Header />

      <main className="max-w-4xl md:max-w-[1400px] mx-auto px-margin-mobile md:px-6 pt-6 md:pt-3 space-y-6 md:space-y-0 md:flex md:flex-col md:h-[calc(100vh-72px)]">
        
        {/* Dashboard Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-secondary-fixed rounded-xl flex items-center justify-center text-secondary border border-secondary/20 shadow-sm">
              <span className="material-symbols-outlined text-2xl font-bold">
                volunteer_activism
              </span>
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-on-surface">Volunteer Control Room</h2>
              <p className="text-xs text-on-surface-variant">Nashikkar hosting portal, safety dispatch, and community verification</p>
            </div>
          </div>
        </div>

        {/* Location Status Widget */}
        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-3 flex items-center justify-between shadow-sm md:shrink-0">
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-secondary" />
            <div>
              <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Current Location (Nashikkar Sector)</p>
              <p className="text-xs font-extrabold text-on-surface">{userLocationName || "Not Set"}</p>
            </div>
          </div>
          <button
            onClick={() => setShowLocPrompt(true)}
            className="text-[10px] font-bold text-secondary hover:bg-secondary-fixed/20 px-3 py-1.5 rounded-lg border border-secondary/20 transition-colors cursor-pointer"
          >
            Change
          </button>
        </div>

        {/* Main Content - 3 columns on desktop */}
        <div className="md:flex md:gap-5 md:flex-1 md:overflow-hidden md:py-2 space-y-6 md:space-y-0">

          {/* LEFT COLUMN: SOS + Booking Notifications + Overcharge Reports */}
          <div className="md:flex-1 space-y-5 md:overflow-y-auto no-scrollbar md:pr-1">
            
            {/* Active Booking Notifications Panel */}
            <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-5 sacred-shadow space-y-4">
              <h3 className="text-sm font-extrabold text-primary flex items-center gap-2 border-b border-outline-variant/10 pb-3">
                <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                  notifications_active
                </span>
                Accommodation Booking Requests ({bookingNotifications.length})
              </h3>

              {bookingNotifications.length === 0 ? (
                <div className="text-center py-8 space-y-2">
                  <div className="w-12 h-12 bg-primary-fixed/20 text-primary rounded-full flex items-center justify-center mx-auto border border-primary/20">
                    <ShieldCheck size={20} />
                  </div>
                  <h4 className="text-xs font-bold text-on-surface">No Pending Bookings</h4>
                  <p className="text-[10px] text-outline max-w-xs mx-auto">
                    Guests have not registered any offline room bookings yet.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {bookingNotifications.map((notif, index) => (
                    <div
                      key={notif.id}
                      className="p-3.5 bg-primary-fixed/5 border border-primary/20 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-3 relative overflow-hidden"
                    >
                      <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-primary" />
                      <div className="space-y-1 pl-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-extrabold text-primary bg-primary-fixed/20 px-2 py-0.5 rounded">
                            {notif.stayTitle}
                          </span>
                          <span className="text-[9px] text-outline">
                            {notif.timestamp}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-on-surface">
                          Guest: {notif.guestName}
                        </p>
                        <p className="text-[10px] text-on-surface-variant">
                          📞 {notif.guestPhone} | 📅 Check-in: <strong>{notif.checkIn}</strong>
                        </p>
                      </div>
                      <button
                        onClick={() => dismissBookingNotif(index)}
                        className="px-4 py-2 bg-primary text-on-primary hover:bg-primary-container rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                      >
                        Acknowledge
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Active SOS Panel */}
            <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-5 sacred-shadow space-y-4">
              <h3 className="text-sm font-extrabold text-error flex items-center gap-2 border-b border-outline-variant/10 pb-3">
                <span className="material-symbols-outlined text-lg animate-pulse" style={{ fontVariationSettings: "'FILL' 1" }}>
                  campaign
                </span>
                Active SOS Distress Logs ({sosAlerts.length})
              </h3>

              {sosAlerts.length === 0 ? (
                <div className="text-center py-8 space-y-2">
                  <div className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto border border-green-200">
                    <CheckCircle2 size={20} />
                  </div>
                  <h4 className="text-xs font-bold text-on-surface">All Sectors Secure</h4>
                  <p className="text-[10px] text-outline max-w-xs mx-auto">
                    No active pilgrim distress signals in Nashik-Trimbakeshwar sectors.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {sosAlerts.map((alert, index) => (
                    <div
                      key={index}
                      className="p-3.5 bg-error-container/10 border border-error/20 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-3 relative overflow-hidden"
                    >
                      <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-error" />
                      <div className="space-y-1 pl-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-on-surface">{alert.name}</span>
                          <span className="text-[9px] font-extrabold bg-error-container text-error px-1.5 py-0.5 rounded">
                            {alert.timestamp}
                          </span>
                        </div>
                        <p className="text-[11px] text-on-surface-variant flex items-center gap-1">
                          <MapPin size={12} className="text-secondary" />
                          Panchavati sector, near Ram Kund
                        </p>
                        <a href={`tel:${alert.phone}`} className="text-xs text-primary font-bold hover:underline inline-block">
                          📞 {alert.phone}
                        </a>
                      </div>
                      <button
                        onClick={() => handleResolveSos(index)}
                        className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                      >
                        Resolve
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Overcharge Reports from Yatris */}
            <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-5 sacred-shadow space-y-4">
              <h3 className="text-sm font-bold text-on-surface flex items-center gap-2 border-b border-outline-variant/10 pb-3">
                <AlertOctagon size={16} className="text-error animate-pulse" />
                Yatri Overcharge Reports ({overchargeReports.length})
              </h3>

              {overchargeReports.length === 0 ? (
                <div className="text-center py-6 space-y-2">
                  <div className="w-10 h-10 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto border border-green-200">
                    <ShieldCheck size={18} />
                  </div>
                  <p className="text-[10px] text-outline">No overcharging complaints filed by pilgrims.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[300px] overflow-y-auto no-scrollbar pr-1">
                  {overchargeReports.slice(0, 10).map((report, index) => {
                    const overchargeAmt = report.chargedFare - report.officialFare;
                    const pct = report.officialFare > 0 ? Math.round((overchargeAmt / report.officialFare) * 100) : 0;
                    return (
                      <div key={index} className="p-3 rounded-xl border border-error/15 bg-error-container/5 relative overflow-hidden">
                        <div className="absolute top-0 left-0 bottom-0 w-1 bg-error" />
                        <div className="pl-2 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-extrabold text-on-surface bg-surface-container-high px-2 py-0.5 rounded">
                              🚗 {report.vehicleNumber}
                            </span>
                            <span className="text-[9px] font-bold text-error bg-error-container/30 px-1.5 py-0.5 rounded">
                              +{pct}% overcharge
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-[10px]">
                            <span className="text-on-surface-variant">Charged: <strong className="text-error">₹{report.chargedFare}</strong></span>
                            <span className="text-on-surface-variant">Official: <strong className="text-green-600">₹{report.officialFare}</strong></span>
                          </div>
                          <p className="text-[10px] text-on-surface-variant flex items-center gap-1">
                            <MapPin size={10} className="text-secondary shrink-0" />
                            {report.route}
                          </p>
                          <div className="flex items-center justify-between pt-1">
                            <span className="text-[9px] text-outline">{report.vehicle} • {report.timestamp}</span>
                            <button
                              onClick={() => dismissOverchargeReport(index)}
                              className="px-3 py-1 bg-green-600 text-white rounded text-[9px] font-bold cursor-pointer hover:bg-green-700 transition-colors"
                            >
                              Acknowledged
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* CENTER COLUMN: Quick Actions Grid */}
          <div className="md:w-[380px] md:shrink-0 space-y-5 md:overflow-y-auto no-scrollbar">
            
            <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                grid_view
              </span>
              Volunteer Actions
            </h3>

            <div className="grid grid-cols-2 gap-3">
              {(() => {
                const iconVariants: Record<string, any> = {
                  restaurant: {
                    hover: {
                      rotate: [0, -20, 20, -10, 10, 0],
                      scale: [1, 1.2, 1],
                      transition: { duration: 0.5, ease: "easeInOut" }
                    }
                  },
                  home: {
                    hover: {
                      scale: [1, 1.25, 0.9, 1.15, 1],
                      y: [0, -7, 2, -3, 0],
                      rotate: [0, -8, 8, -4, 0],
                      transition: { duration: 0.6, ease: "easeInOut" }
                    }
                  },
                  add_home: {
                    hover: {
                      scale: [1, 1.25, 0.9, 1.15, 1],
                      y: [0, -7, 2, -3, 0],
                      rotate: [0, -8, 8, -4, 0],
                      transition: { duration: 0.6, ease: "easeInOut" }
                    }
                  },
                  waves: {
                    hover: {
                      x: [0, -3, 3, -3, 3, 0],
                      y: [0, -2, 2, -2, 2, 0],
                      transition: { repeat: Infinity, duration: 1.2, ease: "linear" }
                    }
                  },
                  directions_car: {
                    hover: {
                      x: [0, 8, -4, 0],
                      rotate: [0, 5, -3, 0],
                      transition: { duration: 0.6, ease: "easeInOut" }
                    }
                  },
                  gpp_maybe: {
                    hover: {
                      rotate: [0, -10, 10, -10, 10, 0],
                      scale: [1, 1.25, 0.9, 1.15, 1],
                      transition: { duration: 0.5, ease: "easeInOut" }
                    }
                  },
                  find_in_page: {
                    hover: {
                      scale: [1, 1.15, 1],
                      y: [0, -4, 0],
                      transition: { duration: 0.4, ease: "easeOut" }
                    }
                  }
                };

                return quickActions.map((action) => (
                  <motion.button
                    key={action.title}
                    whileHover="hover"
                    onClick={action.action}
                    className="group relative text-left bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-4 sacred-shadow hover:shadow-md hover:border-secondary/50 transition-all cursor-pointer overflow-hidden focus:outline-none"
                  >
                    {/* Gradient top bar */}
                    <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${action.color}`} />
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${action.color} flex items-center justify-center text-white shadow-sm`}>
                          <motion.span 
                            variants={iconVariants[action.icon]}
                            className="material-symbols-outlined text-lg" 
                            style={{ fontVariationSettings: "'FILL' 1" }}
                          >
                            {action.icon}
                          </motion.span>
                        </div>
                        {action.count !== null && action.count > 0 && (
                          <span className="text-[9px] font-extrabold bg-surface-container-high text-primary px-2 py-0.5 rounded-full">
                            {action.count} {action.countLabel}
                          </span>
                        )}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-on-surface group-hover:text-secondary transition-colors">{action.title}</h4>
                        <p className="text-[9px] font-bold text-secondary mt-0.5">{action.hindi}</p>
                        <p className="text-[10px] text-on-surface-variant leading-snug mt-1">{action.desc}</p>
                      </div>
                    </div>
                  </motion.button>
                ));
              })()}
            </div>
          </div>

          {/* RIGHT COLUMN: Quick tools + Stats */}
          <div className="md:w-[300px] md:shrink-0 space-y-5 md:overflow-y-auto no-scrollbar">

            {/* Quick Crowd Report */}
            <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-5 sacred-shadow space-y-3">
              <h3 className="text-sm font-bold text-on-surface flex items-center gap-2 border-b border-outline-variant/10 pb-3">
                <span className="material-symbols-outlined text-primary text-lg">waves</span>
                Quick Crowd Report
              </h3>
              
              {crowdReported ? (
                <div className="text-center py-4 space-y-2 bg-green-50 border border-green-200 rounded-xl">
                  <CheckCircle2 size={20} className="text-green-600 mx-auto" />
                  <p className="text-[10px] font-bold text-green-700">Crowd report submitted!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <select
                    value={crowdGhat}
                    onChange={(e) => setCrowdGhat(e.target.value)}
                    className="w-full p-2 bg-surface-container-low border border-outline-variant/20 rounded-lg text-xs outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option>Ram Kund (Main Ghat)</option>
                    <option>Talkuteshwar Ghat</option>
                    <option>Laxman Kund</option>
                  </select>
                  <div className="grid grid-cols-3 gap-2">
                    {(["LOW", "MODERATE", "HIGH"] as const).map((lvl) => (
                      <button
                        key={lvl}
                        onClick={() => setCrowdLevel(lvl)}
                        className={`p-2 rounded-lg border text-center text-[10px] font-bold cursor-pointer transition-all ${
                          crowdLevel === lvl
                            ? lvl === "HIGH" ? "border-red-500 bg-red-50 text-red-700"
                              : lvl === "MODERATE" ? "border-amber-500 bg-amber-50 text-amber-700"
                              : "border-green-500 bg-green-50 text-green-700"
                            : "border-outline-variant/20 bg-surface-container-low text-on-surface-variant"
                        }`}
                      >
                        {lvl === "LOW" ? "Low" : lvl === "MODERATE" ? "Med" : "High"}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={handleCrowdReport}
                    className="w-full py-2.5 rounded-xl bg-primary text-on-primary font-bold text-xs cursor-pointer hover:bg-primary-container transition-all"
                  >
                    Submit Report
                  </button>
                </div>
              )}
            </div>

            {/* Fare Rate & Verify */}
            <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-5 sacred-shadow space-y-3">
              <h3 className="text-sm font-bold text-on-surface flex items-center gap-2 border-b border-outline-variant/10 pb-3">
                <span className="material-symbols-outlined text-primary text-lg">electric_rickshaw</span>
                Rate Transit Fare
              </h3>

              {fareVerified ? (
                <div className="text-center py-4 space-y-2 bg-green-50 border border-green-200 rounded-xl">
                  <CheckCircle2 size={20} className="text-green-600 mx-auto" />
                  <p className="text-[10px] font-bold text-green-700">Fare rating submitted!</p>
                </div>
              ) : (
                <form onSubmit={handleFareVerify} className="space-y-3">
                  <input
                    type="text"
                    required
                    value={fareVerifyRoute}
                    onChange={(e) => setFareVerifyRoute(e.target.value)}
                    placeholder="Route (e.g. Station → Ram Kund)"
                    className="w-full p-2 bg-surface-container-low border border-outline-variant/20 rounded-lg text-xs outline-none focus:ring-1 focus:ring-primary"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={fareVerifyVehicle}
                      onChange={(e) => setFareVerifyVehicle(e.target.value)}
                      className="p-2 bg-surface-container-low border border-outline-variant/20 rounded-lg text-xs outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option>Auto Rickshaw</option>
                      <option>E-Rickshaw</option>
                      <option>Shuttle Bus</option>
                      <option>Prepaid Taxi</option>
                    </select>
                    <input
                      type="number"
                      required
                      value={fareVerifyAmount}
                      onChange={(e) => setFareVerifyAmount(e.target.value)}
                      placeholder="Fare ₹"
                      className="p-2 bg-surface-container-low border border-outline-variant/20 rounded-lg text-xs outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-on-surface-variant uppercase">Driver Rating</label>
                    <div className="flex gap-1">
                      {[1,2,3,4,5].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setFareVerifyRating(s)}
                          className={`text-lg cursor-pointer transition-all ${s <= fareVerifyRating ? "text-amber-500" : "text-outline/30"}`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-secondary text-on-secondary font-bold text-xs cursor-pointer hover:bg-secondary-container transition-all"
                  >
                    Submit Fare Rating
                  </button>
                </form>
              )}
            </div>

            {/* Volunteer Statistics */}
            <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-5 sacred-shadow space-y-3">
              <h3 className="text-sm font-bold text-on-surface flex items-center gap-2 border-b border-outline-variant/10 pb-3">
                <HeartHandshake size={16} className="text-secondary" />
                My Volunteer Stats
              </h3>
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-3 bg-surface-container-low rounded-xl">
                  <span className="text-lg font-extrabold text-primary block">{verifiedFoodCount}</span>
                  <span className="text-[9px] font-bold text-outline uppercase">Food Verified</span>
                </div>
                <div className="p-3 bg-surface-container-low rounded-xl">
                  <span className="text-lg font-extrabold text-secondary block">{verifiedStayCount}</span>
                  <span className="text-[9px] font-bold text-outline uppercase">Stays Verified</span>
                </div>
                <div className="p-3 bg-surface-container-low rounded-xl">
                  <span className="text-lg font-extrabold text-primary block">24</span>
                  <span className="text-[9px] font-bold text-outline uppercase">Active Hosts</span>
                </div>
                <div className="p-3 bg-surface-container-low rounded-xl">
                  <span className="text-lg font-extrabold text-secondary block">1,245</span>
                  <span className="text-[9px] font-bold text-outline uppercase">Prasads Served</span>
                </div>
              </div>
            </div>

            {/* Live RTO Alerts */}
            <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-5 sacred-shadow space-y-3">
              <h3 className="text-sm font-bold text-on-surface flex items-center gap-2 border-b border-outline-variant/10 pb-3">
                <AlertOctagon size={16} className="text-primary animate-pulse" />
                RTO Transit Alerts
              </h3>
              <div className="space-y-2.5 text-[11px] text-on-surface-variant leading-normal">
                <div className="p-2.5 bg-surface-container-low rounded-lg border-l-2 border-primary">
                  <strong>Panchavati Road Block:</strong> Shuttles diverted via Ring Road 2.
                </div>
                <div className="p-2.5 bg-surface-container-low rounded-lg border-l-2 border-secondary">
                  <strong>Bhandara camp:</strong> Seva camp 3 at 80% capacity.
                </div>
                <div className="p-2.5 bg-surface-container-low rounded-lg border-l-2 border-amber-500">
                  <strong>Trimbak Road:</strong> Heavy traffic near Anjaneri turnoff. ~45 min delay.
                </div>
              </div>
            </div>

          </div>

        </div>

      </main>

      {/* Add Stay Drawer Overlay */}
      <AnimatePresence>
        {addStayOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!staySuccess) setAddStayOpen(false);
              }}
              className="fixed inset-0 bg-black z-50"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-surface p-6 z-50 border-l border-outline-variant/30 shadow-2xl overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-extrabold text-secondary flex items-center gap-2">
                  <Plus size={18} /> Register Guest Stay
                </h3>
                <button
                  onClick={() => setAddStayOpen(false)}
                  className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center border border-outline-variant/20 hover:bg-surface-container-highest cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {staySuccess ? (
                <div className="text-center py-12 space-y-3">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600 mx-auto shadow-sm">
                    <CheckCircle2 size={36} />
                  </div>
                  <h4 className="text-base font-bold text-green-700">Stay Registered Successfully!</h4>
                  <p className="text-xs text-on-surface-variant max-w-xs mx-auto leading-relaxed">
                    The accommodation <strong>{stayTitle}</strong> has been cataloged and will appear on pilgrim Stay Finder maps.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleAddStaySubmit} className="space-y-4">
                  <div className="p-3 bg-secondary-fixed/30 border border-secondary/15 rounded-xl text-xs text-on-surface-variant leading-normal">
                    <strong>Nashikkar Host Guidelines:</strong> Make sure stays are hygienic and pricing is subsidized for pilgrims.
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase">Accommodation Title</label>
                    <input type="text" required value={stayTitle} onChange={(e) => setStayTitle(e.target.value)} placeholder="e.g. Shree Ram Bhakta Niwas" className="w-full p-2.5 bg-surface-container-low border border-outline-variant/30 rounded-lg text-xs outline-none focus:ring-1 focus:ring-secondary" />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase">Price Per Night (₹ or Free)</label>
                    <input type="text" required value={stayPrice} onChange={(e) => setStayPrice(e.target.value)} placeholder="e.g. ₹200 / night" className="w-full p-2.5 bg-surface-container-low border border-outline-variant/30 rounded-lg text-xs outline-none focus:ring-1 focus:ring-secondary" />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase">Street Address</label>
                    <input type="text" required value={stayAddr} onChange={(e) => setStayAddr(e.target.value)} placeholder="e.g. Tapovan Camp Road, Nashik" className="w-full p-2.5 bg-surface-container-low border border-outline-variant/30 rounded-lg text-xs outline-none focus:ring-1 focus:ring-secondary" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-on-surface-variant uppercase">Latitude</label>
                      <input type="text" required value={stayLat} onChange={(e) => setStayLat(e.target.value)} className="w-full p-2.5 bg-surface-container-low border border-outline-variant/30 rounded-lg text-xs outline-none focus:ring-1 focus:ring-secondary" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-on-surface-variant uppercase">Longitude</label>
                      <input type="text" required value={stayLng} onChange={(e) => setStayLng(e.target.value)} className="w-full p-2.5 bg-surface-container-low border border-outline-variant/30 rounded-lg text-xs outline-none focus:ring-1 focus:ring-secondary" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase">Amenities (Comma separated)</label>
                    <input type="text" required value={stayAmen} onChange={(e) => setStayAmen(e.target.value)} className="w-full p-2.5 bg-surface-container-low border border-outline-variant/30 rounded-lg text-xs outline-none focus:ring-1 focus:ring-secondary" />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase">Detailed Description</label>
                    <textarea value={stayDesc} onChange={(e) => setStayDesc(e.target.value)} placeholder="Describe room features, capacity, bathroom setups..." rows={3} className="w-full p-2.5 bg-surface-container-low border border-outline-variant/30 rounded-lg text-xs outline-none focus:ring-1 focus:ring-secondary resize-none" />
                  </div>

                  <button type="submit" className="w-full py-3.5 rounded-xl bg-secondary text-on-secondary font-bold text-xs shadow-md hover:bg-secondary-container transition-all cursor-pointer text-center">
                    Submit Stay Listing
                  </button>
                </form>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {showLocPrompt && (
        <LocationPrompt forceOpen={true} onComplete={() => {
          setShowLocPrompt(false);
          const locName = localStorage.getItem("kumbh_user_location_name");
          if (locName) setUserLocationName(locName);
          else {
            const lat = localStorage.getItem("kumbh_user_latitude");
            const lng = localStorage.getItem("kumbh_user_longitude");
            if (lat && lng) setUserLocationName(`Coordinates: ${parseFloat(lat).toFixed(4)}, ${parseFloat(lng).toFixed(4)}`);
          }
        }} />
      )}

    </div>
  );
}
