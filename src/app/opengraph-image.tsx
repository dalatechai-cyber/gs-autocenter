import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt =
  "GS Auto Center · TOYOTA & LEXUS service · Ulaanbaatar";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// satori in next/og cannot resolve weight from variable TTF files, so we
// avoid embedding the project's Montserrat-Variable.ttf and stick to the
// runtime's default sans (which renders Latin reliably). The image keeps
// the brand visual language: dark ink canvas, red scalpel accent, logo.
// The Mongolian headline lives in og:description, which is honored by
// every social card platform.

export default async function OgImage() {
  const logoPath = join(
    process.cwd(),
    "public",
    "logo",
    "gs-logo-horizontal-white.png",
  );
  const logoBuffer = await readFile(logoPath);
  const logoSrc = `data:image/png;base64,${logoBuffer.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#131313",
          color: "#E7E7E7",
          fontFamily: "sans-serif",
          padding: "72px 80px",
          position: "relative",
        }}
      >
        {/* Engraved grid overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)",
            backgroundSize: "96px 96px",
            display: "flex",
          }}
        />

        {/* Red ambient glow */}
        <div
          style={{
            position: "absolute",
            right: -180,
            top: 180,
            width: 720,
            height: 480,
            background:
              "radial-gradient(ellipse at center, rgba(220,13,1,0.35), rgba(220,13,1,0) 70%)",
            display: "flex",
          }}
        />

        {/* Top red rule */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 6,
            background: "#DC0D01",
            display: "flex",
          }}
        />

        {/* Top row: logo + Since */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "relative",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoSrc}
            alt=""
            width={400}
            height={158}
            style={{ display: "block" }}
          />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 18,
              fontSize: 18,
              letterSpacing: 6,
              textTransform: "uppercase",
              color: "#8A878D",
            }}
          >
            <div
              style={{
                width: 56,
                height: 2,
                background: "#DC0D01",
                display: "flex",
              }}
            />
            <span style={{ color: "#DC0D01", fontWeight: 700 }}>Since 2011</span>
          </div>
        </div>

        {/* Headline block — Latin only so the default font renders cleanly */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 28,
            position: "relative",
            maxWidth: 1040,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 18,
              fontSize: 20,
              letterSpacing: 6,
              textTransform: "uppercase",
              color: "#8A878D",
            }}
          >
            <div
              style={{
                width: 12,
                height: 12,
                background: "#DC0D01",
                display: "flex",
              }}
            />
            <span>Toyota &amp; Lexus · Specialist Service</span>
          </div>
          <div
            style={{
              fontSize: 132,
              fontWeight: 900,
              lineHeight: 0.94,
              letterSpacing: -4,
              textTransform: "uppercase",
              color: "#E7E7E7",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <span>
              Drive <span style={{ color: "#DC0D01" }}>safer.</span>
            </span>
            <span>Drive farther.</span>
          </div>
        </div>

        {/* Bottom row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "relative",
            borderTop: "1px solid #353338",
            paddingTop: 28,
            fontSize: 20,
            letterSpacing: 4,
            textTransform: "uppercase",
            color: "#B8B6BB",
          }}
        >
          <span>Ulaanbaatar · Narny Zam 6/2</span>
          <span style={{ color: "#E7E7E7", fontWeight: 700 }}>
            +976 77-200-570
          </span>
        </div>
      </div>
    ),
    { ...size },
  );
}
