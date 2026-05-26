"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";

export default function YatriLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isSignedIn, user, isLoaded } = useUser();

  useEffect(() => {
    if (!isLoaded) return;

    if (isSignedIn && user) {
      const userRoleId = "kumbh_role_" + user.id;
      let role = localStorage.getItem(userRoleId);
      if (!role) {
        role = localStorage.getItem("selected_signup_role") || "YATRI";
        localStorage.setItem(userRoleId, role);
      }
      localStorage.setItem("kumbh_role", role);
    } else {
      // Check if guest session is active
      const guest = localStorage.getItem("kumbh_guest_session");
      if (guest !== "true") {
        router.replace("/");
      }
    }
  }, [isSignedIn, user, isLoaded, router]);

  return <>{children}</>;
}
