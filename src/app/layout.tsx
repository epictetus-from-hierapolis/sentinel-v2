import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { EventsProvider } from '@/context/EventsContext';
import Navigation from '@/components/Navigation';
import Header from '@/components/header/Header';
import NotificationToast from "@/components/NotificationToast";
import PWAHandler from "@/components/PWAHandler";
import { auth } from "@/auth";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Viewport configuration for PWA and mobile optimization
export const viewport: Viewport = {
  themeColor: "#020617",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover", // Essential for full-screen "Safe Area" notch context
};

// Metadata for SEO and PWA (Progressive Web App) capabilities.
export const metadata: Metadata = {
  title: "Sentinel Security",
  description: "Advanced Security Event Hub",
  manifest: "/manifest.json", // Enables Android app installation
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Sentinel",
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const isLoggedIn = !!session?.user;

  return (
    <html lang="en">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="bg-slate-950 text-white antialiased">
        <PWAHandler />
        <EventsProvider>
          {isLoggedIn && <Header />}
          <NotificationToast />
          <main className={`flex-1 w-full min-h-screen ${isLoggedIn ? 'pb-24' : ''}`}>
            {children}
          </main>
          {isLoggedIn && <Navigation />}
        </EventsProvider>
      </body>
    </html>
  );
}