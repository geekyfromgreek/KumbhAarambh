"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Header from "@/components/Header";
import Navbar from "@/components/Navbar";
import { motion, AnimatePresence } from "framer-motion";
import { Utensils, MapPin, X, Star, Heart, CheckCircle2, ShieldCheck, ExternalLink, LogIn, Award } from "lucide-react";
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

interface FoodSpot {
  id: string;
  name: string;
  category: "bhandara" | "restaurant" | "sweets";
  price: string;
  address: string;
  lat: number;
  lng: number;
  rating: number;
  likes: number;
  specialty: string;
  desc: string;
  reviews: { reviewer: string; rating: number; comment: string; date: string }[];
  distance?: number;
  verifiedCount: number;
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

const mockFoodSpots: FoodSpot[] = [
  {
    id: "food-1",
    name: "Shree Swaminarayan Mandir Dining Hall (Prasad)",
    category: "bhandara",
    price: "Free (Prasad)",
    address: "Shree Swaminarayan Mandir, Panchavati, Nashik",
    lat: 20.0105,
    lng: 73.7932,
    rating: 4.9,
    likes: 312,
    specialty: "Pure Veg Satvik Mahaprasad",
    desc: "A massive community kitchen run by the Swaminarayan Temple Trust, offering free pure veg meals and clean drinking water to all pilgrims.",
    reviews: [
      { reviewer: "Ramesh Sharma", rating: 5, comment: "Hot Prasad served with deep devotion. Extremely clean.", date: "Today" },
      { reviewer: "Geeta Patel", rating: 5, comment: "Heartwarming volunteer service. Clean filtered water available.", date: "Yesterday" }
    ],
    verifiedCount: 45
  },
  {
    id: "food-2",
    name: "Sadhana Restaurant (Famous Chulivarchi Misal)",
    category: "restaurant",
    price: "₹120 / plate",
    address: "Someshwar Temple Road, Gangapur, Nashik",
    lat: 19.9990,
    lng: 73.7240,
    rating: 4.8,
    likes: 420,
    specialty: "Chulivarchi Misal Pav",
    desc: "Traditional wood-fired Maharashtrian spicy curry topped with farsan, served with hot pav. Set in a scenic village-themed garden near Someshwar waterfall.",
    reviews: [
      { reviewer: "Amit K.", rating: 5, comment: "The authentic smoky taste of Nashik Misal. Highly recommended!", date: "2 days ago" }
    ],
    verifiedCount: 28
  },
  {
    id: "food-3",
    name: "Panchavati Gaurav Pure Veg",
    category: "restaurant",
    price: "₹250 / thali",
    address: "Near Pramod Mahajan Garden, College Road, Nashik",
    lat: 20.0035,
    lng: 73.7780,
    rating: 4.6,
    likes: 198,
    specialty: "Unlimited Maharashtrian Thali",
    desc: "Subsidized thali containing dynamic varieties of local curries, dal, varan bhat, and hot puran polis served with dollops of pure ghee.",
    reviews: [],
    verifiedCount: 19
  },
  {
    id: "food-4",
    name: "Krishna Vijay Halwai Sweet Mart",
    category: "sweets",
    price: "₹60 / plate",
    address: "Kapaleshwar Mandir Chowk, Panchavati, Nashik",
    lat: 20.0102,
    lng: 73.7912,
    rating: 4.7,
    likes: 245,
    specialty: "Saffron Jalebi & Rabdi",
    desc: "A legendary sweet corner right next to Kapaleshwar temple. Famous for its thick, saffron-infused crispy jalebis and chilled rabdi.",
    reviews: [],
    verifiedCount: 32
  },
  {
    id: "food-5",
    name: "Bapu Ki Misal",
    category: "restaurant",
    price: "₹100 / plate",
    address: "Nashik Road, Nashik",
    lat: 19.9650,
    lng: 73.8150,
    rating: 4.8,
    likes: 380,
    specialty: "Authentic Nashik Misal",
    desc: "Extremely popular misal joint famous for its spicy and flavorful rassa (gravy).",
    reviews: [],
    verifiedCount: 56
  },
  {
    id: "food-6",
    name: "Modern Cafe (Famous Chinese & Fast Food)",
    category: "restaurant",
    price: "₹150 / plate",
    address: "College Road, Near BYK College, Nashik",
    lat: 20.0068,
    lng: 73.7635,
    rating: 4.6,
    likes: 210,
    specialty: "Veg Hakka Noodles & Manchurian",
    desc: "Highly popular hangout spot on College Road, widely known for serving some of the best street-style Indo-Chinese and fast food in Nashik.",
    reviews: [],
    verifiedCount: 12
  },
  {
    id: "food-7",
    name: "Nandan Sweets",
    category: "sweets",
    price: "₹50 / piece",
    address: "Panchavati, Nashik",
    lat: 20.0100,
    lng: 73.7900,
    rating: 4.6,
    likes: 185,
    specialty: "Pedhas & Milk Sweets",
    desc: "One of the oldest sweet shops offering pure milk-based sweets, great for carrying as Prasad.",
    reviews: [],
    verifiedCount: 8
  },
  {
    id: "food-8",
    name: "Gajanan Maharaj Prasadalaya",
    category: "bhandara",
    price: "Free (Prasad)",
    address: "Trimbakeshwar, Nashik",
    lat: 19.9350,
    lng: 73.5350,
    rating: 5.0,
    likes: 540,
    specialty: "Varan Bhaat Prasad",
    desc: "A mega free kitchen feeding thousands of pilgrims daily with utmost hygiene and devotion.",
    reviews: [],
    verifiedCount: 89
  },
  {
    id: "food-9",
    name: "Shreeji Chat & Sandwiches (Famous College Road Chat)",
    category: "sweets",
    price: "₹80 / plate",
    address: "College Road, Opposite BYK College, Nashik",
    lat: 20.0065,
    lng: 73.7622,
    rating: 4.8,
    likes: 295,
    specialty: "Cheese Sev Puri & Dahi Puri",
    desc: "Undoubtedly the most popular street chaat and sandwich stall in College Road, frequented by students and families alike for hygienic and highly flavorful street food.",
    reviews: [],
    verifiedCount: 34
  },
  {
    id: "food-10",
    name: "Pavan Momo Corner",
    category: "restaurant",
    price: "₹70 / plate",
    address: "Krishi Nagar Jogging Track, College Road, Nashik",
    lat: 20.0072,
    lng: 73.7608,
    rating: 4.7,
    likes: 185,
    specialty: "Veg Steam & Fried Momos",
    desc: "Nashik's legendary momo joint. Serving piping hot veg steam momos with extra spicy red chutney and hot soup for over a decade.",
    reviews: [],
    verifiedCount: 22
  },
  {
    id: "food-11",
    name: "Yashwant Bhel & Chaat",
    category: "sweets",
    price: "₹50 / plate",
    address: "Near Yashwant Maharaj Mandir, Panchavati, Nashik",
    lat: 20.0085,
    lng: 73.7905,
    rating: 4.9,
    likes: 312,
    specialty: "Oli Bhel & Sukhi Bhel",
    desc: "A famous streetside cart serving authentic spicy Nashik-style bhel and sev dahi puri. Located close to Ram Kund.",
    reviews: [],
    verifiedCount: 57
  },
  {
    id: "food-12",
    name: "Budha Halwai (Iconic Sweet Shop)",
    category: "sweets",
    price: "₹100 / plate",
    address: "Bhadrakali Fruit Market, Bhadrakali, Nashik",
    lat: 20.0020,
    lng: 73.7885,
    rating: 4.9,
    likes: 410,
    specialty: "Pure Ghee Jalebi & Rabdi",
    desc: "The oldest and most iconic sweet shop in Nashik (since 1920), famous for their piping hot pure ghee jalebis served with thick creamy rabdi.",
    reviews: [],
    verifiedCount: 94
  }
];

export default function FoodFinder() {
  const router = useRouter();
  const { isSignedIn, user } = useUser();
  const [filter, setFilter] = useState<"all" | "bhandara" | "restaurant" | "sweets">("all");
  const [selectedSpot, setSelectedSpot] = useState<FoodSpot | null>(null);
  const [foodSpots, setFoodSpots] = useState<FoodSpot[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [likedSpots, setLikedSpots] = useState<string[]>([]);
  const [activeReviews, setActiveReviews] = useState<any[]>([]);

  // Nashikkar verifiers lists mapped by spotId
  const [nashikkarVerifications, setNashikkarVerifications] = useState<{ [spotId: string]: string[] }>({
    "food-1": ["Nakul", "Sachin"],
    "food-2": ["Amit"],
    "food-3": ["Pooja"],
    "food-4": ["Vikram"],
    "food-5": ["Aniket"],
    "food-6": ["Nakul", "Saurabh"],
    "food-7": ["Pranit"],
    "food-8": ["Kunal"]
  });
  
  // Verified spots (stored in localStorage for Yatris)
  const [verifiedSpots, setVerifiedSpots] = useState<string[]>([]);

  // Review inputs
  const [reviewerName, setReviewerName] = useState("");
  const [ratingInput, setRatingInput] = useState(5);
  const [commentInput, setCommentInput] = useState("");
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  // Login prompt
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const fetchFoodSpots = async (uLat: number | null, uLng: number | null) => {
    const { data, error } = await supabase.from("food_spots").select("*");
    if (!error && data) {
      let loaded = data.map((s: any) => ({
        id: s.id,
        name: s.name,
        category: s.category,
        price: s.price,
        address: s.address,
        lat: s.lat,
        lng: s.lng,
        rating: s.rating,
        likes: s.likes,
        specialty: s.specialty,
        desc: s.desc,
        reviews: [],
        verifiedCount: s.verified_count
      }));

      if (uLat && uLng) {
        loaded = loaded.map((s: any) => ({
          ...s,
          distance: getDistance(uLat, uLng, s.lat, s.lng)
        })).sort((a: any, b: any) => (a.distance || 0) - (b.distance || 0));
      }
      setFoodSpots(loaded);
    }
  };

  const loadSpotReviews = async (spotId: string) => {
    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("spot_id", spotId);

    if (!error && data) {
      setActiveReviews(data);
    }
  };

  useEffect(() => {
    if (selectedSpot) {
      loadSpotReviews(selectedSpot.id);
    }
  }, [selectedSpot]);

  useEffect(() => {
    const role = localStorage.getItem("kumbh_role");
    setUserRole(role);

    const storedVerified = localStorage.getItem("kumbh_verified_food");
    if (storedVerified) {
      try { setVerifiedSpots(JSON.parse(storedVerified)); } catch { /* ignore */ }
    }

    const storedNashikkar = localStorage.getItem("kumbh_nashikkar_verified_food");
    if (storedNashikkar) {
      try { setNashikkarVerifications(JSON.parse(storedNashikkar)); } catch { /* ignore */ }
    }

    const storedLikes = localStorage.getItem("kumbh_liked_food");
    if (storedLikes) {
      try { setLikedSpots(JSON.parse(storedLikes)); } catch { /* ignore */ }
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

    fetchFoodSpots(uLat, uLng);

    const subscription = supabase
      .channel("food-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "food_spots" }, () => {
        fetchFoodSpots(uLat, uLng);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const filteredSpots = foodSpots.filter(
    (spot) => filter === "all" || spot.category === filter
  );

  // Map markers translation
  const mapMarkers = filteredSpots.map((spot) => ({
    id: spot.id,
    title: spot.name,
    lat: spot.lat,
    lng: spot.lng,
    price: spot.price,
    type: "food" as const
  }));

  const handleLike = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    let updated: string[];
    if (likedSpots.includes(id)) {
      updated = likedSpots.filter((s) => s !== id);
    } else {
      updated = [...likedSpots, id];
    }
    setLikedSpots(updated);
    localStorage.setItem("kumbh_liked_food", JSON.stringify(updated));
  };

  const handleVerify = (id: string) => {
    if (!isSignedIn) {
      setShowLoginPrompt(true);
      return;
    }
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
      localStorage.setItem("kumbh_nashikkar_verified_food", JSON.stringify(newVerifications));
    } else {
      let updated: string[];
      let isAdding = false;
      if (verifiedSpots.includes(id)) {
        updated = verifiedSpots.filter((s) => s !== id);
      } else {
        updated = [...verifiedSpots, id];
        isAdding = true;
      }
      setVerifiedSpots(updated);
      localStorage.setItem("kumbh_verified_food", JSON.stringify(updated));

      // Update foodSpots state to reflect Yatri verifiedCount
      setFoodSpots((prev) =>
        prev.map((s) =>
          s.id === id
            ? { ...s, verifiedCount: s.verifiedCount + (isAdding ? 1 : -1) }
            : s
        )
      );
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSignedIn) {
      setShowLoginPrompt(true);
      return;
    }
    if (!reviewerName || !commentInput || !selectedSpot) return;

    const { error } = await supabase.from("reviews").insert({
      spot_id: selectedSpot.id,
      reviewer: reviewerName,
      rating: ratingInput,
      comment: commentInput,
      date: "Just now"
    });

    if (!error) {
      setReviewSubmitted(true);
      loadSpotReviews(selectedSpot.id);
      setTimeout(() => {
        setReviewSubmitted(false);
        setReviewerName("");
        setCommentInput("");
        setRatingInput(5);
      }, 2000);
    } else {
      console.error("Failed to submit review:", error);
    }
  };

  const openGoogleMaps = (lat: number, lng: number, name: string, address: string) => {
    const cleanName = name.replace(/\s*\(.*?\)\s*/g, "").trim();
    const query = `${cleanName}, ${address}`;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`;
    window.open(url, "_blank");
  };

  return (
    <div className="min-h-screen md:h-screen md:overflow-hidden bg-surface pb-32 md:pb-0">
      <Header />

      <main className="max-w-md md:max-w-7xl mx-auto px-margin-mobile md:px-6 pt-6 md:pt-4 space-y-6 md:space-y-0 md:h-[calc(100vh-72px)] md:flex md:flex-col">
        
        {/* Page Banner */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-secondary-fixed rounded-xl flex items-center justify-center text-secondary border border-secondary/10">
            <span className="material-symbols-outlined text-2xl font-bold">
              restaurant
            </span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-on-surface">Food & Bhandara</h2>
            <p className="text-xs text-on-surface-variant">
              {userLocation ? "Sorted by distance from your location" : "Locate free meals, local snacks, and pure veg dining"}
            </p>
          </div>
        </div>

        {/* Desktop: side-by-side map + list */}
        <div className="md:flex md:gap-5 md:flex-1 md:overflow-hidden md:py-2 space-y-6 md:space-y-0">

          {/* Left: Map + Filters */}
          <div className="md:w-[400px] md:shrink-0 space-y-4">
            {/* Map */}
            <div className="w-full h-[320px] rounded-2xl overflow-hidden sacred-shadow border border-outline-variant/20 relative">
          <Map 
            center={userLocation ? [userLocation.lat, userLocation.lng] : [20.0092, 73.7915]} 
            zoom={userLocation ? 12 : 13} 
            markers={mapMarkers} 
            onMarkerClick={(marker) => {
              const spot = foodSpots.find((s) => s.id === marker.id);
              if (spot) setSelectedSpot(spot);
            }}
          />
        </div>

            {/* Filters */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              {[
                { id: "all", label: "All Eateries" },
                { id: "bhandara", label: "Free Bhandaras" },
                { id: "restaurant", label: "Pure Veg Diners" },
                { id: "sweets", label: "Traditional Sweets" }
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
          </div>

          {/* Right: List */}
          <div className="flex-1 md:overflow-y-auto no-scrollbar space-y-4">
            <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-lg">
                restaurant_menu
              </span>
              Eateries Around You ({filteredSpots.length})
            </h3>

            <div className="space-y-3">
              {filteredSpots.map((spot) => {
                const isLiked = likedSpots.includes(spot.id);
                const isVerified = verifiedSpots.includes(spot.id);
                return (
                  <div
                    key={spot.id}
                    onClick={() => setSelectedSpot(spot)}
                    className={`p-4 rounded-xl border bg-surface-container-lowest transition-all cursor-pointer sacred-shadow flex justify-between items-center ${
                      selectedSpot?.id === spot.id
                        ? "border-primary ring-2 ring-primary/10 bg-primary-fixed/5 scale-[1.01]"
                        : "border-outline-variant/30 hover:border-primary/45"
                    }`}
                  >
                    <div className="flex-1 pr-4">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-extrabold uppercase bg-surface-container-high px-2 py-0.5 rounded text-primary border border-outline-variant/10">
                          {spot.category === "bhandara" ? "Volunteer Bhandara" : spot.category}
                        </span>
                        {(nashikkarVerifications[spot.id] && nashikkarVerifications[spot.id].length > 0) && (
                          <span 
                            className="group/tooltip relative text-[9px] font-extrabold bg-green-50 text-green-700 px-2 py-0.5 rounded border border-green-200 flex items-center gap-0.5 cursor-help"
                          >
                            <ShieldCheck size={10} /> Nashikkar Verified
                            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover/tooltip:block bg-neutral-900 text-white text-[9px] px-2 py-1 rounded shadow-md whitespace-nowrap z-50">
                              Verified by: {nashikkarVerifications[spot.id].join(", ")}
                            </span>
                          </span>
                        )}
                        <span className="text-[9px] font-extrabold bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200 flex items-center gap-0.5">
                          <Award size={10} /> Yatri Verified ({spot.verifiedCount})
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-on-surface mt-1.5">
                        {spot.name}
                      </h4>
                      <p className="text-[11px] text-on-surface-variant flex items-center gap-1 mt-1">
                        <MapPin size={12} className="text-secondary" />
                        {spot.address}
                      </p>
                      <div className="text-[10px] font-extrabold text-secondary mt-1">
                        Specialty: {spot.specialty}
                      </div>
                    </div>

                    <div className="text-right flex flex-col justify-between items-end h-full gap-2">
                      <div>
                        <span className={`text-xs font-bold block ${
                          spot.price.includes("Free") ? "text-green-600 font-extrabold" : "text-primary"
                        }`}>
                          {spot.price}
                        </span>
                        <span className="text-[9px] font-extrabold text-tertiary bg-tertiary-container/10 px-1.5 py-0.5 rounded mt-1 inline-block">
                          ★ {spot.rating}
                        </span>
                        {spot.distance !== undefined && (
                          <span className="block text-[9px] font-bold text-secondary mt-1">
                            {spot.distance.toFixed(1)} km away
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleVerify(spot.id); }}
                          className={`p-1.5 rounded-lg border text-[9px] font-bold transition-all cursor-pointer ${
                            (userRole === "NASHIKKAR" && nashikkarVerifications[spot.id]?.includes(user?.firstName || "Nakul")) || (userRole === "YATRI" && verifiedSpots.includes(spot.id))
                              ? "bg-green-50 border-green-300 text-green-700"
                              : "bg-surface-container-low border-outline-variant/20 text-on-surface-variant hover:border-green-400"
                          }`}
                          title={userRole === "NASHIKKAR" ? "Verify as Nashikkar" : "Verify as Yatri"}
                        >
                          <ShieldCheck size={14} />
                        </button>
                        <button
                          onClick={(e) => handleLike(spot.id, e)}
                          className="flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                        >
                          <Heart 
                            size={14} 
                            className={isLiked ? "fill-primary text-primary" : "text-outline"} 
                          />
                          <span>{spot.likes + (isLiked ? 1 : 0)}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </main>

      {/* Eatery Details Drawer */}
      <AnimatePresence>
        {selectedSpot && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedSpot(null)}
              className="fixed inset-0 bg-black z-[1200]"
            />
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ duration: 0.25 }}
              className="fixed bottom-0 left-0 right-0 md:right-6 md:left-auto md:top-[88px] md:bottom-6 max-w-md w-full mx-auto md:mx-0 bg-surface rounded-t-3xl md:rounded-3xl p-6 pb-24 md:pb-6 z-[1300] border-t md:border border-outline-variant/30 sacred-shadow-lg max-h-[85vh] md:max-h-none overflow-y-auto"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-extrabold uppercase bg-primary-fixed text-on-primary-fixed px-2 py-1 rounded border border-primary/20">
                    {selectedSpot.category}
                  </span>
                  {(nashikkarVerifications[selectedSpot.id] && nashikkarVerifications[selectedSpot.id].length > 0) && (
                    <span 
                      className="group/tooltip relative text-[10px] font-extrabold bg-green-50 text-green-700 px-2 py-1 rounded border border-green-200 flex items-center gap-0.5 cursor-help"
                    >
                      <ShieldCheck size={11} /> Nashikkar Verified
                      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover/tooltip:block bg-neutral-900 text-white text-[9px] px-2 py-1 rounded shadow-md whitespace-nowrap z-50">
                        Verified by: {nashikkarVerifications[selectedSpot.id].join(", ")}
                      </span>
                    </span>
                  )}
                  <span className="text-[10px] font-extrabold bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-200 flex items-center gap-0.5">
                    <Award size={11} /> Yatri Verified ({selectedSpot.verifiedCount})
                  </span>
                </div>
                <button
                  onClick={() => setSelectedSpot(null)}
                  className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center border border-outline-variant/20 hover:bg-surface-container-highest cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-on-surface">{selectedSpot.name}</h3>
                  <p className="text-xs text-on-surface-variant flex items-center gap-1 mt-1">
                    <MapPin size={14} className="text-secondary" />
                    {selectedSpot.address}
                  </p>
                </div>

                {/* Navigate + Verify buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => openGoogleMaps(selectedSpot.lat, selectedSpot.lng, selectedSpot.name, selectedSpot.address)}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold text-xs shadow-sm hover:from-blue-700 hover:to-blue-600 transition-all cursor-pointer text-center flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-sm">navigation</span>
                    Navigate
                    <ExternalLink size={10} className="opacity-60" />
                  </button>
                  <button
                    onClick={() => handleVerify(selectedSpot.id)}
                    className={`px-4 py-2.5 rounded-xl font-bold text-xs shadow-sm transition-all cursor-pointer flex items-center gap-1.5 border ${
                      (userRole === "NASHIKKAR" && nashikkarVerifications[selectedSpot.id]?.includes(user?.firstName || "Nakul")) || (userRole === "YATRI" && verifiedSpots.includes(selectedSpot.id))
                        ? "bg-green-50 border-green-300 text-green-700"
                        : "bg-surface-container-low border-outline-variant/30 text-on-surface-variant hover:border-green-400 hover:text-green-700"
                    }`}
                  >
                    <ShieldCheck size={14} />
                    {userRole === "NASHIKKAR"
                      ? (nashikkarVerifications[selectedSpot.id]?.includes(user?.firstName || "Nakul") ? "Verified by You (Nashikkar)" : "Verify as Nashikkar")
                      : (verifiedSpots.includes(selectedSpot.id) ? "Verified by You (Yatri)" : "Verify as Yatri")
                    }
                  </button>
                </div>

                <div className="bg-surface-container-low p-3.5 rounded-xl border border-outline-variant/15 text-xs text-on-surface-variant leading-relaxed">
                  <strong className="text-primary block mb-1">About our food:</strong>
                  {selectedSpot.desc}
                </div>

                {/* Review Form */}
                <div className="border-t border-outline-variant/15 pt-4 space-y-3">
                  <h4 className="text-sm font-bold text-on-surface">Rate & Review</h4>
                  
                  {!isSignedIn ? (
                    <div className="p-4 bg-surface-container-low border border-outline-variant/20 rounded-xl text-center space-y-3">
                      <LogIn size={24} className="text-primary mx-auto" />
                      <p className="text-xs text-on-surface-variant font-medium">
                        You must be logged in to rate and review places.
                      </p>
                      <button
                        onClick={() => router.push("/login")}
                        className="px-6 py-2.5 rounded-xl bg-primary text-on-primary font-bold text-xs shadow-sm hover:bg-primary-container cursor-pointer transition-all"
                      >
                        Log In to Review
                      </button>
                    </div>
                  ) : reviewSubmitted ? (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl text-center flex items-center justify-center gap-2 text-xs font-bold"
                    >
                      <svg className="w-5 h-5 stroke-current text-green-600" viewBox="0 0 24 24" fill="none" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <motion.path 
                          d="M20 6L9 17l-5-5"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 0.4, ease: "easeOut" }}
                        />
                      </svg>
                      Review recorded successfully!
                    </motion.div>
                  ) : (
                    <form onSubmit={handleReviewSubmit} className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-on-surface-variant uppercase">Name</label>
                          <input
                            type="text"
                            required
                            value={reviewerName}
                            onChange={(e) => setReviewerName(e.target.value)}
                            placeholder="e.g. Rahul Dev"
                            className="w-full p-2 bg-surface-container-low border border-outline-variant/20 rounded-lg text-xs outline-none focus:ring-1 focus:ring-primary"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-on-surface-variant uppercase">Rating</label>
                          <select
                            value={ratingInput}
                            onChange={(e) => setRatingInput(Number(e.target.value))}
                            className="w-full p-2 bg-surface-container-low border border-outline-variant/20 rounded-lg text-xs outline-none focus:ring-1 focus:ring-primary"
                          >
                            <option value="5">★★★★★ (5/5)</option>
                            <option value="4">★★★★☆ (4/5)</option>
                            <option value="3">★★★☆☆ (3/5)</option>
                            <option value="2">★★☆☆☆ (2/5)</option>
                            <option value="1">★☆☆☆☆ (1/5)</option>
                          </select>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-on-surface-variant uppercase">Comment</label>
                        <textarea
                          required
                          value={commentInput}
                          onChange={(e) => setCommentInput(e.target.value)}
                          placeholder="How was the food quality and service?"
                          rows={2}
                          className="w-full p-2 bg-surface-container-low border border-outline-variant/20 rounded-lg text-xs outline-none focus:ring-1 focus:ring-primary resize-none"
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full py-2.5 rounded-lg bg-primary text-on-primary font-bold text-xs shadow-sm hover:bg-primary-container cursor-pointer text-center"
                      >
                        Submit Feedback
                      </button>
                    </form>
                  )}
                </div>

                {/* Reviews List */}
                <div className="border-t border-outline-variant/15 pt-4 space-y-3">
                  <h4 className="text-sm font-bold text-on-surface">Pilgrim Reviews ({activeReviews.length})</h4>
                  {activeReviews.length === 0 ? (
                    <p className="text-xs text-outline italic text-center py-2">No reviews left yet. Be the first!</p>
                  ) : (
                    <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                      {activeReviews.map((rev, index) => (
                        <div key={index} className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/10 text-xs">
                          <div className="flex items-center justify-between font-bold text-on-surface">
                            <span>{rev.reviewer}</span>
                            <span className="text-tertiary">{"★".repeat(rev.rating)}</span>
                          </div>
                          <p className="text-on-surface-variant mt-1 leading-relaxed">{rev.comment}</p>
                          <span className="text-[9px] text-outline mt-1 block text-right">{rev.date}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Login Required Prompt Modal */}
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
                To rate, review, or verify places, you need to be logged in with a Yatri account. Guest access does not support these features.
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

      <Navbar />
    </div>
  );
}
