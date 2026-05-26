"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser, SignIn } from "@clerk/nextjs";

export default function LoginPage() {
  const { isSignedIn, user, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      const userRoleId = "kumbh_role_" + user.id;
      const role = localStorage.getItem("kumbh_role") || localStorage.getItem(userRoleId) || "YATRI";
      if (role === "NASHIKKAR") {
        router.replace("/nashikkar");
      } else {
        router.replace("/yatri");
      }
    }
  }, [isLoaded, isSignedIn, user, router]);
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden bg-surface rangoli-bg">
      {/* Corner Ambient Gradients */}
      <div className="absolute top-0 left-0 w-80 h-80 rounded-full bg-primary/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-secondary/10 blur-[120px] pointer-events-none" />

      <main className="w-full max-w-md mx-auto z-10 space-y-6">
        {/* Logo/Branding Header */}
        <div className="text-center flex flex-col items-center space-y-2">
          <div className="w-14 h-14 bg-primary-fixed rounded-full flex items-center justify-center border border-primary/20 sacred-shadow">
            <span
              className="material-symbols-outlined text-3xl text-primary font-bold"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              local_fire_department
            </span>
          </div>
          <a href="/">
            <h1 className="text-2xl font-bold text-primary tracking-tight cursor-pointer">
              KumbhAarambh
            </h1>
          </a>
          <p className="text-xs text-on-surface-variant font-medium">
            Log in to your pilgrim or volunteer profile
          </p>
        </div>

        {/* Clerk Sign-In Component */}
        <div className="flex justify-center">
          <SignIn
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "bg-surface-container-lowest border border-outline-variant/30 rounded-2xl shadow-lg",
                headerTitle: "text-primary font-bold",
                headerSubtitle: "text-on-surface-variant",
                formButtonPrimary:
                  "bg-primary hover:bg-primary-container text-white font-bold text-xs rounded-xl shadow-md",
                formFieldInput:
                  "bg-surface-container-low border border-outline-variant/30 rounded-xl text-xs focus:ring-1 focus:ring-primary focus:border-primary",
                formFieldLabel:
                  "text-[10px] font-bold text-on-surface-variant uppercase tracking-wider",
                footerActionLink:
                  "text-primary font-bold hover:text-primary-container",
                socialButtonsBlockButton:
                  "border border-outline-variant/30 rounded-xl hover:bg-surface-container-low",
              },
            }}
            fallbackRedirectUrl="/yatri"
          />
        </div>
      </main>
    </div>
  );
}
