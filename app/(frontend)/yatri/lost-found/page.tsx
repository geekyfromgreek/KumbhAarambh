"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Header from "@/components/Header";
import Navbar from "@/components/Navbar";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@clerk/nextjs";
import { supabase } from "@/lib/supabaseClient";
import { Search, MapPin, PlusCircle, Award, CheckCircle2, ShieldAlert, X, Image as ImageIcon, Heart } from "lucide-react";

// Dynamically import Map to bypass SSR Node build error
const Map = dynamic(() => import("@/components/Map"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[260px] bg-surface-container-high rounded-2xl flex items-center justify-center animate-pulse border border-outline-variant/20">
      <div className="text-center space-y-2">
        <span className="material-symbols-outlined text-4xl text-primary animate-spin">
          progress_activity
        </span>
        <p className="text-xs text-on-surface-variant font-bold">Loading Sacred Map...</p>
      </div>
    </div>
  )
});

interface LostItem {
  id: string;
  title: string;
  description: string;
  location_name: string;
  lat: number;
  lng: number;
  image_url: string | null;
  reporter_name: string;
  reporter_role: "YATRI" | "NASHIKKAR";
  status: "LOST" | "FOUND" | "CLAIMED";
  created_at: string;
}

interface LeaderboardUser {
  name: string;
  role: "YATRI" | "NASHIKKAR";
  count: number;
}

