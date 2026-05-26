"use client";

import { useState, useRef, useEffect } from "react";
import Header from "@/components/Header";
import Navbar from "@/components/Navbar";
import { Send, Bot, User, MapPin } from "lucide-react";

interface Message {
  id: string;
  sender: "ai" | "user";
  text: string;
  timestamp: string;
}

export default function Chatbot() {
  const [mounted, setMounted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "msg-1",
      sender: "ai",
      text: "Pranam! 🙏 I am your AI Kumbh Guide. Ask me about Nashik Simhastha bathing schedules, history, ghat safety, transit routes, or anything about the Kumbh Mela. How may I help you today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const suggestions = [
    "Auspicious bathing dates?",
    "History of Ram Kund?",
    "Where is nearest Bhandara?",
    "How to reach Trimbakeshwar?",
    "Emergency helpline numbers?",
    "Best time to visit ghats?"
  ];

  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [userLocationName, setUserLocationName] = useState<string | null>(null);

  const hotspots = [
    { name: "Ram Kund (Panchavati)", lat: 20.0092, lng: 73.7915 },
    { name: "Trimbakeshwar Temple", lat: 19.9310, lng: 73.5290 },
    { name: "Nashik Railway Station", lat: 19.9975, lng: 73.7898 },
    { name: "Tapovan (Sita Gufa)", lat: 20.0138, lng: 73.7862 },
    { name: "Someshwar Temple", lat: 19.9850, lng: 73.7300 },
    { name: "Muktidham Temple", lat: 19.9970, lng: 73.7820 }
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

  const shareLocation = (silentPrompt = false) => {
    if (!navigator.geolocation) {
      if (!silentPrompt) alert("Geolocation is not supported by your browser");
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        const nearestName = getNearestHotspot(coords.lat, coords.lng);
        setUserLocation(coords);
        setUserLocationName(nearestName);
        localStorage.setItem("kumbh_user_latitude", coords.lat.toString());
        localStorage.setItem("kumbh_user_longitude", coords.lng.toString());
        localStorage.setItem("kumbh_user_location_name", nearestName);
        setLoading(false);
        handleSend(`📍 Sharing live coordinates: ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`, coords);
      },
      (error) => {
        setLoading(false);
        // Display location select instructions directly in chatbot chat log
        setMessages(prev => [
          ...prev,
          {
            id: `ai-loc-prompt-${Date.now()}`,
            sender: "ai",
            text: "🌸 Pranam! I couldn't access your live GPS location. Please select your pilgrim sector from the 'Choose Sector 📍' dropdown above so I can recommend nearby stays and free dining halls!",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }
    );
  };

  useEffect(() => {
    setMounted(true);
    
    // Proactively read location from localStorage
    const lat = localStorage.getItem("kumbh_user_latitude");
    const lng = localStorage.getItem("kumbh_user_longitude");
    const name = localStorage.getItem("kumbh_user_location_name");
    
    if (name) {
      setUserLocationName(name);
    }
    if (lat && lng) {
      const coords = { lat: parseFloat(lat), lng: parseFloat(lng) };
      setUserLocation(coords);
      if (!name) {
        setUserLocationName(`Coordinates: ${parseFloat(lat).toFixed(4)}, ${parseFloat(lng).toFixed(4)}`);
      }
    } else {
      // If not in localStorage, maybe try GPS
      setTimeout(() => {
        shareLocation(true);
      }, 800);
    }
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async (textToSend: string, coordsOverride?: { lat: number; lng: number }) => {
    if (!textToSend.trim() || loading) return;

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      // Send to Gemini API route
      const historyForApi = updatedMessages.slice(-10).map(m => ({
        sender: m.sender,
        text: m.text
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          location: coordsOverride || userLocation,
          history: historyForApi.slice(0, -1) // exclude the last user message since we pass it separately
        })
      });

      const data = await res.json();

      const aiMsg: Message = {
        id: `msg-${Date.now() + 1}`,
        sender: "ai",
        text: data.reply || data.error || "I'm sorry, I couldn't process that request. Please try again.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (error) {
      const errorMsg: Message = {
        id: `msg-${Date.now() + 1}`,
        sender: "ai",
        text: "⚠️ Connection error. Please check your internet and try again. For emergencies, call 112.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface pb-32 flex flex-col h-screen overflow-hidden">
      <Header />

      <main className="flex-1 max-w-md md:max-w-3xl w-full mx-auto px-margin-mobile md:px-6 pt-4 flex flex-col overflow-hidden">
        
        {/* Chat window container */}
        <div className="flex-1 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl sacred-shadow flex flex-col overflow-hidden mb-4">
          
          {/* Header */}
          <div className="bg-primary px-4 py-3 text-on-primary flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <Bot size={18} />
            </div>
            <div className="flex-1">
              <h3 className="text-xs font-bold leading-none">AI Kumbh Guide</h3>
              <span className="text-[9px] text-white/70">Powered by Groq • Llama 3 • Ask anything</span>
            </div>
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" title="Online" />
          </div>

          {/* Location status bar */}
          <div className="bg-surface-container-low px-4 py-2 border-b border-outline-variant/15 flex items-center justify-between text-[10px] text-on-surface-variant font-bold shrink-0">
            <div className="flex items-center gap-1">
              <MapPin size={12} className="text-primary" />
              <span>Location: {userLocationName || (userLocation ? `${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}` : "Not Shared")}</span>
            </div>
            <div className="flex gap-2 items-center">
              <button 
                onClick={() => shareLocation()}
                className="text-primary hover:underline cursor-pointer"
              >
                Get GPS 🛰
              </button>
              <span className="text-outline">|</span>
              <select 
                onChange={(e) => {
                  const val = e.target.value;
                  let coords = { lat: 20.0092, lng: 73.7915 };
                  let name = "Ram Kund (Panchavati)";
                  if (val === "ramkund") {
                    coords = { lat: 20.0092, lng: 73.7915 };
                    name = "Ram Kund (Panchavati)";
                  } else if (val === "trimbak") {
                    coords = { lat: 19.9310, lng: 73.5290 };
                    name = "Trimbakeshwar Temple";
                  } else if (val === "station") {
                    coords = { lat: 19.9975, lng: 73.7898 };
                    name = "Nashik Railway Station";
                  } else if (val === "tapovan") {
                    coords = { lat: 20.0138, lng: 73.7862 };
                    name = "Tapovan (Sita Gufa)";
                  }
                  setUserLocation(coords);
                  setUserLocationName(name);
                  localStorage.setItem("kumbh_user_latitude", coords.lat.toString());
                  localStorage.setItem("kumbh_user_longitude", coords.lng.toString());
                  localStorage.setItem("kumbh_user_location_name", name);
                  handleSend(`📍 I am near ${name}. What is nearby?`, coords);
                }}
                className="bg-transparent border-none text-primary cursor-pointer outline-none font-bold max-w-[100px]"
                defaultValue=""
              >
                <option value="" disabled>Choose Sector 📍</option>
                <option value="ramkund">Ram Kund (Nashik)</option>
                <option value="trimbak">Trimbakeshwar Temple</option>
                <option value="station">Nashik Railway Station</option>
                <option value="tapovan">Tapovan Camp</option>
              </select>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
            {/* Proactive location prompt card */}
            {!userLocation && (
              <div className="p-4 rounded-2xl bg-primary-fixed/20 border border-primary/20 text-xs space-y-3 shadow-sm mb-2">
                <div className="flex items-start gap-2.5">
                  <MapPin size={18} className="text-primary shrink-0 mt-0.5 animate-bounce" />
                  <div>
                    <strong className="text-primary block mb-0.5">Location-Based Suggestions:</strong>
                    <p className="text-on-surface-variant leading-relaxed">
                      Allow GPS access or select a pilgrim sector to let our AI Guide suggest nearby free bhandaras, ashrams, and bathing ghats relative to your position.
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => shareLocation()}
                    disabled={loading}
                    className="px-3.5 py-2 rounded-xl bg-primary text-on-primary font-bold text-[10px] cursor-pointer hover:bg-primary-container transition-all flex-1 shadow-sm text-center"
                  >
                    Share GPS Location 🛰
                  </button>
                  <select
                    onChange={(e) => {
                      const val = e.target.value;
                      let coords = { lat: 20.0092, lng: 73.7915 };
                      let name = "Ram Kund (Panchavati)";
                      if (val === "trimbak") {
                        coords = { lat: 19.9310, lng: 73.5290 };
                        name = "Trimbakeshwar Temple";
                      } else if (val === "station") {
                        coords = { lat: 19.9975, lng: 73.7898 };
                        name = "Nashik Railway Station";
                      } else if (val === "tapovan") {
                        coords = { lat: 20.0138, lng: 73.7862 };
                        name = "Tapovan (Sita Gufa)";
                      }
                      setUserLocation(coords);
                      setUserLocationName(name);
                      localStorage.setItem("kumbh_user_latitude", coords.lat.toString());
                      localStorage.setItem("kumbh_user_longitude", coords.lng.toString());
                      localStorage.setItem("kumbh_user_location_name", name);
                      handleSend(`📍 My location is set near ${name}. What stays and food spots are nearby?`, coords);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface-variant font-bold text-[10px] cursor-pointer hover:bg-surface-container-highest transition-all flex-1 text-center outline-none"
                    defaultValue=""
                  >
                    <option value="" disabled>Choose Sector 📍</option>
                    <option value="ramkund">Ram Kund (Nashik)</option>
                    <option value="trimbak">Trimbakeshwar Temple</option>
                    <option value="station">Nashik Railway Station</option>
                    <option value="tapovan">Tapovan Camp</option>
                  </select>
                </div>
              </div>
            )}

            {messages.map((msg) => {
              const isAi = msg.sender === "ai";
              return (
                <div
                  key={msg.id}
                  className={`flex ${isAi ? "justify-start" : "justify-end"}`}
                >
                  <div className={`flex items-start gap-2.5 max-w-[85%] ${isAi ? "flex-row" : "flex-row-reverse"}`}>
                    <div className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-[10px] font-extrabold ${
                      isAi 
                        ? "bg-primary-fixed text-on-primary-fixed border border-primary/10" 
                        : "bg-surface-container-high text-on-surface-variant border border-outline-variant/20"
                    }`}>
                      {isAi ? <Bot size={14} /> : <User size={14} />}
                    </div>

                    <div className={`p-3 rounded-2xl text-xs leading-relaxed ${
                      isAi 
                        ? "bg-surface-container-high text-on-surface rounded-tl-none border border-outline-variant/10 whitespace-pre-line" 
                        : "bg-primary text-on-primary rounded-tr-none shadow-sm"
                    }`}>
                      {msg.text}
                      <span className={`block text-[8px] text-right mt-1.5 ${isAi ? "text-outline" : "text-white/70"}`}>
                        {mounted ? msg.timestamp : ""}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* AI Typing indicator */}
            {loading && (
              <div className="flex justify-start">
                <div className="flex items-start gap-2.5 max-w-[80%]">
                  <div className="w-7 h-7 rounded-full bg-primary-fixed text-on-primary-fixed border border-primary/10 flex items-center justify-center">
                    <Bot size={14} />
                  </div>
                  <div className="bg-surface-container-high p-3 rounded-2xl rounded-tl-none border border-outline-variant/10 flex items-center gap-1.5 py-4 px-5">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Suggestions */}
          {!loading && messages.length < 4 && (
            <div className="px-4 py-2 border-t border-outline-variant/10 bg-surface-container-low flex gap-2 overflow-x-auto no-scrollbar shrink-0">
              {suggestions.map((sug) => (
                <button
                  key={sug}
                  onClick={() => handleSend(sug)}
                  className="px-3 py-1.5 rounded-full bg-surface-container-lowest border border-outline-variant/25 text-[10px] text-on-surface-variant hover:border-primary/50 transition-colors whitespace-nowrap cursor-pointer shrink-0 font-bold"
                >
                  {sug}
                </button>
              ))}
            </div>
          )}

          {/* Input Panel */}
          <div className="p-3 border-t border-outline-variant/15 bg-surface-container-lowest flex items-center gap-2 shrink-0">
            <button
              onClick={() => shareLocation()}
              disabled={loading}
              title="Share live location for nearby suggestions"
              className="w-9 h-9 rounded-xl bg-secondary text-on-secondary flex items-center justify-center shadow-sm hover:bg-secondary-container cursor-pointer transition-colors active:scale-95 shrink-0 disabled:opacity-50"
            >
              <MapPin size={16} />
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend(input)}
              placeholder="Ask about Kumbh Mela, ghats, routes..."
              disabled={loading}
              className="flex-1 p-2.5 bg-surface-container-low border border-outline-variant/30 rounded-xl text-xs outline-none focus:ring-1 focus:ring-primary focus:border-primary disabled:opacity-50"
            />
            <button
              onClick={() => handleSend(input)}
              disabled={loading || !input.trim()}
              className="w-9 h-9 rounded-xl bg-primary text-on-primary flex items-center justify-center shadow-sm hover:bg-primary-container cursor-pointer transition-colors active:scale-95 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={16} />
            </button>
          </div>

        </div>

      </main>

      <Navbar />
    </div>
  );
}
