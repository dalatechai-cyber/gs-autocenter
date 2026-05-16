"use client";

import dynamic from "next/dynamic";

const VehicleExplorerClient = dynamic(
  () => import("./vehicle-explorer/VehicleExplorer.client"),
  {
    ssr: false,
    loading: () => (
      <section
        aria-hidden
        className="relative overflow-hidden bg-ink py-20 sm:py-24 lg:py-28"
      >
        <div className="mx-auto max-w-[1440px] px-5 sm:px-10 lg:px-16">
          <div className="h-[640px] w-full animate-pulse border border-charcoal/60 bg-ink-raised/40" />
        </div>
      </section>
    ),
  },
);

export default function VehicleExplorer() {
  return <VehicleExplorerClient />;
}
