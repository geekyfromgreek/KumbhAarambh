"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

import NetflixIntro from "@/components/NetflixIntro";
import LocationPrompt from "@/components/LocationPrompt";

export default function Onboarding() {
  const router = useRouter();
  const { isSignedIn, user } = useUser();
  const [lang, setLang] = useState("en");
  const [showSplash, setShowSplash] = useState(true);

  const [scrollY, setScrollY] = useState(0);



  useEffect(() => {
    // Check if intro has already run in this session
    const hasRun = sessionStorage.getItem("kumbh_intro_run");
    if (hasRun === "true") {
      setShowSplash(false);
    }
  }, []);

  const handleIntroComplete = () => {
    sessionStorage.setItem("kumbh_intro_run", "true");
    setShowSplash(false);
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);



  const handleRoleSelect = (role: "yatri" | "nashikkar") => {
    if (isSignedIn && user) {
      const currentRole = localStorage.getItem("kumbh_role_" + user.id);
      if (role === "yatri") {
        if (currentRole === "NASHIKKAR") {
          alert("You are signed in as a Nashikkar. Please sign out first to log in with a Yatri account.");
          return;
        }
        localStorage.setItem("kumbh_role", "YATRI");
        localStorage.setItem("kumbh_role_" + user.id, "YATRI");
        router.push("/yatri");
      } else {
        if (currentRole === "YATRI") {
          alert("You are signed in as a Yatri. Please sign out first to log in with a Nashikkar account.");
          return;
        }
        localStorage.setItem("kumbh_role", "NASHIKKAR");
        localStorage.setItem("kumbh_role_" + user.id, "NASHIKKAR");
        router.push("/nashikkar");
      }
    } else {
      if (role === "yatri") {
        localStorage.setItem("selected_signup_role", "YATRI");
        router.push("/login");
      } else {
        localStorage.setItem("selected_signup_role", "NASHIKKAR");
        router.push("/login");
      }
    }
  };

  const handleGuestAccess = () => {
    localStorage.setItem("kumbh_guest_session", "true");
    localStorage.setItem("kumbh_role", "YATRI");
    // Set cookie so middleware can read guest status
    document.cookie = "kumbh_guest_session=true; path=/";
    router.push("/yatri");
  };



  const translations = {
    en: {
      title: "KumbhAarambh",
      sub: "कुंभारंभ",
      tagline: "Begin your sacred journey. Navigate with safety and community.",
      yatriTitle: "I am a Yatri",
      yatriSub: "Find stays, check transport, track safe ghats, and alert helpers.",
      nashikkarTitle: "I am a Nashikkar",
      nashikkarSub: "Host pilgrims, report traffic updates, and volunteer locally.",
      guestText: "Explore as Guest",
      guestSub: "Yatri services view-only access",
      quote: `"All pilgrimages repeatedly, Ganga Sagar but once. Kumbh Mela: The nectar of life."`
    },
    hi: {
      title: "कुंभारंभ",
      sub: "KumbhAarambh",
      tagline: "अपनी पवित्र यात्रा की शुरुआत करें। सुरक्षा और समुदाय के साथ मार्गदर्शन पाएं।",
      yatriTitle: "मैं एक यात्री हूँ",
      yatriSub: "आवास खोजें, परिवहन जांचें, सुरक्षित घाट ट्रैक करें और सहायता बुलाएं।",
      nashikkarTitle: "मैं एक नाशिककर हूँ",
      nashikkarSub: "तीर्थयात्रियों की मेजबानी करें, यातायात अपडेट दें और स्वयंसेवा करें।",
      guestText: "अतिथि के रूप में अन्वेषण करें",
      guestSub: "केवल यात्री सेवाओं को देखने की अनुमति",
      quote: `"सब तीर्थ बार बार, गंगासागर एक बार। कुंभ मेला: मोक्ष का मार्ग।"`
    },
    mr: {
      title: "कुंभारंभ",
      sub: "KumbhAarambh",
      tagline: "आपल्या पवित्र यात्रेचा आरंभ करा. सुरक्षा आणि समुदायासोबत प्रवास करा.",
      yatriTitle: "मी एक यात्री आहे",
      yatriSub: "निवास शोधा, वाहतूक तपासा, सुरक्षित घाट ट्रॅक करा आणि मदत बोलवा.",
      nashikkarTitle: "मी एक नाशिककर आहे",
      nashikkarSub: "यात्रींचे आदरातिथ्य करा, वाहतूक अपडेट द्या आणि स्वयंसेवा करा.",
      guestText: "अतिथी म्हणून प्रवेश करा",
      guestSub: "केवळ यात्री सेवा पाहण्याची परवानगी",
      quote: `"सर्व तीर्थ वारंवार, गंगासागर एक वेळ. कुंभमेळा: मुक्तीचे प्रवेशद्वार."`
    }
  };

  const content = translations[lang as "en" | "hi" | "mr"] || translations.en;

  // Parallax Scroll calculations
  // Fade out hero banner as user scrolls down (completed at scrollY = 300)
  const heroScale = Math.max(0.85, 1 - scrollY / 2000);
  const heroOpacity = Math.max(0, 1 - scrollY / 320);
  const heroTranslateY = scrollY * 0.4; // parallax speed

  return (
    <>
      <AnimatePresence mode="wait">
        {showSplash && (
          <NetflixIntro key="netflix-intro" onComplete={handleIntroComplete} />
        )}
      </AnimatePresence>

      <LocationPrompt />

      <div className="min-h-screen flex flex-col items-center justify-center relative overflow-x-hidden bg-surface rangoli-bg">
        {/* Saffron Glow Backing */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-96 rounded-full bg-primary/5 blur-[120px] pointer-events-none z-0" />



        <main className="w-full max-w-xl md:max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-center z-10 p-6 md:p-8 gap-6 md:gap-10 min-h-screen md:min-h-0">
          
          {/* Left Column: Brand Hero and Tagline */}
          <div className="w-full md:w-1/2 flex flex-col items-center md:items-stretch space-y-4 md:space-y-6">
            {/* Parallax pinned Hero section */}
            <div 
              style={{
                transform: `scale(${heroScale}) translateY(${heroTranslateY}px)`,
                opacity: heroOpacity,
                transition: "transform 0.1s ease-out, opacity 0.1s ease-out"
              }}
              className="w-full h-56 md:h-80 relative rounded-b-[2.5rem] md:rounded-[2rem] overflow-hidden border border-outline-variant/35 shadow-xl select-none"
            >
              <Image
                src="/images/kumbh-hero.png"
                alt="Nashik Godavari Ghat sunset"
                fill
                priority
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/40 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-secondary/15" />
              
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center text-center space-y-1 w-full px-6">
                <div className="w-14 h-14 md:w-16 md:h-16 bg-surface-container-lowest/90 backdrop-blur-md rounded-full flex items-center justify-center border-2 border-primary/20 shadow-lg">
                  <span className="material-symbols-outlined text-3xl md:text-4xl text-primary font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>
                    local_fire_department
                  </span>
                </div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-primary tracking-tight font-sans drop-shadow-md">
                  {content.title}
                </h1>
                <h2 className="text-xs md:text-sm font-extrabold text-secondary tracking-widest uppercase">{content.sub}</h2>
              </div>
            </div>

            {/* Tagline & Divider */}
            <div className="text-center md:text-left space-y-3">
              <p className="text-xs md:text-sm text-on-surface-variant font-bold max-w-sm mx-auto md:mx-0 leading-relaxed">
                {content.tagline}
              </p>
              {/* Saffron Flower Divider */}
              <div className="w-full marigold-divider py-0.5 flex justify-center md:justify-start">
                <span className="material-symbols-outlined text-tertiary-fixed-dim text-xl md:text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  local_florist
                </span>
              </div>
            </div>

            {/* Language Selection (Desktop layout) */}
            <div className="hidden md:flex justify-start">
              <div className="flex items-center gap-2.5 bg-surface-container-high/50 backdrop-blur-md p-1 rounded-full border border-outline-variant/15">
                {[
                  { id: "hi", label: "हिंदी" },
                  { id: "en", label: "English" },
                  { id: "mr", label: "मराठी" }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setLang(item.id)}
                    className={`px-4 py-1 rounded-full text-[10px] font-extrabold transition-all cursor-pointer ${
                      lang === item.id
                        ? "bg-primary-container text-on-primary-container shadow-md scale-105"
                        : "text-on-surface-variant hover:text-primary"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Role selection cards & options */}
          <div className="w-full md:w-1/2 flex flex-col justify-center space-y-5">
            {/* 3D perspective Role grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-4 md:gap-5 perspective-1000">
              
              {/* Yatri Pilgrim Card */}
              <button
                onClick={() => handleRoleSelect("yatri")}
                className="group relative text-left bg-surface-container-lowest/80 backdrop-blur-md rounded-2xl p-5 flex flex-col justify-between border border-outline-variant/35 hover:border-primary/80 sacred-shadow hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer min-h-[160px] md:min-h-[150px]"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary-fixed/20 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                
                <div className="transform-style-3d flex flex-col justify-between h-full w-full">
                  <div className="translate-z-20 w-10 h-10 rounded-xl bg-primary-fixed flex items-center justify-center text-primary mb-4 border border-primary/10 shadow-sm">
                    <span className="material-symbols-outlined text-xl font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>
                      hiking
                    </span>
                  </div>
                  
                  <div className="translate-z-10">
                    <h3 className="text-base font-bold text-primary mb-1 flex items-center gap-1">
                      {content.yatriTitle}
                      <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">
                        arrow_forward
                      </span>
                    </h3>
                    <p className="text-[10px] md:text-[11px] text-on-surface-variant leading-relaxed font-medium">
                      {content.yatriSub}
                    </p>
                  </div>
                </div>
              </button>

              {/* Nashikkar Host Card */}
              <button
                onClick={() => handleRoleSelect("nashikkar")}
                className="group relative text-left bg-surface-container-lowest/80 backdrop-blur-md rounded-2xl p-5 flex flex-col justify-between border border-outline-variant/35 hover:border-secondary/80 sacred-shadow hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-secondary cursor-pointer min-h-[160px] md:min-h-[150px]"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-secondary-fixed/20 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                
                <div className="transform-style-3d flex flex-col justify-between h-full w-full">
                  <div className="translate-z-20 w-10 h-10 rounded-xl bg-secondary-fixed flex items-center justify-center text-secondary mb-4 border border-secondary/10 shadow-sm">
                    <span className="material-symbols-outlined text-xl font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>
                      location_on
                    </span>
                  </div>
                  
                  <div className="translate-z-10">
                    <h3 className="text-base font-bold text-secondary mb-1 flex items-center gap-1">
                      {content.nashikkarTitle}
                      <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">
                        arrow_forward
                      </span>
                    </h3>
                    <p className="text-[10px] md:text-[11px] text-on-surface-variant leading-relaxed font-medium">
                      {content.nashikkarSub}
                    </p>
                  </div>
                </div>
              </button>

            </div>

            {/* Guest options & Quote */}
            <div className="w-full flex flex-col items-center space-y-4 pt-1">
              <button
                onClick={handleGuestAccess}
                className="w-full py-2.5 px-5 rounded-2xl bg-surface-container-high/80 backdrop-blur-md border border-outline-variant/40 hover:border-primary/50 text-center transition-all duration-300 shadow-md focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer hover:bg-surface-container-highest group"
              >
                <div className="flex items-center justify-center gap-2.5">
                  <span className="material-symbols-outlined text-primary group-hover:rotate-12 transition-transform text-lg">
                    account_circle
                  </span>
                  <div className="text-left">
                    <div className="text-xs font-bold text-primary group-hover:text-primary-container transition-colors">
                      {content.guestText}
                    </div>
                    <div className="text-[9px] text-on-surface-variant">
                      {content.guestSub}
                    </div>
                  </div>
                </div>
              </button>

              {/* Language Selection (Mobile layout only) */}
              <div className="flex md:hidden items-center gap-2 bg-surface-container-high/50 backdrop-blur-md p-1 rounded-full border border-outline-variant/15">
                {[
                  { id: "hi", label: "हिंदी" },
                  { id: "en", label: "English" },
                  { id: "mr", label: "मराठी" }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setLang(item.id)}
                    className={`px-3 py-1 rounded-full text-[10px] font-extrabold transition-all cursor-pointer ${
                      lang === item.id
                        ? "bg-primary-container text-on-primary-container shadow-md scale-105"
                        : "text-on-surface-variant hover:text-primary"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Quote Block */}
              <div className="text-center px-4 max-w-sm">
                <p className="text-[10px] text-outline italic leading-relaxed">
                  {content.quote}
                </p>
              </div>
            </div>

          </div>

        </main>
      </div>
    </>
  );
}
