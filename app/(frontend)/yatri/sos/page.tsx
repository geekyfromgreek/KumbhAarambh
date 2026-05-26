"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Navbar from "@/components/Navbar";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, AlertOctagon, HeartHandshake, PhoneCall, ShieldAlert, X } from "lucide-react";

export default function EmergencySos() {
  const [triggering, setTriggering] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [sosActive, setSosActive] = useState(false);
  const [sosSuccess, setSosSuccess] = useState(false);
  
  // SOS Input fields
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  
  // Simulated sound trigger
  const playAlertSound = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime); // High pitched beep
      gain.gain.setValueAtTime(0.5, ctx.currentTime);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      setTimeout(() => osc.stop(), 500);
    } catch (e) {
      console.warn("AudioContext block by browser autoplay policy");
    }
  };

  useEffect(() => {
    let interval: any;
    if (triggering && countdown > 0) {
      interval = setInterval(() => {
        playAlertSound();
        setCountdown((c) => c - 1);
      }, 1000);
    } else if (triggering && countdown === 0) {
      setTriggering(false);
      setSosActive(true);
      
      // Simulate database trigger
      const mockSos = {
        name: contactName || "Guest Pilgrim",
        phone: contactPhone || "N/A",
        lat: 20.0092,
        lng: 73.7915,
        timestamp: new Date().toLocaleTimeString()
      };
      
      // Save locally to simulate alert push to Nashikkar Dashboard
      const currentAlerts = JSON.parse(localStorage.getItem("kumbh_sos_alerts") || "[]");
      localStorage.setItem("kumbh_sos_alerts", JSON.stringify([mockSos, ...currentAlerts]));
      
      setSosSuccess(true);
    }
    return () => clearInterval(interval);
  }, [triggering, countdown]);

  const handleStartTrigger = (e: React.FormEvent) => {
    e.preventDefault();
    setCountdown(3);
    setTriggering(true);
  };

  const handleCancel = () => {
    setTriggering(false);
    setSosActive(false);
    setSosSuccess(false);
  };

  return (
    <div className="min-h-screen bg-surface pb-32">
      <Header />

      <main className="max-w-md mx-auto px-margin-mobile pt-6 space-y-6">
        
        {/* Page Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-error-container rounded-xl flex items-center justify-center text-error border border-error/20">
            <span className="material-symbols-outlined text-2xl font-bold animate-pulse">
              emergency_share
            </span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-on-surface">Emergency SOS</h2>
            <p className="text-xs text-on-surface-variant">Instant pilgrim distress signal & police helper dispatch</p>
          </div>
        </div>

        {/* SOS Console Card */}
        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-6 sacred-shadow-error flex flex-col items-center justify-center text-center space-y-6">
          
          <AnimatePresence mode="wait">
            {!triggering && !sosSuccess ? (
              <motion.div 
                key="idle-form"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="w-full space-y-4"
              >
                <div className="w-20 h-20 bg-error-container/30 border border-error/20 rounded-full flex items-center justify-center text-error mx-auto shadow-md">
                  <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                    shield_alert
                  </span>
                </div>
                
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-on-surface">Send Distress Signal</h3>
                  <p className="text-xs text-on-surface-variant max-w-xs mx-auto leading-relaxed">
                    Tap the button below in case of medical crisis, lost family members, or immediate physical threat. Local police desks and emergency volunteers will be signaled.
                  </p>
                </div>

                <form onSubmit={handleStartTrigger} className="space-y-3 pt-2 text-left">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase">Your Name (Optional)</label>
                    <input
                      type="text"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="e.g. Ramesh Kumar"
                      className="w-full p-2.5 bg-surface-container-low border border-outline-variant/30 rounded-lg text-xs outline-none focus:ring-1 focus:ring-error"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase">Contact Phone (Required for callback)</label>
                    <input
                      type="tel"
                      required
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="e.g. +91 98765 43210"
                      className="w-full p-2.5 bg-surface-container-low border border-outline-variant/30 rounded-lg text-xs outline-none focus:ring-1 focus:ring-error"
                    />
                  </div>

                  {/* Main Trigger Button */}
                  <button
                    type="submit"
                    className="w-full py-4 mt-2 rounded-xl bg-error text-on-error font-extrabold text-sm shadow-[0_0_20px_rgba(186,26,26,0.3)] hover:bg-red-700 transition-colors cursor-pointer text-center"
                  >
                    ACTIVATE SOS
                  </button>
                </form>
              </motion.div>
            ) : triggering ? (
              <motion.div 
                key="triggering-countdown"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="py-6 space-y-6"
              >
                <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full bg-error animate-ping opacity-35" />
                  <div className="w-24 h-24 rounded-full bg-error text-on-error flex items-center justify-center font-extrabold text-4xl shadow-lg border border-red-500">
                    {countdown}
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-base font-extrabold text-error animate-pulse">TRIGGERING EMERGENCY SIGNAL...</h3>
                  <p className="text-xs text-on-surface-variant max-w-xs mx-auto leading-relaxed">
                    Broadcasting location data <strong>[20.0092, 73.7915]</strong> to the nearest pilgrim volunteer team. Press cancel below if this is a mistake.
                  </p>
                </div>

                <button
                  onClick={handleCancel}
                  className="px-6 py-2.5 rounded-lg bg-surface-container-high border border-outline-variant/30 hover:bg-surface-container-highest transition-colors cursor-pointer text-xs font-bold text-on-surface-variant flex items-center gap-1.5 mx-auto"
                >
                  <X size={14} /> Cancel Trigger
                </button>
              </motion.div>
            ) : (
              <motion.div 
                key="sos-confirmed"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="py-6 space-y-6 w-full"
              >
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 mx-auto border border-green-200 shadow-md">
                  <span className="material-symbols-outlined text-4xl font-bold">
                    done_all
                  </span>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-green-700">SOS Active & Dispatched</h3>
                  <p className="text-xs text-on-surface-variant max-w-xs mx-auto leading-relaxed">
                    Rescue alert registered under pilgrim name <strong>{contactName || "Guest pilgrim"}</strong>. A local volunteer team has been notified. Keep your phone line active.
                  </p>
                </div>

                <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/10 text-left text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="font-bold text-outline">Distress Code:</span>
                    <strong className="text-error">SOS-{Math.floor(Math.random() * 90000 + 10000)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold text-outline">GPS Location:</span>
                    <strong className="text-on-surface">Panchavati Sector, Ram Kund</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold text-outline">Response status:</span>
                    <span className="text-secondary font-extrabold animate-pulse">Team Dispatched</span>
                  </div>
                </div>

                <button
                  onClick={handleCancel}
                  className="w-full py-3 rounded-xl bg-surface-container-high border border-outline-variant/30 text-xs font-bold text-on-surface hover:bg-surface-container-highest cursor-pointer"
                >
                  Clear Distress Signal
                </button>
              </motion.div>
            )}
          </AnimatePresence>

        </div>

        {/* Helplines Quick Call list */}
        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-5 sacred-shadow space-y-4">
          <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
            <PhoneCall size={16} className="text-primary" />
            Simhastha Emergency Helplines
          </h3>

          <div className="grid grid-cols-1 gap-3">
            {[
              { label: "Kumbh Central Control Room", num: "1912", sub: "General pilgrim guidance & missing logs" },
              { label: "Ambulance & Medical Desk", num: "108", sub: "Direct dispatch to nearest camp clinic" },
              { label: "Nashik City Police Control", num: "112", sub: "Emergency police helpline" }
            ].map((helpline) => (
              <a
                key={helpline.num}
                href={`tel:${helpline.num}`}
                className="p-3 bg-surface-container-low border border-outline-variant/10 rounded-xl flex items-center justify-between hover:border-primary/50 transition-colors cursor-pointer group"
              >
                <div>
                  <h4 className="text-xs font-bold text-on-surface group-hover:text-primary transition-colors">
                    {helpline.label}
                  </h4>
                  <p className="text-[10px] text-on-surface-variant mt-0.5">{helpline.sub}</p>
                </div>
                <span className="text-xs font-extrabold text-primary bg-primary-fixed/40 px-3 py-1.5 rounded-lg border border-primary/10">
                  📞 {helpline.num}
                </span>
              </a>
            ))}
          </div>
        </div>

      </main>

      <Navbar />
    </div>
  );
}
