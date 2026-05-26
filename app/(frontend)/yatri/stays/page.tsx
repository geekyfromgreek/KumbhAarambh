"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Header from "@/components/Header";
import Navbar from "@/components/Navbar";
import { motion, AnimatePresence } from "framer-motion";
import { Hotel, MapPin, Filter, X, Award, CheckCircle2, ShieldCheck, ExternalLink, LogIn } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { supabase } from "@/lib/supabaseClient";

// Dynamically import Map to bypass SSR Node build error
const Map = dynamic(() => import("@/components/Map"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[350px] bg-surface-container-high rounded-2xl flex items-center justify-center animate-pulse border border-outline-variant/20">
      <div className="text-center space-y-2">
        <span className="material-symbols-outlined text-4xl text-primary animate-spin">
          progress_activity
        </span>
        <p className="text-xs text-on-surface-variant font-bold">Loading Sacred Map...</p>
      </div>
    </div>
  )
});

interface Stay {
  id: string;
  title: string;
  category: "matha" | "homestay" | "guesthouse";
  price: string;
  address: string;
  lat: number;
  lng: number;
  rating: number;
  amenities: string[];
  desc: string;
  verifiedCount: number;
  distance?: number;
}

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

const mockStays: Stay[] = [
  {
    id: "stay-1",
    title: "Kailas Math Ashram",
    category: "matha",
    price: "₹100 / night (Donation)",
    address: "Panchavati River Road, Ramghat, Nashik",
    lat: 20.0080,
    lng: 73.7890,
    rating: 4.8,
    amenities: ["Drinking Water", "Meditation Mats", "Community Kitchen", "Satsang Hall"],
    desc: "A revered ashram offering simple dorm accommodations and pure meals. Situated near Kalaram temple and Ramkund on the Godavari banks.",
    verifiedCount: 24
  },
  {
    id: "stay-2",
    title: "Hotel Panchavati Yatri",
    category: "guesthouse",
    price: "₹650 / night",
    address: "Panchavati Karanja, Main Road, Nashik",
    lat: 19.9982,
    lng: 73.7845,
    rating: 4.5,
    amenities: ["Clean Bathrooms", "CCTV Security", "24hr Help Desk", "Filtered Water"],
    desc: "Subsidy-registered rooms for pilgrims. Very close to key transport terminals and the main bathing ghats.",
    verifiedCount: 15
  },
  {
    id: "stay-3",
    title: "Shri Trimbakeshwar Devsthan Yatrik Niwas",
    category: "matha",
    price: "Free / Donation-based",
    address: "Trimbakeshwar Shiva Jyotirlinga Campus, Nashik",
    lat: 19.9310,
    lng: 73.5290,
    rating: 4.9,
    amenities: ["Hot Water", "Blankets", "Medical Desk", "Safe Locker"],
    desc: "Devotee guest rooms managed directly by the Trimbakeshwar Temple Trust. Features strict veg kitchen guidelines.",
    verifiedCount: 42
  },
  {
    id: "stay-4",
    title: "Ginger Nashik",
    category: "guesthouse",
    price: "₹1,200 / night",
    address: "Trimbak Road, Near ITI Phata, Nashik",
    lat: 20.0195,
    lng: 73.7655,
    rating: 4.4,
    amenities: ["Air Conditioning", "WiFi", "Attached Bath", "Card Payment"],
    desc: "Subsidized standard hotel rooms in central Nashik, offering corporate volunteer hubs and verified security setups.",
    verifiedCount: 8
  },
  {
    id: "stay-5",
    title: "Grape Park Resort MTDC",
    category: "guesthouse",
    price: "₹1,800 / night",
    address: "Near Gangapur Dam, Nashik",
    lat: 19.9950,
    lng: 73.7050,
    rating: 4.6,
    amenities: ["Parking", "Restaurant", "Scenic View", "AC"],
    desc: "A beautiful government-run resort perfect for families looking to stay away from the intense city crowds but near the holy sites.",
    verifiedCount: 12
  },
  {
    id: "stay-6",
    title: "Shree Gajanan Maharaj Mandir Sansthan Dharamshala",
    category: "matha",
    price: "Free / Donation",
    address: "Trimbakeshwar Road, Trimbak",
    lat: 19.9350,
    lng: 73.5350,
    rating: 4.9,
    amenities: ["Prasad", "Locker Room", "Clean Drinking Water", "Satsang"],
    desc: "Massive charitable complex near Trimbakeshwar offering huge dormitories for pilgrims at subsidized/free costs with pure veg meals.",
    verifiedCount: 89
  },
  {
    id: "stay-7",
    title: "Shree Swami Samarth Gurupeeth (Kendra)",
    category: "matha",
    price: "₹200 / night",
    address: "Dindori Road, Near RTO, Nashik",
    lat: 20.0500,
    lng: 73.8000,
    rating: 4.8,
    amenities: ["Meditation Hall", "Hot Water", "Canteen", "Library"],
    desc: "A highly disciplined spiritual center offering clean and peaceful rooms for pilgrims prioritizing meditation and safety.",
    verifiedCount: 35
  },
  {
    id: "stay-8",
    title: "Hotel ibis Nashik",
    category: "homestay",
    price: "₹2,500 / night",
    address: "Trimbakeshwar Road, MIDC, Nashik",
    lat: 19.9800,
    lng: 73.7650,
    rating: 4.5,
    amenities: ["Free WiFi", "Breakfast", "Secure Entry", "AC"],
    desc: "Modern corporate hotel offering special packages during Kumbh for pilgrims seeking premium comfort.",
    verifiedCount: 6
  }
];

