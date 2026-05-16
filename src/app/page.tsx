import Hero from "@/components/Hero";
import TrustStrip from "@/components/TrustStrip";
import VehicleShowcase from "@/components/VehicleShowcase";
import VehicleExplorer from "@/components/VehicleExplorer";

export default function Home() {
  return (
    <main className="bg-ink text-paper">
      <Hero />
      <TrustStrip />
      <VehicleShowcase />
      <VehicleExplorer />
    </main>
  );
}
