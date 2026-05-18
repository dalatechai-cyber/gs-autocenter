import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import Nav from "@/components/Nav";
import "./globals.css";

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
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL("https://gs-autocenter.vercel.app"),
  title: {
    default: "GS Auto Center · TOYOTA & LEXUS засвар үйлчилгээ",
    template: "%s · GS Auto Center",
  },
  description:
    "TOYOTA болон LEXUS брэндийн жийп ангилалын автомашины засвар үйлчилгээний цогцолбор. 13 жилийн туршлага. Улаанбаатар.",
  applicationName: "GS Auto Center",
  openGraph: {
    title: "GS Auto Center",
    description:
      "Бид таныг аюулгүй зорчиход тусална. TOYOTA & LEXUS засвар, үйлчилгээ, сэлбэг.",
    locale: "mn_MN",
    type: "website",
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
        <Nav />
        {children}
      </body>
    </html>
  );
}
