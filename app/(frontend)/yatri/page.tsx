"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import Header from "@/components/Header";
import Navbar from "@/components/Navbar";
import LocationPrompt from "@/components/LocationPrompt";
import { MapPin } from "lucide-react";
import { motion } from "framer-motion";

export default function YatriHome() {
  const router = useRouter();
  const { isSignedIn, user, isLoaded } = useUser();
  const [isGuest, setIsGuest] = useState(false);
  const [userLocationName, setUserLocationName] = useState<string | null>(null);
  const [showLocPrompt, setShowLocPrompt] = useState(false);
  const [roleChecked, setRoleChecked] = useState(false);

  // Derive username from Clerk user or fallback
  const userName = isSignedIn && user
    ? user.firstName || user.emailAddresses?.[0]?.emailAddress?.split("@")[0] || "Pilgrim"
    : "Pilgrim";

  useEffect(() => {
    if (!isLoaded) return;

    const guest = localStorage.getItem("kumbh_guest_session");
    setIsGuest(guest === "true");

    if (isSignedIn && user) {
      const userRoleId = "kumbh_role_" + user.id;
      const signupRole = localStorage.getItem("selected_signup_role");
      let role = signupRole || localStorage.getItem(userRoleId) || "YATRI";
      
      localStorage.setItem(userRoleId, role);
      localStorage.setItem("kumbh_role", role);
      localStorage.removeItem("selected_signup_role");

      if (role === "NASHIKKAR") {
        router.replace("/nashikkar");
        return;
      }
    } else if (!guest && !isSignedIn) {
      router.replace("/");
      return;
    }
    setRoleChecked(true);
  }, [isSignedIn, user, isLoaded, router]);

  useEffect(() => {
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
  }, []);

  const services = [
    {
      title: "Budget Stays",
      hindi: "सस्ता निवास खोजें",
      desc: "Find verified mathas, ashrams, and guest rooms.",
      icon: "home",
      route: "/yatri/stays",
      color: "border-primary/20 hover:border-primary",
      badge: "Free & Paid"
    },
    {
      title: "Local Food",
      hindi: "भोजन और भंडारा",
      desc: "Locate bhandaras, local snacks, and pure veg dining.",
      icon: "local_dining",
      route: "/yatri/food",
      color: "border-secondary/20 hover:border-secondary",
      badge: "Free Bhandaras"
    },
    {
      title: "Safe Ghats Monitor",
      hindi: "सुरक्षित स्नान घाट",
      desc: "Real-time flag indicator & crowd levels at Ram Kund.",
      icon: "waves",
      route: "/yatri/ghats",
      color: "border-tertiary/20 hover:border-tertiary",
      badge: "Live Status"
    },
    {
      title: "Transit Fares",
      hindi: "वाहन किराया सूची",
      desc: "Official auto/taxi fare calculator. Report overcharging.",
      icon: "directions_car",
      route: "/yatri/fare-board",
      color: "border-orange-500/20 hover:border-orange-500",
      badge: "Fare Calculator"
    },
    {
      title: "Scam Alerts",
      hindi: "धोखाधड़ी चेतावनी",
      desc: "Stay safe from fake sadhus, brokers, and active scams.",
      icon: "gpp_maybe",
      route: "/yatri/scams",
      color: "border-red-500/20 hover:border-red-500",
      badge: "Safety Logs"
    },
    {
      title: "AI Kumbh Guide",
      hindi: "एआई कुंभ मार्गदर्शक",
      desc: "Chat with AI to ask history, paths, and auspicious dates.",
      icon: "smart_toy",
      route: "/yatri/chatbot",
      color: "border-blue-500/20 hover:border-blue-500",
      badge: "24/7 Active"
    },
    {
      title: "Lost & Found",
      hindi: "खोया और पाया",
      desc: "Report lost objects or view found items with GPS mapping.",
      icon: "find_in_page",
      route: "/yatri/lost-found",
      color: "border-purple-500/20 hover:border-purple-500",
      badge: "Real-Time"
    }
  ];

  if (!isLoaded || (isSignedIn && !roleChecked)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface rangoli-bg">
        <div className="text-center space-y-3 z-10">
          <span className="material-symbols-outlined text-4xl text-primary animate-spin">
            progress_activity
          </span>
          <p className="text-xs text-on-surface-variant font-bold">Verifying Sacred Role...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen md:h-screen md:overflow-hidden bg-surface pb-32 md:pb-0">
      <Header />
      
      <main className="max-w-md md:max-w-7xl mx-auto px-margin-mobile md:px-6 pt-6 md:pt-4 space-y-6 md:space-y-0 md:flex md:gap-6 md:h-[calc(100vh-72px)]">
        
        {/* Left Column: Welcome + Alert + Quote */}
        <div className="w-full md:w-[340px] md:shrink-0 space-y-4 md:space-y-4 md:overflow-y-auto md:py-2 no-scrollbar">
          {/* Dynamic Welcome Greeting */}
          <div className="bg-gradient-to-br from-primary-container to-primary rounded-2xl p-5 text-on-primary-container shadow-lg border border-primary/20 relative overflow-hidden">
            <div className="absolute right-[-20px] bottom-[-20px] w-24 h-24 rounded-full bg-white/10 blur-xl pointer-events-none" />
            
            <span className="text-xs uppercase font-extrabold tracking-wider bg-white/20 px-2 py-0.5 rounded-md">
              Har Har Gange • हर हर गंगे
            </span>
            <h2 className="text-2xl font-bold mt-2">
              Namaste, Pilgrim!
            </h2>
            <p className="text-xs mt-1 text-on-primary-container/85 leading-relaxed">
              Welcome to the sacred Nashik-Trimbakeshwar Simhastha Kumbh Mela. Your spiritual journey is protected.
            </p>
          </div>

          {/* Live Safety Warning Marquee */}
          <div className="bg-error-container/20 border border-error/20 p-3.5 rounded-xl flex items-start gap-3">
            <span className="material-symbols-outlined text-error font-bold animate-pulse">
              warning
            </span>
            <div className="text-xs">
              <span className="font-bold text-error uppercase mr-1">Alert:</span>
              <span className="text-on-surface-variant">
                Moderate crowd warnings reported at Ram Kund. Use secondary bathing ghats for a peaceful bath.
              </span>
            </div>
          </div>

          {/* Daily Spiritual Quote Card */}
          <div className="bg-surface-container-low p-4 rounded-xl text-center border border-outline-variant/20 italic">
            <span className="material-symbols-outlined text-tertiary-fixed-dim text-lg mb-1 block" style={{ fontVariationSettings: "'FILL' 1" }}>
              spa
            </span>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              &quot;Faith is not the belief that God will do what you want. It is the belief that God will do what is right.&quot;
            </p>
          </div>
        </div>

        {/* Right Column: Services Grid */}
        <div className="flex-1 md:overflow-y-auto md:py-2 no-scrollbar">
          {/* Location Status Widget */}
          <div className="mb-4 bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-3 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2">
              <MapPin size={16} className="text-primary" />
              <div>
                <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Current Location</p>
                <p className="text-xs font-extrabold text-on-surface">{userLocationName || "Not Set"}</p>
              </div>
            </div>
            <button
              onClick={() => setShowLocPrompt(true)}
              className="text-[10px] font-bold text-primary hover:bg-primary-fixed/20 px-3 py-1.5 rounded-lg border border-primary/20 transition-colors cursor-pointer"
            >
              Change
            </button>
          </div>

          <div className="space-y-3">
            <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                grid_view
              </span>
              Kumbh Mela Services
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {(() => {
                const iconVariants: Record<string, any> = {
                  home: {
                    hover: {
                      scale: [1, 1.25, 0.9, 1.15, 1],
                      y: [0, -7, 2, -3, 0],
                      rotate: [0, -8, 8, -4, 0],
                      transition: { duration: 0.6, ease: "easeInOut" }
                    }
                  },
                  local_dining: {
                    hover: {
                      rotate: [0, -20, 20, -10, 10, 0],
                      scale: [1, 1.2, 1],
                      transition: { duration: 0.5, ease: "easeInOut" }
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
                  smart_toy: {
                    hover: {
                      y: [0, -5, 0, -2, 0],
                      scale: [1, 1.2, 1],
                      transition: { duration: 0.6, ease: "easeInOut" }
                    }
                  },
                  find_in_page: {
                    hover: {
                      scale: [1, 1.2, 0.95, 1.1, 1],
                      rotate: [0, 10, -10, 5, 0],
                      transition: { duration: 0.5 }
                    }
                  }
                };

                return services.map((service) => (
                  <motion.button
                    key={service.title}
                    whileHover="hover"
                    onClick={() => router.push(service.route)}
                    className={`group w-full text-left bg-surface-container-lowest border rounded-xl p-4 flex items-center justify-between transition-all duration-300 sacred-shadow hover:shadow-md focus:outline-none cursor-pointer ${service.color}`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 bg-surface-container-high group-hover:bg-primary-fixed/30 rounded-xl flex items-center justify-center text-primary transition-colors border border-outline-variant/10">
                          <motion.span 
                            variants={iconVariants[service.icon]}
                            className="material-symbols-outlined text-2xl"
                          >
                            {service.icon}
                          </motion.span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors">
                              {service.title}
                            </h4>
                            {service.badge && (
                              <span className="text-[9px] font-extrabold bg-surface-container-high text-primary px-1.5 py-0.5 rounded">
                                {service.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-secondary font-bold mb-0.5">
                            {service.hindi}
                          </p>
                          <p className="text-xs text-on-surface-variant leading-normal pr-4">
                            {service.desc}
                          </p>
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-outline group-hover:text-primary group-hover:translate-x-1 transition-all">
                        chevron_right
                      </span>
                    </div>
                  </motion.button>
                ));
              })()}
            </div>
          </div>
        </div>
      </main>

      {showLocPrompt && (
        <LocationPrompt forceOpen={true} onComplete={() => {
          setShowLocPrompt(false);
          // Manually trigger location update reading from localstorage
          const locName = localStorage.getItem("kumbh_user_location_name");
          if (locName) setUserLocationName(locName);
          else {
            const lat = localStorage.getItem("kumbh_user_latitude");
            const lng = localStorage.getItem("kumbh_user_longitude");
            if (lat && lng) setUserLocationName(`Coordinates: ${parseFloat(lat).toFixed(4)}, ${parseFloat(lng).toFixed(4)}`);
          }
        }} />
      )}

      <Navbar />
    </div>
  );
}
