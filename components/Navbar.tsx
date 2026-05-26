"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    setRole(localStorage.getItem("kumbh_role"));
  }, []);

  // Only render bottom nav for Yatri role
  if (role !== "YATRI") return null;

  const navItems = [
    { label: "Home", icon: "home", route: "/yatri" },
    { label: "Stays", icon: "hotel", route: "/yatri/stays" },
    { label: "SOS", icon: "sos", route: "/yatri/sos", isSos: true },
    { label: "Food", icon: "local_dining", route: "/yatri/food" },
    { label: "AI Guide", icon: "forum", route: "/yatri/chatbot" }
  ];

  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[1100] w-[90%] max-w-md px-4 py-2.5 rounded-2xl glass-panel border border-outline-variant/20 sacred-shadow-lg flex items-center justify-around">
      {navItems.map((item) => {
        const isActive = pathname === item.route;
        
        if (item.isSos) {
          return (
            <button
              key={item.label}
              onClick={() => router.push(item.route)}
              className="relative -top-5 w-14 h-14 rounded-full bg-error text-on-error flex items-center justify-center border-4 border-surface shadow-[0_0_20px_rgba(186,26,26,0.4)] hover:shadow-[0_0_25px_rgba(186,26,26,0.6)] hover:scale-105 active:scale-95 transition-all cursor-pointer group"
            >
              <div className="absolute inset-0 rounded-full bg-error animate-ping opacity-25 group-hover:opacity-40" />
              <span className="material-symbols-outlined text-2xl font-bold text-white z-10" style={{ fontVariationSettings: "'FILL' 1" }}>
                location_on
              </span>
            </button>
          );
        }

        return (
          <button
            key={item.label}
            onClick={() => router.push(item.route)}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer ${
              isActive 
                ? "text-primary scale-105 font-bold bg-primary-fixed/30" 
                : "text-on-surface-variant hover:text-primary"
            }`}
          >
            <span 
              className="material-symbols-outlined text-xl"
              style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
            >
              {item.icon}
            </span>
            <span className="text-[10px] tracking-wide font-medium">
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
