"use client";

import { useEffect, useState } from "react";

interface Kalash3DProps {
  size?: number;
}

export default function Kalash3D({ size = 120 }: Kalash3DProps) {
  const [isLite, setIsLite] = useState(false);
  const [hoverAngle, setHoverAngle] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const perf = localStorage.getItem("kumbh_performance");
    setIsLite(perf === "lite");

    const handlePerfChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      setIsLite(customEvent.detail === "lite");
    };

    window.addEventListener("kumbh-performance-changed", handlePerfChange);
    return () => {
      window.removeEventListener("kumbh-performance-changed", handlePerfChange);
    };
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isLite) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    setHoverAngle((x / (rect.width / 2)) * 45); // Tilt up to 45 degrees
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setHoverAngle(0);
      }}
      style={{ width: size, height: size }}
      className="relative flex items-center justify-center perspective-1000 select-none cursor-pointer"
    >
      <div
        style={{
          transform: !isLite && isHovered ? `rotateY(${hoverAngle}deg)` : "none",
          transformStyle: "preserve-3d",
          transition: "transform 0.15s ease-out"
        }}
        className={`relative w-full h-full flex flex-col items-center justify-center ${
          !isLite && !isHovered ? "animate-[spin-y_12s_linear_infinite]" : ""
        }`}
      >
        {/* Layer 1: Coconut and mango leaves (Top) */}
        <div 
          className="absolute transform-style-3d translate-z-30" 
          style={{ top: "10%", transform: "translateZ(30px)" }}
        >
          <svg width={size * 0.4} height={size * 0.4} viewBox="0 0 40 40" className="drop-shadow-md">
            {/* Mango Leaves */}
            <path d="M12 28 C15 15, 20 8, 20 2 C20 8, 25 15, 28 28 Z" fill="#2e7d32" />
            <path d="M5 26 C12 18, 18 12, 20 2 C18 12, 12 18, 5 26 Z" fill="#1b5e20" opacity="0.8" />
            <path d="M35 26 C28 18, 22 12, 20 2 C22 12, 28 18, 35 26 Z" fill="#1b5e20" opacity="0.8" />
            {/* Coconut */}
            <ellipse cx="20" cy="28" rx="8" ry="10" fill="#5d4037" />
            <path d="M20 18 L20 38" stroke="#3e2723" strokeWidth="1" />
          </svg>
        </div>

        {/* Layer 2: The Golden Pot (Kalash Body - Center) */}
        <div 
          className="absolute transform-style-3d translate-z-10" 
          style={{ top: "35%", transform: "translateZ(10px)" }}
        >
          <svg width={size * 0.65} height={size * 0.5} viewBox="0 0 65 50" className="drop-shadow-[0_6px_10px_rgba(246,190,57,0.35)]">
            {/* Kalash Neck rim */}
            <ellipse cx="32.5" cy="10" rx="18" ry="4" fill="#fbc02d" stroke="#f57f17" strokeWidth="1.5" />
            {/* Kalash Pot Body */}
            <path d="M14.5 12 C14.5 12, 5 22, 5 32 C5 44, 20 46, 32.5 46 C45 46, 60 44, 60 32 C60 22, 50.5 12, 50.5 12 Z" fill="url(#gold-gradient)" />
            {/* Sacred Swastik / Tilak outline */}
            <path d="M32.5 18 L32.5 36 M23.5 27 L41.5 27 M23.5 18 L23.5 27 M41.5 27 L41.5 36" stroke="#ba1a1a" strokeWidth="2.5" strokeLinecap="round" opacity="0.85" />
            {/* Swastik hook dots */}
            <circle cx="28" cy="22.5" r="1.2" fill="#ba1a1a" />
            <circle cx="37" cy="22.5" r="1.2" fill="#ba1a1a" />
            <circle cx="28" cy="31.5" r="1.2" fill="#ba1a1a" />
            <circle cx="37" cy="31.5" r="1.2" fill="#ba1a1a" />
            
            <defs>
              <linearGradient id="gold-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fff9c4" />
                <stop offset="35%" stopColor="#fbc02d" />
                <stop offset="70%" stopColor="#f57f17" />
                <stop offset="100%" stopColor="#e65100" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Layer 3: Holy Thread (Mauli) & Base Stand (Bottom) */}
        <div 
          className="absolute transform-style-3d translate-z-0" 
          style={{ bottom: "5%", transform: "translateZ(0px)" }}
        >
          <svg width={size * 0.45} height={size * 0.2} viewBox="0 0 45 20">
            {/* Stand base plate */}
            <path d="M4 10 C4 10, 0 16, 0 18 C0 20, 45 20, 45 18 C45 16, 41 10, 41 10 Z" fill="#d84315" stroke="#bf360c" strokeWidth="1" />
            {/* Thread detail */}
            <ellipse cx="22.5" cy="5" rx="14" ry="2" fill="none" stroke="#ba1a1a" strokeWidth="1.5" />
          </svg>
        </div>

      </div>

      {/* Embedded Spin Animation keyframes style tag */}
      <style jsx global>{`
        @keyframes spin-y {
          from { transform: rotateY(0deg); }
          to { transform: rotateY(360deg); }
        }
      `}</style>
    </div>
  );
}