export default function LostFoundPage() {
  const { isSignedIn, user } = useUser();
  const [activeTab, setActiveTab] = useState<"items" | "report" | "hall-of-fame">("items");
  const [lostItems, setLostItems] = useState<LostItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<LostItem | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [userRole, setUserRole] = useState<"YATRI" | "NASHIKKAR">("YATRI");

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [locationName, setLocationName] = useState("");
  const [itemType, setItemType] = useState<"LOST" | "FOUND">("LOST");
  const [imagePreset, setImagePreset] = useState("wallet");
  const [customImageUrl, setCustomImageUrl] = useState("");
  const [formSuccess, setFormSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const presets: Record<string, string> = {
    wallet: "https://images.unsplash.com/photo-1627124118123-273579727469?w=300&q=80",
    bag: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=300&q=80",
    phone: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&q=80",
    keys: "https://images.unsplash.com/photo-1582139329536-e7284fece509?w=300&q=80",
    documents: "https://images.unsplash.com/photo-1450133064473-71024230f91b?w=300&q=80",
    other: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=300&q=80"
  };

  const fetchItems = async () => {
    const { data, error } = await supabase
      .from("lost_items")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      const loaded: LostItem[] = data.map((item: any) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        location_name: item.location_name,
        lat: item.lat,
        lng: item.lng,
        image_url: item.image_url,
        reporter_name: item.reporter_name,
        reporter_role: item.reporter_role,
        status: item.status,
        created_at: item.created_at
      }));
      setLostItems(loaded);
    }
  };

  useEffect(() => {
    // Get user GPS details from localstorage
    const lat = localStorage.getItem("kumbh_user_latitude");
    const lng = localStorage.getItem("kumbh_user_longitude");
    if (lat && lng) {
      setUserLocation({ lat: parseFloat(lat), lng: parseFloat(lng) });
    }

    // Get current role
    const role = localStorage.getItem("kumbh_role");
    if (role === "NASHIKKAR") {
      setUserRole("NASHIKKAR");
    } else {
      setUserRole("YATRI");
    }

    fetchItems();

    // Subscribe to realtime database updates
    const subscription = supabase
      .channel("lost-items-channel")
      .on("postgres_changes", { event: "*", schema: "public", table: "lost_items" }, () => {
        fetchItems();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!title || !description || !locationName) {
      setFormError("All text fields are required.");
      return;
    }

    // Derive location coordinates (use user location or fall back to Ram Kund center if unavailable)
    const lat = userLocation?.lat || 20.0092;
    const lng = userLocation?.lng || 73.7915;

    // Use Clerk name or user role fallback
    const reporterName = user?.firstName || user?.emailAddresses?.[0]?.emailAddress?.split("@")[0] || "Pilgrim Citizen";
    const imageUrl = customImageUrl || presets[imagePreset] || presets["other"];

    const { error } = await supabase.from("lost_items").insert({
      title,
      description,
      location_name: locationName,
      lat,
      lng,
      image_url: imageUrl,
      reporter_name: reporterName,
      reporter_role: userRole,
      status: itemType
    });

    if (!error) {
      setFormSuccess(true);
      setTitle("");
      setDescription("");
      setLocationName("");
      setCustomImageUrl("");
      setTimeout(() => {
        setFormSuccess(false);
        setActiveTab("items");
      }, 2000);
    } else {
      setFormError(error.message || "Failed to submit lost item report.");
    }
  };

  const handleClaimItem = async (itemId: string, currentStatus: "LOST" | "FOUND" | "CLAIMED") => {
    if (currentStatus === "CLAIMED") return;

    const { error } = await supabase
      .from("lost_items")
      .update({ status: "CLAIMED" })
      .eq("id", itemId);

    if (!error) {
      if (selectedItem?.id === itemId) {
        setSelectedItem((prev) => prev ? { ...prev, status: "CLAIMED" } : null);
      }
      fetchItems();
    }
  };

  // Filter items based on search query
  const filteredItems = lostItems.filter((item) =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.location_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Generate Leaderboard
  const leaderboard: LeaderboardUser[] = Object.values(
    lostItems.reduce((acc: Record<string, LeaderboardUser>, item) => {
      const key = `${item.reporter_name}-${item.reporter_role}`;
      if (!acc[key]) {
        acc[key] = {
          name: item.reporter_name,
          role: item.reporter_role,
          count: 0
        };
      }
      acc[key].count += 1;
      return acc;
    }, {})
  ).sort((a, b) => b.count - a.count);

  // Map markers Translation
  const mapMarkers = filteredItems
    .filter((item) => item.status !== "CLAIMED")
    .map((item) => ({
      id: item.id,
      title: `${item.title} (${item.status})`,
      lat: item.lat,
      lng: item.lng,
      status: item.status === "LOST" ? "HIGH" : "LOW", // High maps to Red/Lost, Low maps to Green/Found
      type: "lost_found" as const
    }));

  return (
    <div className="min-h-screen bg-surface pb-32">
      <Header />

      <main className="max-w-md mx-auto px-margin-mobile pt-6 space-y-6">
        
        {/* Page Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-600 border border-purple-500/20">
            <span className="material-symbols-outlined text-2xl font-bold">
              find_in_page
            </span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-on-surface">Lost & Found</h2>
            <p className="text-xs text-on-surface-variant">Report lost objects or claim verified found assets</p>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex bg-surface-container-lowest p-1 rounded-xl border border-outline-variant/30">
          {(["items", "report", "hall-of-fame"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 text-[11px] font-extrabold rounded-lg transition-all cursor-pointer ${
                activeTab === tab
                  ? "bg-primary text-on-primary shadow-sm"
                  : "text-on-surface-variant hover:text-primary"
              }`}
            >
              {tab === "items" ? "All Items" : tab === "report" ? "Report Item" : "Hall of Fame 🏆"}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "items" && (
            <motion.div
              key="items-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Dynamic map showing lost markers */}
              <div className="w-full h-[260px] rounded-2xl overflow-hidden sacred-shadow border border-outline-variant/20 relative">
                <Map
                  center={userLocation ? [userLocation.lat, userLocation.lng] : [20.0092, 73.7915]}
                  zoom={13}
                  markers={mapMarkers}
                  onMarkerClick={(marker) => {
                    const item = lostItems.find((i) => i.id === marker.id);
                    if (item) setSelectedItem(item);
                  }}
                />
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search bags, keys, wallets, phones..."
                  className="w-full pl-10 pr-4 py-3 bg-surface-container-lowest border border-outline-variant/30 rounded-xl text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary sacred-shadow"
                />
              </div>

              {/* Feed List */}
              <div className="space-y-4">
                <h3 className="text-xs font-extrabold text-on-surface-variant uppercase tracking-wider">
                  Active Reports ({filteredItems.length})
                </h3>

                {filteredItems.length === 0 ? (
                  <div className="text-center py-10 bg-surface-container-lowest border border-outline-variant/20 rounded-2xl text-on-surface-variant space-y-2">
                    <span className="material-symbols-outlined text-4xl block text-outline">
                      info
                    </span>
                    <p className="text-xs font-bold">No Lost or Found items reported yet.</p>
                    <p className="text-[10px] text-outline">Be the first to report found/lost item under Report tab!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredItems.map((item) => {
                      const isLost = item.status === "LOST";
                      const isClaimed = item.status === "CLAIMED";
                      
                      let statusBadge = "bg-red-50 border-red-200 text-red-700";
                      if (item.status === "FOUND") statusBadge = "bg-amber-50 border-amber-200 text-amber-700";
                      if (isClaimed) statusBadge = "bg-green-50 border-green-200 text-green-700";

                      return (
                        <div
                          key={item.id}
                          onClick={() => setSelectedItem(item)}
                          className="p-4 bg-surface-container-lowest border border-outline-variant/30 rounded-xl sacred-shadow hover:border-primary/40 transition-all flex gap-4 items-start cursor-pointer"
                        >
                          <img
                            src={item.image_url || presets["other"]}
                            alt={item.title}
                            className="w-16 h-16 rounded-lg object-cover shrink-0 border border-outline-variant/20"
                          />
                          <div className="flex-1 space-y-1 text-left min-w-0">
                            <div className="flex justify-between items-start gap-2">
                              <h4 className="font-bold text-sm text-on-surface truncate">{item.title}</h4>
                              <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded border shrink-0 ${statusBadge}`}>
                                {item.status}
                              </span>
                            </div>
                            <p className="text-xs text-on-surface-variant line-clamp-1">{item.description}</p>
                            
                            <div className="flex items-center gap-1 text-[10px] text-outline font-bold mt-1">
                              <MapPin size={11} className="text-secondary shrink-0" />
                              <span className="truncate">{item.location_name}</span>
                            </div>

                            <div className="flex items-center gap-1.5 pt-1.5 border-t border-outline-variant/10 mt-1.5 text-[9px] text-primary font-bold">
                              <Award size={12} className="text-primary shrink-0" />
                              <span>By: {item.reporter_name}</span>
                              <span className="bg-purple-100 text-purple-700 px-1 py-0.2 rounded border border-purple-200 text-[8px] uppercase tracking-wide">
                                Conscientious {item.reporter_role}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === "report" && (
            <motion.div
              key="report-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-5 sacred-shadow space-y-4"
            >
              <div className="flex items-center gap-2 text-on-surface font-bold text-sm">
                <PlusCircle size={18} className="text-primary" />
                Report Lost / Found Object
              </div>
              <p className="text-[11px] text-on-surface-variant leading-relaxed">
                Provide details of the item. Other users will view it in real-time. You will earn a **Conscientious Citizen** badge on the community leaderboard.
              </p>

              {formSuccess ? (
                <div className="text-center py-8 space-y-3 bg-green-50 border border-green-200 rounded-xl">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 mx-auto">
                    <CheckCircle2 size={26} />
                  </div>
                  <h4 className="text-sm font-bold text-green-700">Report Successfully Logged!</h4>
                  <p className="text-[10px] text-on-surface-variant px-6">
                    Thank you. Your contribution has updated the Mela tracking map instantly.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleReportSubmit} className="space-y-4 text-left">
                  {formError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex gap-2 text-xs text-red-700 font-semibold">
                      <ShieldAlert size={16} className="shrink-0 mt-0.5" />
                      {formError}
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider">Report Type</label>
                    <div className="grid grid-cols-2 gap-3">
                      {(["LOST", "FOUND"] as const).map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setItemType(type)}
                          className={`py-2 rounded-lg border text-center text-xs font-bold transition-all cursor-pointer ${
                            itemType === type
                              ? "bg-primary border-primary text-on-primary shadow-sm"
                              : "bg-surface-container-low border-outline-variant/30 text-on-surface-variant hover:text-primary"
                          }`}
                        >
                          {type === "LOST" ? "🔴 I Lost Something" : "🟢 I Found Something"}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider">Item Name / Title</label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Leather Wallet, iPhone 14, Skybags Backpack"
                      className="w-full p-2.5 bg-surface-container-low border border-outline-variant/30 rounded-lg text-xs outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider">Description & Contact Info</label>
                    <textarea
                      required
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Specify color, brand, contents, and how to verify ownership. E.g. contains Aadhaar card of Amit Sharma, contact: 9876543210."
                      className="w-full p-2.5 bg-surface-container-low border border-outline-variant/30 rounded-lg text-xs outline-none focus:ring-1 focus:ring-primary focus:border-primary resize-none leading-normal"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider">Location / Ghat Spot</label>
                    <input
                      type="text"
                      required
                      value={locationName}
                      onChange={(e) => setLocationName(e.target.value)}
                      placeholder="e.g. Near Ram Kund changing booths, Tapovan Sector 3"
                      className="w-full p-2.5 bg-surface-container-low border border-outline-variant/30 rounded-lg text-xs outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                    />
                    {userLocation ? (
                      <p className="text-[9px] text-secondary font-bold flex items-center gap-1 mt-0.5">
                        <MapPin size={10} /> Auto-pinning your GPS coordinates: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
                      </p>
                    ) : (
                      <p className="text-[9px] text-amber-600 font-bold flex items-center gap-1 mt-0.5">
                        <ShieldAlert size={10} /> No GPS location shared. Defaulting to Central Mela map location.
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider">Item Image Category</label>
                    <div className="grid grid-cols-3 gap-2">
                      {Object.keys(presets).map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => {
                            setImagePreset(preset);
                            setCustomImageUrl("");
                          }}
                          className={`p-2 rounded-lg border text-center text-[10px] capitalize transition-all cursor-pointer ${
                            imagePreset === preset && !customImageUrl
                              ? "border-primary bg-primary-fixed/20 text-primary font-bold"
                              : "bg-surface-container-low border-outline-variant/20 text-on-surface-variant hover:border-primary/50"
                          }`}
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider">Custom Image URL (Optional)</label>
                    <div className="relative">
                      <ImageIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
                      <input
                        type="url"
                        value={customImageUrl}
                        onChange={(e) => {
                          setCustomImageUrl(e.target.value);
                          setImagePreset("");
                        }}
                        placeholder="https://example.com/item-image.jpg"
                        className="w-full pl-9 pr-3 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-lg text-xs outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-xl bg-primary text-on-primary font-bold text-xs shadow-md hover:bg-primary-container transition-colors cursor-pointer text-center"
                  >
                    Submit Report & Earn Badge
                  </button>
                </form>
              )}
            </motion.div>
          )}

          {activeTab === "hall-of-fame" && (
            <motion.div
              key="hall-of-fame-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Leaderboard intro */}
              <div className="bg-gradient-to-r from-purple-600 to-primary p-5 rounded-2xl text-on-primary-container shadow-md text-center space-y-1.5 border border-purple-500/20 text-white">
                <Award size={32} className="mx-auto text-amber-300 animate-bounce" />
                <h3 className="text-base font-bold">Pilgrim Hall of Fame 🏆</h3>
                <p className="text-[11px] opacity-90 leading-relaxed max-w-xs mx-auto">
                  Honoring the kind-hearted Yatris and Nashikkars who helped locate, report, and secure lost goods during the Simhastha Kumbh Mela.
                </p>
              </div>

              {/* Leaderboard list */}
              <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-4 sacred-shadow space-y-3">
                <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider text-left border-b border-outline-variant/10 pb-2">
                  Top Contributors
                </h4>

                {leaderboard.length === 0 ? (
                  <p className="text-xs text-on-surface-variant text-center py-6">No reported helpers logged yet. Be the first!</p>
                ) : (
                  <div className="divide-y divide-outline-variant/10">
                    {leaderboard.map((member, index) => {
                      const isNashikkar = member.role === "NASHIKKAR";
                      
                      let rankBadge = "bg-surface-container-high text-on-surface";
                      if (index === 0) rankBadge = "bg-amber-100 text-amber-800 border border-amber-300 font-extrabold shadow-sm";
                      if (index === 1) rankBadge = "bg-slate-200 text-slate-800 border border-slate-300 font-extrabold shadow-sm";
                      if (index === 2) rankBadge = "bg-orange-100 text-orange-800 border border-orange-200 font-extrabold shadow-sm";

                      return (
                        <div key={member.name} className="flex items-center justify-between py-3 text-left">
                          <div className="flex items-center gap-3">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${rankBadge}`}>
                              {index + 1}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h5 className="font-bold text-xs text-on-surface">{member.name}</h5>
                                <Heart size={10} className="text-red-500 fill-red-500 shrink-0" />
                              </div>
                              <span className="inline-block mt-0.5 text-[8.5px] font-extrabold text-purple-700 bg-purple-100 border border-purple-200 px-1.5 py-0.2 rounded uppercase tracking-wider">
                                Conscientious {isNashikkar ? "Nashikkar" : "Yatri"} 🏅
                              </span>
                            </div>
                          </div>
                          
                          <div className="text-right shrink-0">
                            <span className="text-[10px] text-outline font-bold">Helped Report:</span>
                            <p className="text-xs font-extrabold text-primary">{member.count} Items</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </main>

      {/* Item Detail Modal */}
      <AnimatePresence>
        {selectedItem && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedItem(null)}
              className="fixed inset-0 bg-black z-[1200]"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm bg-surface rounded-2xl p-6 z-[1300] border border-outline-variant/30 sacred-shadow-lg"
            >
              <div className="flex justify-between items-start mb-4">
                <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border ${
                  selectedItem.status === "LOST"
                    ? "bg-red-50 border-red-200 text-red-700"
                    : selectedItem.status === "FOUND"
                    ? "bg-amber-50 border-amber-200 text-amber-700"
                    : "bg-green-50 border-green-200 text-green-700"
                }`}>
                  {selectedItem.status}
                </span>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center border border-outline-variant/20 hover:bg-surface-container-highest cursor-pointer animate-none"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-4">
                <img
                  src={selectedItem.image_url || presets["other"]}
                  alt={selectedItem.title}
                  className="w-full h-40 object-cover rounded-xl border border-outline-variant/20"
                />

                <div className="text-left">
                  <h3 className="text-lg font-bold text-on-surface">{selectedItem.title}</h3>
                  <p className="text-xs text-on-surface-variant flex items-center gap-1 mt-1 font-bold">
                    <MapPin size={12} className="text-secondary shrink-0" />
                    {selectedItem.location_name}
                  </p>
                </div>

                <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/15 text-left space-y-2">
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    {selectedItem.description}
                  </p>
                  
                  <div className="flex items-center gap-1 text-[9px] text-outline font-bold pt-2 border-t border-outline-variant/10">
                    <span>Reported: {new Date(selectedItem.created_at).toLocaleString()}</span>
                  </div>
                </div>

                <div className="p-3 bg-purple-50 border border-purple-100 rounded-xl flex gap-2.5 text-xs text-left">
                  <Award size={18} className="text-purple-600 shrink-0 mt-0.5 animate-pulse" />
                  <div>
                    <h5 className="font-bold text-purple-700">Citizen Contributor</h5>
                    <p className="text-[10px] text-on-surface-variant mt-0.5 leading-normal">
                      Reported by **{selectedItem.reporter_name}** with **Conscientious {selectedItem.reporter_role} 🏅** badge.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  {selectedItem.status !== "CLAIMED" && (
                    <button
                      onClick={() => handleClaimItem(selectedItem.id, selectedItem.status)}
                      className="flex-1 py-3 rounded-xl bg-primary text-on-primary font-bold text-xs shadow-md hover:bg-primary-container cursor-pointer transition-colors"
                    >
                      Claim / Mark Claimed
                    </button>
                  )}
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${selectedItem.lat},${selectedItem.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-3 rounded-xl border border-primary text-primary font-bold text-center text-xs hover:bg-primary/5 transition-all flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[16px]">navigation</span>
                    Navigate
                  </a>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <Navbar />
    </div>
  );
}
