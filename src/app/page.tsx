import Hero from "@/components/Hero";
import TrustStrip from "@/components/TrustStrip";
import Manifesto from "@/components/Manifesto";
import Services from "@/components/Services";
import VehicleShowcase from "@/components/VehicleShowcase";
import LC300CarouselSection from "@/components/LC300CarouselSection";
import JapanTok from "@/components/JapanTok";
import About from "@/components/About";
import DirectorGreeting from "@/components/DirectorGreeting";
import Contact from "@/components/Contact";
import Reveal from "@/components/Reveal";

// The announcement bar in the shared layout reads from Vercel Blob per request.
// Opting the homepage into dynamic rendering ensures the live banner streams
// into the response instead of being dropped after the static shell flushes.
export const dynamic = "force-dynamic";

const SITE_URL = "https://gs-autocenter.vercel.app";

const localBusinessJsonLd = {
  "@context": "https://schema.org",
  "@type": "AutomotiveBusiness",
  "@id": `${SITE_URL}/#business`,
  name: "GS Auto Center",
  alternateName: ["Гранд Сутай ХХК", "200 & 570 авто сервис"],
  url: SITE_URL,
  logo: `${SITE_URL}/logo/gs-logo-horizontal-white.png`,
  image: `${SITE_URL}/opengraph-image`,
  description:
    "TOYOTA болон LEXUS брэндийн жийп ангилалын автомашины мэргэжлийн засвар үйлчилгээний цогцолбор. JAPAN TOK оригинал сэлбэг, MNS 5025:2010 стандарт.",
  telephone: "+976-77-200-570",
  foundingDate: "2011",
  priceRange: "₮₮",
  currenciesAccepted: "MNT",
  paymentAccepted: "Бэлэн, Картаар",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Нарны зам 6/2",
    addressLocality: "Улаанбаатар",
    addressRegion: "Баянгол дүүрэг, 3-р хороо",
    addressCountry: "MN",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 47.9079841,
    longitude: 106.9120444,
    hasMap: "https://maps.app.goo.gl/UbQAvbjpgX9QJJLh9",
  },
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
      opens: "09:00",
      closes: "19:00",
    },
  ],
  contactPoint: [
    {
      "@type": "ContactPoint",
      telephone: "+976-77-200-570",
      contactType: "customer service",
      areaServed: "MN",
      availableLanguage: ["Mongolian"],
    },
    {
      "@type": "ContactPoint",
      telephone: "+976-91-200-570",
      contactType: "reservations",
      areaServed: "MN",
      availableLanguage: ["Mongolian"],
    },
    {
      "@type": "ContactPoint",
      telephone: "+976-95-200-570",
      contactType: "technical support",
      areaServed: "MN",
      availableLanguage: ["Mongolian"],
    },
  ],
  areaServed: { "@type": "Country", name: "Mongolia" },
  brand: [
    { "@type": "Brand", name: "Toyota" },
    { "@type": "Brand", name: "Lexus" },
    { "@type": "Brand", name: "JAPAN TOK" },
  ],
  knowsAbout: [
    "Toyota Land Cruiser repair",
    "Lexus LX repair",
    "Engine diagnostics",
    "Suspension parts",
    "OEM auto parts",
  ],
  makesOffer: [
    { "@type": "Offer", itemOffered: { "@type": "Service", name: "Иж бүрэн үзлэг, оношилгоо" } },
    { "@type": "Offer", itemOffered: { "@type": "Service", name: "Хөдөлгүүрийн засвар" } },
    { "@type": "Offer", itemOffered: { "@type": "Service", name: "Явах эд ангийн засвар" } },
    { "@type": "Offer", itemOffered: { "@type": "Service", name: "Цахилгааны оношилгоо, засвар" } },
    { "@type": "Offer", itemOffered: { "@type": "Service", name: "Тос, тосолгооны үйлчилгээ" } },
    { "@type": "Offer", itemOffered: { "@type": "Service", name: "Оригинал сэлбэгийн захиалга" } },
  ],
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  url: SITE_URL,
  name: "GS Auto Center",
  inLanguage: "mn-MN",
  publisher: { "@id": `${SITE_URL}/#business` },
};

export default function Home() {
  return (
    <main className="bg-ink text-paper">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([localBusinessJsonLd, websiteJsonLd]),
        }}
      />
      <Reveal />
      <Hero />
      <TrustStrip />
      <Manifesto />
      <Services />
      <VehicleShowcase />
      <LC300CarouselSection />
      <JapanTok />
      <About />
      <DirectorGreeting />
      <Contact />
    </main>
  );
}