export default function StayFinder() {
  const router = useRouter();
  const { isSignedIn, user } = useUser();
  const [stays, setStays] = useState<Stay[]>([]);
  const [filter, setFilter] = useState<"all" | "matha" | "homestay" | "guesthouse">("all");
  const [selectedStay, setSelectedStay] = useState<Stay | null>(null);
  const [bookingForm, setBookingForm] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userVerifiedStays, setUserVerifiedStays] = useState<string[]>([]);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Nashikkar verifiers lists mapped by stayId
  const [nashikkarVerifications, setNashikkarVerifications] = useState<{ [stayId: string]: string[] }>({
    "stay-1": ["Nakul", "Sachin"],
    "stay-2": ["Amit"],
    "stay-3": ["Pooja", "Rahul"],
    "stay-4": ["Vikram"],
    "stay-5": ["Aniket"],
    "stay-6": ["Nakul", "Saurabh"],
    "stay-7": ["Pranit"],
    "stay-8": ["Kunal"]
  });

  // Form Fields for booking
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [checkIn, setCheckIn] = useState("");

  // Host listing form states
  const [hostForm, setHostForm] = useState(false);
  const [hostTitle, setHostTitle] = useState("");
  const [hostCategory, setHostCategory] = useState<"matha" | "homestay" | "guesthouse">("guesthouse");
  const [hostPrice, setHostPrice] = useState("");
  const [hostAddress, setHostAddress] = useState("");
  const [hostDesc, setHostDesc] = useState("");
  const [hostAmenities, setHostAmenities] = useState("");

  const fetchStays = async (uLat: number | null, uLng: number | null) => {
    const { data, error } = await supabase.from("stays").select("*");
    if (!error && data) {
      let loadedStays = data.map((s: any) => ({
        id: s.id,
        title: s.title,
        category: s.category,
        price: s.price,
        address: s.address,
        lat: s.lat,
        lng: s.lng,
        rating: s.rating,
        amenities: s.amenities || [],
        desc: s.desc,
        verifiedCount: s.verified_count
      }));

      if (uLat && uLng) {
        loadedStays = loadedStays.map((s: any) => ({
          ...s,
          distance: getDistance(uLat, uLng, s.lat, s.lng)
        })).sort((a: any, b: any) => (a.distance || 0) - (b.distance || 0));
      }
      setStays(loadedStays);
    }
  };

  useEffect(() => {
    const role = localStorage.getItem("kumbh_role");
    setUserRole(role);
    const stored = localStorage.getItem("kumbh_verified_stays_list");
    if (stored) { try { setUserVerifiedStays(JSON.parse(stored)); } catch { /* ignore */ } }

    const storedNashikkar = localStorage.getItem("kumbh_nashikkar_verifications");
    if (storedNashikkar) {
      try { setNashikkarVerifications(JSON.parse(storedNashikkar)); } catch { /* ignore */ }
    }
    
    const lat = localStorage.getItem("kumbh_user_latitude");
    const lng = localStorage.getItem("kumbh_user_longitude");
    let uLat: number | null = null;
    let uLng: number | null = null;
    if (lat && lng) {
      uLat = parseFloat(lat);
      uLng = parseFloat(lng);
      setUserLocation({ lat: uLat, lng: uLng });
    }

    fetchStays(uLat, uLng);

    const subscription = supabase
      .channel("stays-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "stays" }, () => {
        fetchStays(uLat, uLng);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const filteredStays = stays.filter(
    (stay) => filter === "all" || stay.category === filter
  );

  const mapMarkers = filteredStays.map((stay) => ({
    id: stay.id,
    title: stay.title,
    lat: stay.lat,
    lng: stay.lng,
    price: stay.price,
    type: "stay" as const
  }));

  const handleVerify = (id: string) => {
    if (!isSignedIn) { setShowLoginPrompt(true); return; }
    
    const role = localStorage.getItem("kumbh_role");
    const nameOfUser = user?.firstName || user?.emailAddresses?.[0]?.emailAddress?.split("@")[0] || "Nakul";

    if (role === "NASHIKKAR") {
      const currentList = nashikkarVerifications[id] || [];
      let updatedList: string[];
      if (currentList.includes(nameOfUser)) {
        updatedList = currentList.filter(name => name !== nameOfUser);
      } else {
        updatedList = [...currentList, nameOfUser];
      }
      
      const newVerifications = {
        ...nashikkarVerifications,
        [id]: updatedList
      };
      setNashikkarVerifications(newVerifications);
      localStorage.setItem("kumbh_nashikkar_verifications", JSON.stringify(newVerifications));
    } else {
      let updated: string[];
      let isAdding = false;
      if (userVerifiedStays.includes(id)) {
        updated = userVerifiedStays.filter((s) => s !== id);
      } else {
        updated = [...userVerifiedStays, id];
        isAdding = true;
      }
      setUserVerifiedStays(updated);
      localStorage.setItem("kumbh_verified_stays_list", JSON.stringify(updated));

      // Update stays state
      setStays((prev) =>
        prev.map((s) =>
          s.id === id
            ? { ...s, verifiedCount: s.verifiedCount + (isAdding ? 1 : -1) }
            : s
        )
      );
    }
  };

  const openGoogleMaps = (lat: number, lng: number, name: string, address: string) => {
    const cleanName = name.replace(/\s*\(.*?\)\s*/g, "").trim();
    const query = `${cleanName}, ${address}`;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`;
    window.open(url, "_blank");
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName || !guestPhone || !checkIn || !selectedStay) return;

    const timestampVal = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ", " + new Date().toLocaleDateString();

    const { error } = await supabase.from("bookings").insert({
      stay_id: selectedStay.id,
      stay_title: selectedStay.title,
      guest_name: guestName,
      guest_phone: guestPhone,
      check_in: checkIn,
      timestamp: timestampVal,
      acknowledged: false
    });

    if (!error) {
      setBookingSuccess(true);
      setTimeout(() => {
        setBookingForm(false);
        setSelectedStay(null);
        setBookingSuccess(false);
        setGuestName("");
        setGuestPhone("");
        setCheckIn("");
      }, 2500);
    } else {
      console.error("Failed to submit booking:", error);
    }
  };

  const handleConfirmBookingClick = () => {
    if (!isSignedIn) {
      setShowLoginPrompt(true);
      return;
    }
    setBookingForm(true);
  };

  const handleListStayClick = () => {
    if (!isSignedIn) {
      setShowLoginPrompt(true);
      return;
    }
    setHostForm(true);
  };

  const handleHostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSignedIn) {
      setShowLoginPrompt(true);
      return;
    }
    if (!hostTitle || !hostPrice || !hostAddress) return;

    const priceVal = hostPrice.startsWith("₹") ? hostPrice : `₹${hostPrice} / night`;
    const amenitiesArr = hostAmenities ? hostAmenities.split(",").map(a => a.trim()).filter(Boolean) : ["Clean Water", "Basic Safety"];
    const descVal = hostDesc || "Self-listed local pilgrim accommodation.";

    const { error } = await supabase.from("stays").insert({
      title: hostTitle,
      category: hostCategory,
      price: priceVal,
      address: hostAddress,
      lat: 20.0092 + (Math.random() - 0.5) * 0.02,
      lng: 73.7915 + (Math.random() - 0.5) * 0.02,
      rating: 5.0,
      amenities: amenitiesArr,
      desc: descVal,
      verified_count: 1
    });

    if (!error) {
      setHostForm(false);
      setHostTitle("");
      setHostCategory("guesthouse");
      setHostPrice("");
      setHostAddress("");
      setHostDesc("");
      setHostAmenities("");
    } else {
      console.error("Failed to insert stay:", error);
    }
  };

  return (
    <div className="min-h-screen md:h-screen md:overflow-hidden bg-surface pb-32 md:pb-0">
      <Header />

      <main className="max-w-md md:max-w-7xl mx-auto px-margin-mobile md:px-6 pt-6 md:pt-4 space-y-6 md:space-y-0 md:h-[calc(100vh-80px)] md:flex md:flex-col">
        {/* Title */}
        <div className="flex items-center justify-between shrink-0 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-fixed rounded-xl flex items-center justify-center text-primary border border-primary/10">
              <span className="material-symbols-outlined text-2xl font-bold">
                hotel
              </span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-on-surface">Stay Finder</h2>
              <p className="text-xs text-on-surface-variant">
                {userLocation ? "Sorted by distance from your location" : "Find budget and free ashrams in Nashik"}
              </p>
            </div>
          </div>
          {userRole === "NASHIKKAR" && (
            <button
              onClick={handleListStayClick}
              className="px-4 py-2 bg-secondary text-on-secondary font-bold text-xs rounded-xl shadow-md hover:bg-secondary-container transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm">add_home</span>
              List Your Stay
            </button>
          )}
        </div>

        {/* Content Wrapper: Flex Row on Desktop, Column on Mobile */}
        <div className="flex-1 flex flex-col md:flex-row md:gap-6 md:overflow-hidden space-y-6 md:space-y-0">
          
          {/* Left Side: Filter and List */}
          <div className="w-full md:w-[55%] md:h-full flex flex-col space-y-4 overflow-hidden order-2 md:order-1">
            {/* Filter Badges */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 shrink-0">
              {[
                { id: "all", label: "All Stays" },
                { id: "matha", label: "Mathas/Ashrams" },
                { id: "guesthouse", label: "Guest Rooms" },
                { id: "homestay", label: "Local Homestays" }
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setFilter(cat.id as any)}
                  className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap border transition-all cursor-pointer ${
                    filter === cat.id
                      ? "bg-primary text-on-primary border-primary shadow-sm scale-105"
                      : "bg-surface-container-low text-on-surface-variant border-outline-variant/30 hover:border-primary/50"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Scrollable Accommodations List */}
            <div className="flex-1 overflow-y-auto no-scrollbar pr-1 pb-4 space-y-4">
              <h3 className="text-sm font-bold text-on-surface flex items-center gap-2 sticky top-0 bg-surface py-2 z-10 border-b border-outline-variant/5">
                <span className="material-symbols-outlined text-primary text-lg">
                  list
                </span>
                Available Accommodation ({filteredStays.length})
              </h3>

              <div className="space-y-4">
                {filteredStays.map((stay) => (
                  <div
                    key={stay.id}
                    onClick={() => setSelectedStay(stay)}
                    className={`p-4 rounded-xl border bg-surface-container-lowest transition-all cursor-pointer sacred-shadow flex flex-col justify-between ${
                      selectedStay?.id === stay.id
                        ? "border-primary ring-2 ring-primary/10 bg-primary-fixed/5 scale-[1.01]"
                        : "border-outline-variant/30 hover:border-primary/45"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-extrabold uppercase bg-surface-container-high px-2 py-0.5 rounded text-primary border border-outline-variant/10">
                            {stay.category}
                          </span>
                          {(nashikkarVerifications[stay.id] && nashikkarVerifications[stay.id].length > 0) && (
                            <span 
                              className="group/tooltip relative text-[9px] font-extrabold bg-green-50 text-green-700 px-2 py-0.5 rounded border border-green-200 flex items-center gap-0.5 cursor-help"
                            >
                              <ShieldCheck size={10} /> Nashikkar Verified
                              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover/tooltip:block bg-neutral-900 text-white text-[9px] px-2 py-1 rounded shadow-md whitespace-nowrap z-50">
                                Verified by: {nashikkarVerifications[stay.id].join(", ")}
                              </span>
                            </span>
                          )}
                          <span className="text-[9px] font-extrabold bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200 flex items-center gap-0.5">
                            <Award size={10} /> Yatri Verified ({stay.verifiedCount})
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-on-surface mt-1.5">
                          {stay.title}
                        </h4>
                        <p className="text-[11px] text-on-surface-variant flex items-center gap-1 mt-1">
                          <MapPin size={12} className="text-secondary" />
                          {stay.address}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-extrabold text-primary block">
                          {stay.price}
                        </span>
                        <span className="text-[10px] text-tertiary-container font-extrabold bg-tertiary-container/10 px-1.5 py-0.5 rounded mt-1 inline-block">
                          ★ {stay.rating}
                        </span>
                        {stay.distance !== undefined && (
                          <span className="block text-[9px] font-bold text-secondary mt-1">
                            {stay.distance.toFixed(1)} km away
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mt-3 items-center">
                      {stay.amenities.slice(0, 3).map((amenity) => (
                        <span key={amenity} className="text-[9px] font-bold text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded-full">
                          {amenity}
                        </span>
                      ))}
                      {stay.amenities.length > 3 && (
                        <span className="text-[9px] font-bold text-primary bg-primary-fixed/30 px-2 py-0.5 rounded-full">
                          +{stay.amenities.length - 3} more
                        </span>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleVerify(stay.id); }}
                        className={`ml-auto p-1.5 rounded-lg border text-[9px] font-bold transition-all cursor-pointer ${
                          userVerifiedStays.includes(stay.id)
                            ? "bg-green-50 border-green-300 text-green-700"
                            : "bg-surface-container-low border-outline-variant/20 text-on-surface-variant hover:border-green-400"
                        }`}
                        title="Verify this stay"
                      >
                        <ShieldCheck size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Side: Map Area */}
          <div className="w-full md:w-[45%] h-[320px] md:h-full rounded-2xl overflow-hidden sacred-shadow border border-outline-variant/20 relative shrink-0 order-1 md:order-2">
            <Map 
              center={userLocation ? [userLocation.lat, userLocation.lng] : [20.0092, 73.7915]} 
              zoom={userLocation ? 12 : 13} 
              markers={mapMarkers} 
              onMarkerClick={(marker) => {
                const stay = stays.find((s) => s.id === marker.id);
                if (stay) setSelectedStay(stay);
              }}
            />
          </div>

        </div>
      </main>

      {/* Selected Stay Detail Drawer / Modal Overlay */}
      <AnimatePresence>
        {selectedStay && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!bookingForm) setSelectedStay(null);
              }}
              className="fixed inset-0 bg-black z-[1200]"
            />
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ duration: 0.25 }}
              className="fixed bottom-0 left-0 right-0 md:left-6 md:right-auto md:top-[88px] md:bottom-6 max-w-md w-full mx-auto md:mx-0 bg-surface rounded-t-3xl md:rounded-3xl p-6 pb-24 md:pb-6 z-[1300] border-t md:border border-outline-variant/30 sacred-shadow-lg max-h-[85vh] md:max-h-none overflow-y-auto"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-extrabold uppercase bg-primary-fixed text-on-primary-fixed px-2 py-1 rounded border border-primary/20">
                    {selectedStay.category}
                  </span>
                  {(nashikkarVerifications[selectedStay.id] && nashikkarVerifications[selectedStay.id].length > 0) && (
                    <span 
                      className="group/tooltip relative text-[10px] font-extrabold bg-green-50 text-green-700 px-2 py-1 rounded border border-green-200 flex items-center gap-0.5 cursor-help"
                    >
                      <ShieldCheck size={11} /> Nashikkar Verified
                      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover/tooltip:block bg-neutral-900 text-white text-[9px] px-2 py-1 rounded shadow-md whitespace-nowrap z-50">
                        Verified by: {nashikkarVerifications[selectedStay.id].join(", ")}
                      </span>
                    </span>
                  )}
                  <span className="text-[10px] font-extrabold bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-200 flex items-center gap-0.5">
                    <Award size={11} /> Yatri Verified ({selectedStay.verifiedCount})
                  </span>
                </div>
                <button
                  onClick={() => {
                    setSelectedStay(null);
                    setBookingForm(false);
                  }}
                  className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center border border-outline-variant/20 hover:bg-surface-container-highest cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {!bookingForm ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-on-surface">{selectedStay.title}</h3>
                    <p className="text-xs text-on-surface-variant flex items-center gap-1 mt-1">
                      <MapPin size={14} className="text-secondary" />
                      {selectedStay.address}
                    </p>
                  </div>

                  {/* Navigate + Verify buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => openGoogleMaps(selectedStay.lat, selectedStay.lng, selectedStay.title, selectedStay.address)}
                      className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold text-xs shadow-sm hover:from-blue-700 hover:to-blue-600 transition-all cursor-pointer text-center flex items-center justify-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-sm">navigation</span>
                      Navigate
                      <ExternalLink size={10} className="opacity-60" />
                    </button>
                    <button
                      onClick={() => handleVerify(selectedStay.id)}
                      className={`px-4 py-2.5 rounded-xl font-bold text-xs shadow-sm transition-all cursor-pointer flex items-center gap-1.5 border ${
                        (userRole === "NASHIKKAR" && nashikkarVerifications[selectedStay.id]?.includes(user?.firstName || "Nakul")) || (userRole === "YATRI" && userVerifiedStays.includes(selectedStay.id))
                          ? "bg-green-50 border-green-300 text-green-700"
                          : "bg-surface-container-low border-outline-variant/30 text-on-surface-variant hover:border-green-400 hover:text-green-700"
                      }`}
                    >
                      <ShieldCheck size={14} />
                      {userRole === "NASHIKKAR"
                        ? (nashikkarVerifications[selectedStay.id]?.includes(user?.firstName || "Nakul") ? "Verified by You (Nashikkar)" : "Verify as Nashikkar")
                        : (userVerifiedStays.includes(selectedStay.id) ? "Verified by You (Yatri)" : "Verify as Yatri")
                      }
                    </button>
                  </div>

                  <div className="flex items-center justify-between border-y border-outline-variant/15 py-3">
                    <div>
                      <span className="text-xs text-on-surface-variant font-medium">Bathing Space Rate</span>
                      <span className="text-lg font-extrabold text-primary block">{selectedStay.price}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-on-surface-variant font-medium">Pilgrim Rating</span>
                      <div className="flex items-center gap-1 mt-0.5 justify-end">
                        <span className="text-sm font-extrabold text-tertiary">★ {selectedStay.rating}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold uppercase text-outline tracking-wider mb-1.5">Description</h4>
                    <p className="text-xs text-on-surface-variant leading-relaxed">{selectedStay.desc}</p>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold uppercase text-outline tracking-wider mb-2">Amenities</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedStay.amenities.map((amenity) => (
                        <span key={amenity} className="text-xs font-bold text-on-surface-variant bg-surface-container-low px-3 py-1 rounded-full border border-outline-variant/10">
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleConfirmBookingClick}
                    className="w-full py-4 rounded-xl bg-primary text-on-primary font-bold shadow-md hover:bg-primary-container transition-colors cursor-pointer text-center text-sm flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-sm">bookmark_added</span>
                    {!isSignedIn ? "Log In to Book" : "Confirm Booking"}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-primary">
                    <button
                      onClick={() => setBookingForm(false)}
                      className="material-symbols-outlined font-bold cursor-pointer"
                    >
                      arrow_back
                    </button>
                    <h3 className="text-lg font-bold">Booking Registration</h3>
                  </div>

                  {bookingSuccess ? (
                    <motion.div 
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-center py-8 space-y-3"
                    >
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600 mx-auto border border-green-200">
                        <svg className="w-8 h-8 stroke-current text-green-600" viewBox="0 0 24 24" fill="none" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <motion.path 
                            d="M20 6L9 17l-5-5"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                          />
                        </svg>
                      </div>
                      <h4 className="text-base font-bold text-green-700">Booking Registered!</h4>
                      <p className="text-xs text-on-surface-variant max-w-xs mx-auto leading-relaxed">
                        Your check-in registration for <strong>{selectedStay.title}</strong> is confirmed. Keep this screen active when presenting at the desk.
                      </p>
                    </motion.div>
                  ) : (
                    <form onSubmit={handleBookingSubmit} className="space-y-4">
                      <div className="p-3 bg-primary-fixed/20 border border-primary/10 rounded-xl">
                        <p className="text-[11px] text-primary font-bold flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                            info
                          </span>
                          Direct Booking Mode Active
                        </p>
                        <p className="text-[10px] text-on-surface-variant mt-0.5 leading-normal">
                          Provide your check-in details below to secure pilgrim spots at the location.
                        </p>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                          Pilgrim Name
                        </label>
                        <input
                          type="text"
                          required
                          value={guestName}
                          onChange={(e) => setGuestName(e.target.value)}
                          placeholder="e.g. Swami Anand"
                          className="w-full p-3 bg-surface-container-low border border-outline-variant/30 rounded-xl text-xs focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          required
                          value={guestPhone}
                          onChange={(e) => setGuestPhone(e.target.value)}
                          placeholder="e.g. +91 98765 43210"
                          className="w-full p-3 bg-surface-container-low border border-outline-variant/30 rounded-xl text-xs focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                          Auspicious Arrival Date
                        </label>
                        <input
                          type="date"
                          required
                          value={checkIn}
                          onChange={(e) => setCheckIn(e.target.value)}
                          className="w-full p-3 bg-surface-container-low border border-outline-variant/30 rounded-xl text-xs focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-4 rounded-xl bg-primary text-on-primary font-bold shadow-md hover:bg-primary-container transition-colors cursor-pointer text-center text-sm"
                      >
                        Register Booking Slot
                      </button>
                    </form>
                  )}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Host / List Your Stay Modal Overlay */}
      <AnimatePresence>
        {hostForm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setHostForm(false)}
              className="fixed inset-0 bg-black z-[1200]"
            />
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ duration: 0.25 }}
              className="fixed bottom-0 left-0 right-0 md:left-6 md:right-auto md:top-[88px] md:bottom-6 max-w-md w-full mx-auto md:mx-0 bg-surface rounded-t-3xl md:rounded-3xl p-6 pb-24 md:pb-6 z-[1300] border-t md:border border-outline-variant/30 sacred-shadow-lg max-h-[90vh] md:max-h-none overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-xl">add_home</span>
                  List Your Accommodation
                </h3>
                <button
                  onClick={() => setHostForm(false)}
                  className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center border border-outline-variant/20 hover:bg-surface-container-highest cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleHostSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant uppercase">Accommodation Name</label>
                  <input
                    type="text"
                    required
                    value={hostTitle}
                    onChange={(e) => setHostTitle(e.target.value)}
                    placeholder="e.g. Anand Bhavan Pilgrim Ashram"
                    className="w-full p-2.5 bg-surface-container-low border border-outline-variant/30 rounded-xl text-xs focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-on-surface-variant uppercase">Category</label>
                    <select
                      value={hostCategory}
                      onChange={(e) => setHostCategory(e.target.value as any)}
                      className="w-full p-2.5 bg-surface-container-low border border-outline-variant/30 rounded-xl text-xs focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                    >
                      <option value="matha">Matha/Ashram</option>
                      <option value="guesthouse">Guest Rooms</option>
                      <option value="homestay">Homestay</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-on-surface-variant uppercase">Price (₹ / night)</label>
                    <input
                      type="text"
                      required
                      value={hostPrice}
                      onChange={(e) => setHostPrice(e.target.value)}
                      placeholder="e.g. 500 or Free"
                      className="w-full p-2.5 bg-surface-container-low border border-outline-variant/30 rounded-xl text-xs focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant uppercase">Address</label>
                  <input
                    type="text"
                    required
                    value={hostAddress}
                    onChange={(e) => setHostAddress(e.target.value)}
                    placeholder="e.g. Near Panchavati Kalaram Temple"
                    className="w-full p-2.5 bg-surface-container-low border border-outline-variant/30 rounded-xl text-xs focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                  />
                </div>



                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant uppercase">Amenities (Comma separated)</label>
                  <input
                    type="text"
                    value={hostAmenities}
                    onChange={(e) => setHostAmenities(e.target.value)}
                    placeholder="e.g. Drinking Water, WiFi, Attached Bath"
                    className="w-full p-2.5 bg-surface-container-low border border-outline-variant/30 rounded-xl text-xs focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant uppercase">Description</label>
                  <textarea
                    value={hostDesc}
                    onChange={(e) => setHostDesc(e.target.value)}
                    placeholder="Provide details about registration rules, timing, food availability, etc."
                    rows={3}
                    className="w-full p-2.5 bg-surface-container-low border border-outline-variant/30 rounded-xl text-xs focus:ring-1 focus:ring-primary focus:border-primary outline-none resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-4.5 rounded-xl bg-primary text-on-primary font-bold shadow-md hover:bg-primary-container transition-colors cursor-pointer text-center text-sm"
                >
                  List Accommodation
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showLoginPrompt && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLoginPrompt(false)}
              className="fixed inset-0 bg-black z-[1400]"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm bg-surface rounded-2xl p-6 z-[1500] sacred-shadow-lg border border-outline-variant/30 text-center space-y-4"
            >
              <div className="w-14 h-14 bg-primary-fixed rounded-full flex items-center justify-center mx-auto border border-primary/20">
                <LogIn size={24} className="text-primary" />
              </div>
              <h3 className="text-lg font-bold text-on-surface">Login Required</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                To verify, list, or book stays, you need to be logged in with a Yatri account. Guest access does not support these features.
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
                  className="flex-1 py-2.5 rounded-xl bg-primary text-on-primary font-bold text-xs shadow-md cursor-pointer hover:bg-primary-container transition-all"
                >
                  Log In Now
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <Navbar />
    </div>
  );
}
