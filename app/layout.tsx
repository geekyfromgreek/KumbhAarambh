import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Be_Vietnam_Pro } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const beVietnamPro = Be_Vietnam_Pro({
  variable: "--font-be-vietnam",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "KumbhAarambh - Holy Pilgrimage Companion",
  description: "Navigate the Nashik Kumbh Mela with safe stays, dynamic maps, live crowd alerts, fare calculators, and active SOS support.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`${plusJakartaSans.variable} ${beVietnamPro.variable} h-full antialiased light`}
      >
        <head>
          {/* Load Material Symbols Outlined for mockup icons compat */}
          <link
            href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
            rel="stylesheet"
          />
        </head>
        <body className="min-h-full flex flex-col font-sans text-on-surface bg-surface rangoli-bg transition-colors duration-300">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
