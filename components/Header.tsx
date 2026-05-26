"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useClerk, useUser } from "@clerk/nextjs";
import { LogOut } from "lucide-react";

export default function Header() {
  const router = useRouter();
  const { signOut } = useClerk();
  const { isSignedIn, user } = useUser();
  const [role, setRole] = useState<string | null>(null);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    const localRole = localStorage.getItem("kumbh_role");
    const localGuest = localStorage.getItem("kumbh_guest_session");
    setRole(localRole);
    setIsGuest(localGuest === "true");
  }, []);

  const handleLogout = async () => {
    // Clear local storage
    localStorage.removeItem("kumbh_guest_session");
    localStorage.removeItem("kumbh_role");
    // Clear cookies
    document.cookie = "kumbh_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    document.cookie = "kumbh_guest_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";

    if (isSignedIn) {
      // Use Clerk sign out
      await signOut({ redirectUrl: "/" });
    } else {
      router.push("/");
    }
  };

  // Determine display name
  const displayName = isSignedIn && user
    ? user.firstName || user.emailAddresses?.[0]?.emailAddress?.split("@")[0] || "User"
    : null;

  return (
    <header className="sticky top-0 z-50 w-full px-6 py-4 flex items-center justify-between glass-panel sacred-shadow border-b border-outline-variant/10">
      <div className="flex items-center gap-3">
        <div 
          onClick={() => router.push(role === "NASHIKKAR" ? "/nashikkar" : "/yatri")}
          className="w-10 h-10 bg-primary-fixed rounded-full flex items-center justify-center border border-primary/20 cursor-pointer"
        >
          <span className="material-symbols-outlined text-2xl text-primary font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>
            local_fire_department
          </span>
        </div>
        <div>
          <h1 
            onClick={() => router.push(role === "NASHIKKAR" ? "/nashikkar" : "/yatri")}
            className="text-sm sm:text-lg font-bold text-primary tracking-tight cursor-pointer"
          >
            KumbhAarambh
          </h1>
          <span className="text-[9px] sm:text-[10px] text-secondary font-medium tracking-wider uppercase block -mt-0.5">
            नाशिक कुंभमेळा
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* User Name Badge (Clerk authenticated) */}
        {isSignedIn && displayName && (
          <div className="hidden sm:flex px-3 py-1 rounded-full text-[10px] font-extrabold items-center gap-1.5 border tracking-wider bg-primary-fixed/50 text-primary border-primary/20">
            <span className="material-symbols-outlined text-sm font-bold">person</span>
            {displayName}
          </div>
        )}

        {/* Role Badge */}
        {role && (
          <div className={`px-2 sm:px-3 py-1 rounded-full text-[10px] font-extrabold flex items-center gap-1 sm:gap-1.5 border tracking-wider uppercase shadow-sm ${
            role === "NASHIKKAR" 
              ? "bg-secondary-fixed text-on-secondary-fixed border-secondary/20"
              : isGuest
              ? "bg-surface-container-high text-on-surface-variant border-outline-variant/30"
              : "bg-primary-fixed text-on-primary-fixed border-primary/20"
          }`}>
            <span className="material-symbols-outlined text-sm font-bold">
              {role === "NASHIKKAR" ? "volunteer_activism" : isGuest ? "visibility" : "badge"}
            </span>
            <span className="hidden sm:inline">
              {role === "NASHIKKAR" ? "Nashikkar Volunteer" : isGuest ? "Guest Yatri" : "Yatri pilgrim"}
            </span>
            <span className="inline sm:hidden text-[8px]">
              {role === "NASHIKKAR" ? "Host" : isGuest ? "Guest" : "Yatri"}
            </span>
          </div>
        )}



        {/* SOS Shortcut (only for Yatris) */}
        {role === "YATRI" && (
          <button 
            onClick={() => router.push("/yatri/sos")}
            className="w-8 h-8 rounded-full bg-error-container text-on-error-container flex items-center justify-center hover:scale-105 transition-transform border border-error/20 cursor-pointer animate-pulse"
          >
            <span className="material-symbols-outlined text-base font-bold">sos</span>
          </button>
        )}

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-8 h-8 rounded-full bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest flex items-center justify-center border border-outline-variant/20 hover:text-primary transition-colors cursor-pointer"
          title="Sign Out"
        >
          <LogOut size={14} />
        </button>
      </div>
    </header>
  );
}
