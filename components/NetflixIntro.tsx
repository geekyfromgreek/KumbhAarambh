"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

interface NetflixIntroProps {
  onComplete: () => void;
}

export default function NetflixIntro({ onComplete }: NetflixIntroProps) {
  const [step, setStep] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [particleConfig, setParticleConfig] = useState<{ x: string; scale: number; duration: number; delay: number }[]>([]);

  useEffect(() => {
    setMounted(true);
    
    // Detect screen width
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);

    // Generate particles
    const configs = Array.from({ length: 30 }).map(() => ({
      x: `${Math.random() * 100}vw`,
      scale: Math.random() * 0.5 + 0.5,
      duration: Math.random() * 3 + 3,
      delay: Math.random() * 2
    }));
    setParticleConfig(configs);

    // Timeline phases
    const timer1 = setTimeout(() => setStep(1), 600);   // Fade in the background scene (zooming)
    const timer2 = setTimeout(() => setStep(2), 1600);  // Reveal the title & subtitle with a glow
    const timer3 = setTimeout(() => setStep(3), 3800);  // Begin fast zoom out transition
    const timer4 = setTimeout(() => {
      onComplete();
    }, 4600);

    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ 
        opacity: 0,
        filter: "blur(8px)",
        transition: { duration: 0.8, ease: "easeInOut" } 
      }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-between bg-black overflow-hidden select-none"
    >
      {/* 1. Cinematic Background Image with slow zoom */}
      <AnimatePresence>
        {step >= 1 && (
          <motion.div
            initial={{ opacity: 0, scale: 1.0 }}
            animate={{ 
              opacity: 1, 
              scale: 1.08,
              transition: { 
                opacity: { duration: 1.5, ease: "easeOut" },
                scale: { duration: 4.5, ease: "linear" } 
              }
            }}
            className="absolute inset-0 w-full h-full z-0"
          >
            <Image
              src={isMobile ? "/images/namaskar_intro_bg_mobile.jpg" : "/images/namaskar_intro_bg_pc.jpg"}
              alt="Kumbh Mela Namaskar Intro"
              fill
              priority
              className={`${
                isMobile ? "object-contain" : "object-cover"
              } object-center filter contrast-[1.04] brightness-[1.02] saturate-[1.03]`}
            />
            {/* Vignette & Gradients to make the center woman stand out and frame the bottom text */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-black/20 z-10" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0)_40%,rgba(0,0,0,0.75)_100%)] z-10" />
            {/* Soft saffron/golden light leak overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-transparent to-orange-500/10 z-10 pointer-events-none" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Saffron Energy Beam (Initial sound visual trigger) */}
      <AnimatePresence>
        {step === 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "300px", opacity: [0, 1, 0.5, 1] }}
            exit={{ width: "300px", opacity: 0, transition: { duration: 0.4 } }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[4px] bg-gradient-to-b from-transparent via-amber-500 to-transparent shadow-[0_0_20px_rgba(249,115,22,0.9)] z-20"
          />
        )}
      </AnimatePresence>

      {/* 3. Floating Sacred Sparkles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-20">
        {mounted && particleConfig.map((config, i) => (
          <motion.div
            key={i}
            initial={{ 
              opacity: 0, 
              y: "110vh", 
              x: config.x,
              scale: config.scale 
            }}
            animate={step >= 1 ? { 
              opacity: [0, 0.8, 0], 
              y: "-10vh",
              transition: { 
                duration: config.duration, 
                repeat: Infinity,
                delay: config.delay 
              } 
            } : {}}
            className="absolute w-2 h-2 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 blur-[0.8px]"
          />
        ))}
      </div>

      {/* Spacer to push title down */}
      <div className="flex-1" />

      {/* 4. App Name Overlay at the bottom */}
      <div className="w-full max-w-xl px-6 pb-16 z-30 flex flex-col items-center text-center">
        <AnimatePresence>
          {step >= 2 && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ 
                opacity: 1, 
                y: 0,
                transition: { duration: 1.0, ease: [0.16, 1, 0.3, 1] } 
              }}
              className="space-y-1.5"
            >
              {/* App Name with premium neon-saffron glow and letter spacing expansion */}
              <motion.h1 
                initial={{ letterSpacing: "0.15em" }}
                animate={{ 
                  letterSpacing: "0.28em",
                  textShadow: [
                    "0 0 10px rgba(249,115,22,0.4)", 
                    "0 0 25px rgba(249,115,22,0.8)", 
                    "0 0 15px rgba(249,115,22,0.5)"
                  ],
                  transition: { duration: 3.0, ease: "easeOut" }
                }}
                className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 uppercase font-sans tracking-widest filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]"
              >
                KumbhAarambh
              </motion.h1>

              {/* Devotional Subtitle */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ 
                  opacity: 0.9,
                  transition: { delay: 0.4, duration: 1.0 } 
                }}
                className="text-[12px] md:text-sm font-extrabold text-amber-400/90 tracking-[0.5em] uppercase font-sans filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]"
              >
                कुंभारंभ
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
