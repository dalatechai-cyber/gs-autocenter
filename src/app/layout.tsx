import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import Script from "next/script";
import Nav from "@/components/Nav";
import AnnouncementBar from "@/components/AnnouncementBar";
import Footer from "@/components/Footer";
import { SITE_URL } from "@/lib/site-url";
import "./globals.css";

const chatbotUrl = process.env.NEXT_PUBLIC_CHATBOT_URL?.replace(/\/$/, "");
// Bumped whenever widget.js is rewritten so visitors break out of stale browser
// caches without waiting for the default Cache-Control window.
const CHATBOT_WIDGET_VERSION = "3";

const montserrat = localFont({
  src: [
    {
      path: "../../public/fonts/Montserrat-Variable.ttf",
      style: "normal",
      weight: "100 900",
    },
    {
      path: "../../public/fonts/Montserrat-Italic-Variable.ttf",
      style: "italic",
      weight: "100 900",
    },
  ],
  variable: "--font-montserrat",
  display: "swap",
  preload: true,
});

const audiowide = localFont({
  src: "../../public/fonts/Audiowide-Regular.ttf",
  variable: "--font-audiowide",
  weight: "400",
  style: "normal",
  display: "swap",
  // Preload so wordmark headings (Hero, Manifesto, VehicleShowcase) and any
  // above-the-fold text using --font-audiowide doesn't block LCP waiting for
  // the .ttf to download. The Audiowide-Regular.ttf file is small (~30 KB).
  preload: true,
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "GS Auto Center · TOYOTA & LEXUS засвар үйлчилгээ",
    template: "%s · GS Auto Center",
  },
  description:
    "TOYOTA болон LEXUS брэндийн жийп ангилалын автомашины мэргэжлийн засвар үйлчилгээ. 13 жилийн туршлага, JAPAN TOK оригинал сэлбэг, MNS 5025:2010 стандарт. Улаанбаатар, Нарны зам.",
  applicationName: "GS Auto Center",
  keywords: [
    "GS Auto Center",
    "автозасвар",
    "Toyota засвар",
    "Lexus засвар",
    "Land Cruiser",
    "жийп засвар",
    "оригинал сэлбэг",
    "JAPAN TOK",
    "Улаанбаатар автосервис",
    "Нарны зам",
  ],
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    title: "GS Auto Center · TOYOTA & LEXUS засвар үйлчилгээ",
    description:
      "Бид таныг аюулгүй зорчиход тусална. TOYOTA & LEXUS жийпийн дагнасан засвар, үйлчилгээ, оригинал сэлбэг. Улаанбаатар, 2011 оноос.",
    url: "/",
    siteName: "GS Auto Center",
    locale: "mn_MN",
    type: "website",
    images: [
      {
        url: "/models/lc300-360/exterior/hero.webp",
        width: 1280,
        height: 720,
        alt: "Toyota Land Cruiser 300 — GS Auto Center",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GS Auto Center · TOYOTA & LEXUS засвар үйлчилгээ",
    description:
      "Бид таныг аюулгүй зорчиход тусална. TOYOTA & LEXUS жийпийн дагнасан засвар, үйлчилгээ, оригинал сэлбэг.",
  },
  formatDetection: {
    telephone: true,
    address: false,
    email: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#131313",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="mn"
      className={`${montserrat.variable} ${audiowide.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <AnnouncementBar />
        <Nav />
        {children}
        <Footer />
        {chatbotUrl ? (
          <Script
            src={`${chatbotUrl}/widget.js?v=${CHATBOT_WIDGET_VERSION}`}
            strategy="afterInteractive"
          />
        ) : null}
        {process.env.NEXT_PUBLIC_GA_ID ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga-init" strategy="afterInteractive">{`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}', { anonymize_ip: true });
            `}</Script>
          </>
        ) : null}
      </body>
    </html>
  );
}
