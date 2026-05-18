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
