"use client";

import { useEffect, useState } from "react";

interface Diya3DProps {
  size?: number;
}

export default function Diya3D({ size = 80 }: Diya3DProps) {
  const [isLite, setIsLite] = useState(false);

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

  return (
    <div
      style={{ 
        width: size, 
        height: size * 1.1,
        animation: !isLite ? "float-bounce 4s ease-in-out infinite" : "none"
      }}
      className="relative flex flex-col items-center justify-center select-none pointer-events-none"
    >
      {/* Layer 1: Flame & Glow aura */}
      <div className="absolute top-1 flex flex-col items-center justify-center">
        {/* Glow halo */}
        {!isLite && (
          <div className="absolute w-12 h-12 bg-amber-500/20 rounded-full blur-md animate-pulse" />
        )}
        
        {/* Flame SVG */}
        <svg 
          width={size * 0.25} 
          height={size * 0.45} 
          viewBox="0 0 20 36"
          style={{
            animation: !isLite ? "flame-flicker 0.12s ease-in-out infinite alternate" : "none",
            transformOrigin: "bottom center"
          }}
        >
          {/* Flame outer core */}
          <path d="M10 0 C16 12, 18 22, 18 28 C18 33.5, 14.5 36, 10 36 C5.5 36, 2 33.5, 2 28 C2 22, 4 12, 10 0 Z" fill="url(#flame-outer)" />
          {/* Flame inner hot core */}
          <path d="M10 10 C14 18, 15 24, 15 28 C15 31, 12.5 33, 10 33 C7.5 33, 5 31, 5 28 C5 24, 6 18, 10 10 Z" fill="url(#flame-inner)" />
          
          <defs>
            <linearGradient id="flame-outer" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ff5722" />
              <stop offset="50%" stopColor="#ff9100" />
              <stop offset="100%" stopColor="#ffcc00" stopOpacity="0.2" />
            </linearGradient>
            <linearGradient id="flame-inner" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffff00" />
              <stop offset="100%" stopColor="#ff9100" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Layer 2: Clay Pot (Diya Cup) */}
      <div className="absolute bottom-2">
        <svg 
          width={size} 
          height={size * 0.5} 
          viewBox="0 0 80 40" 
          className="drop-shadow-[0_8px_16px_rgba(163,56,0,0.2)]"
        >
          {/* Back rim */}
          <ellipse cx="40" cy="12" rx="35" ry="6" fill="#8d4f2f" stroke="#5c2e16" strokeWidth="1" />
          
          {/* Liquid Ghee inside */}
          <ellipse cx="40" cy="14" rx="31" ry="4.5" fill="#ffd54f" opacity="0.9" />
          
          {/* Clay Diya Body */}
          <path d="M5 12 C5 12, 2 28, 40 38 C78 28, 75 12, 75 12 C75 12, 79 7, 75 5 C69 3, 58 10, 40 10 C22 10, 11 3, 5 5 C1 7, 5 12, 5 12 Z" fill="url(#clay-gradient)" />
          
          {/* Front wick details */}
          <path d="M40 8 L40 14" stroke="#ffeb3b" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="40" cy="8" r="1.5" fill="#f44336" />
          
          <defs>
            <linearGradient id="clay-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a75d37" />
              <stop offset="40%" stopColor="#8d4f2f" />
              <stop offset="100%" stopColor="#5d321b" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Embed Keyframe animations */}
      <style jsx global>{`
        @keyframes float-bounce {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes flame-flicker {
          0% { transform: scale(0.95) rotate(-1deg); }
          100% { transform: scale(1.05) rotate(1deg); }
        }
      `}</style>
    </div>
  );
}
