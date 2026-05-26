"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Navbar from "@/components/Navbar";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, AlertOctagon, CheckCircle2, ShieldCheck, UserCheck, LogIn } from "lucide-react";
import { useUser } from "@clerk/nextjs";

interface Scam {
  id: string;
  title: string;
  desc: string;
  location: string;
  reportedAt: string;
  verified: boolean;
}

const initialScams: Scam[] = [
  {
    id: "scam-1",
    title: "Fake VIP Bathing Passes Broker",
    desc: "Fraudsters are claiming to sell 'VIP Entry Passes' for Ram Kund bathing at ₹500. Note: Bathing in all Ghats is completely free. VIP passes do not exist.",
    location: "Panchavati bridge road, Nashik",
    reportedAt: "10 mins ago",
    verified: true
  },
  {
    id: "scam-2",
    title: "Fake Accommodation Deposit Scam",
    desc: "Brokers are asking for 100% advance payments via UPI for matha bookings and disappearing. Always use official registration desks inside the camp.",
    location: "Tapovan Sector 2 Camp",
    reportedAt: "45 mins ago",
    verified: true
  },
  {
    id: "scam-3",
    title: "High Charger Baggage Counter",
    desc: "Unregistered baggage lockers charging ₹100/hour near Kapaleshwar Temple. Use RTO-approved counters which charge a maximum flat rate of ₹20.",
    location: "Kapaleshwar Temple entrance",
    reportedAt: "2 hours ago",
    verified: false
  }
];

export default function ScamAlerts() {
  const router = useRouter();
  const { isSignedIn } = useUser();
  const [scams, setScams] = useState<Scam[]>(initialScams);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  
  // Form fields
  const [scamTitle, setScamTitle] = useState("");
  const [scamDesc, setScamDesc] = useState("");
  const [scamLoc, setScamLoc] = useState("");
  const [reportSuccess, setReportSuccess] = useState(false);

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSignedIn) {
      setShowLoginPrompt(true);
      return;
    }
    if (!scamTitle || !scamDesc || !scamLoc) return;

    const newScam: Scam = {
      id: `scam-${Date.now()}`,
      title: scamTitle,
      desc: scamDesc,
      location: scamLoc,
      reportedAt: "Just now",
      verified: false
    };

    // Prepend to list
    setScams([newScam, ...scams]);
    setReportSuccess(true);
    
    setTimeout(() => {
      setReportSuccess(false);
      setScamTitle("");
      setScamDesc("");
      setScamLoc("");
    }, 2500);
  };

  return (
    <div className="min-h-screen bg-surface pb-32">
      <Header />

      <main className="max-w-md mx-auto px-margin-mobile pt-6 space-y-6">
        
        {/* Page Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-fixed rounded-xl flex items-center justify-center text-primary border border-primary/10">
            <span className="material-symbols-outlined text-2xl font-bold">
              gpp_maybe
            </span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-on-surface">Scam Alerts & Safety</h2>
            <p className="text-xs text-on-surface-variant">Stay safe from brokers, fake passes, and active frauds</p>
          </div>
        </div>

        {/* Security verification message */}
        <div className="bg-primary-fixed/20 border border-primary/20 p-4 rounded-2xl flex gap-3 text-xs leading-relaxed">
          <ShieldCheck size={20} className="text-primary shrink-0" />
          <div className="text-on-surface-variant">
            <strong className="text-primary block mb-0.5">Verification System Active:</strong>
            Safety warnings marked with <UserCheck size={12} className="inline mx-0.5 text-secondary" /> are verified by police and volunteers. Unverified listings represent pilgrim crowd logs.
          </div>
        </div>

        {/* Scam Reports List */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
            <AlertOctagon size={16} className="text-secondary animate-pulse" />
            Active Warning Board ({scams.length})
          </h3>

          <div className="space-y-4">
            {scams.map((scam) => (
              <div
                key={scam.id}
                className="p-4 rounded-xl border border-outline-variant/30 bg-surface-container-lowest sacred-shadow space-y-2 relative overflow-hidden"
              >
                {scam.verified && (
                  <div className="absolute top-0 right-0 bg-secondary/15 text-secondary px-2.5 py-0.5 rounded-bl-xl text-[9px] font-extrabold flex items-center gap-1">
                    <UserCheck size={10} /> VERIFIED WARNING
                  </div>
                )}
                
                <h4 className="font-bold text-sm text-on-surface pr-24 leading-snug">
                  {scam.title}
                </h4>
                
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  {scam.desc}
                </p>

                <div className="flex justify-between items-center text-[10px] text-outline font-bold pt-2 border-t border-outline-variant/10">
                  <span>📍 {scam.location}</span>
                  <span>{scam.reportedAt}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Report Scam Form */}
        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-5 sacred-shadow space-y-4">
          <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
            <ShieldAlert size={16} className="text-primary" />
            Report a Scam/Fraud
          </h3>
          <p className="text-[11px] text-on-surface-variant leading-relaxed">
            Spotted brokers, high chargers, or fake charity collection boxes? Help other Yatris by publishing details of the active scam.
          </p>

          {reportSuccess ? (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center py-6 space-y-2 bg-green-50 border border-green-200 rounded-xl"
            >
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 mx-auto">
                <CheckCircle2 size={24} />
              </div>
              <h4 className="text-xs font-bold text-green-700">Safety Alert Posted!</h4>
              <p className="text-[10px] text-on-surface-variant max-w-xs mx-auto px-4">
                Thank you. Your report is live. Volunteers and police have been notified for site verification.
              </p>
            </motion.div>
          ) : (
            <form onSubmit={handleReportSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wide">Scam Headline</label>
                <input
                  type="text"
                  required
                  value={scamTitle}
                  onChange={(e) => setScamTitle(e.target.value)}
                  placeholder="e.g. VIP VIP bathing ticket brokers"
                  className="w-full p-2.5 bg-surface-container-low border border-outline-variant/30 rounded-lg text-xs outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wide">Detailed Description</label>
                <textarea
                  required
                  value={scamDesc}
                  onChange={(e) => setScamDesc(e.target.value)}
                  placeholder="Describe what happened, how much they charged, and what they looked like."
                  rows={3}
                  className="w-full p-2.5 bg-surface-container-low border border-outline-variant/30 rounded-lg text-xs outline-none focus:ring-1 focus:ring-primary focus:border-primary resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wide">Scam Location/Area</label>
                <input
                  type="text"
                  required
                  value={scamLoc}
                  onChange={(e) => setScamLoc(e.target.value)}
                  placeholder="e.g. Near Panchavati bridge parking"
                  className="w-full p-2.5 bg-surface-container-low border border-outline-variant/30 rounded-lg text-xs outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-primary text-on-primary font-bold text-xs shadow-md hover:bg-primary-container transition-colors cursor-pointer text-center"
              >
                Log Scam Warning
              </button>
            </form>
          )}
        </div>

      </main>

      <Navbar />

      {/* Login Required Prompt Modal */}
      <AnimatePresence>
        {showLoginPrompt && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLoginPrompt(false)}
              className="fixed inset-0 bg-black z-[60]"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm bg-surface rounded-2xl p-6 z-[60] sacred-shadow-lg border border-outline-variant/30 text-center space-y-4"
            >
              <div className="w-14 h-14 bg-primary-fixed rounded-full flex items-center justify-center mx-auto border border-primary/20">
                <LogIn size={24} className="text-primary" />
              </div>
              <h3 className="text-lg font-bold text-on-surface">Login Required</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                To report scams or safety issues, you need to be logged in with a Yatri account. Guest access does not support reporting.
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
    </div>
  );
}
