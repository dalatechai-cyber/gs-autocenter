import Hero from "@/components/Hero";
import TrustStrip from "@/components/TrustStrip";
import Services from "@/components/Services";
import VehicleShowcase from "@/components/VehicleShowcase";
import VehicleExplorer from "@/components/VehicleExplorer";
import JapanTok from "@/components/JapanTok";
import About from "@/components/About";
import DirectorGreeting from "@/components/DirectorGreeting";
import Contact from "@/components/Contact";
import Reveal from "@/components/Reveal";

// The announcement bar in the shared layout reads from Vercel Blob per request.
// Opting the homepage into dynamic rendering ensures the live banner streams
// into the response instead of being dropped after the static shell flushes.
export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <main className="bg-ink text-paper">
      <Reveal />
      <Hero />
      <TrustStrip />
      <Services />
      <VehicleShowcase />
      <VehicleExplorer />
      <JapanTok />
      <About />
      <DirectorGreeting />
      <Contact />
    </main>
  );
}
