import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt =
  "GS Auto Center · TOYOTA & LEXUS жийпийн засвар үйлчилгээ · Улаанбаатар";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage() {
  const logoPath = join(
    process.cwd(),
    "public",
    "logo",
    "gs-logo-horizontal-white.png",
  );
  const fontPath = join(
    process.cwd(),
    "public",
    "fonts",
    "Montserrat-Variable.ttf",
  );
  const [logoBuffer, fontBuffer] = await Promise.all([
    readFile(logoPath),
    readFile(fontPath),
  ]);
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
          fontFamily: "Montserrat, sans-serif",
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

        {/* Top row: logo + meta */}
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
            width={360}
            height={142}
            style={{ display: "block" }}
          />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 18,
              fontSize: 16,
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
            <span style={{ color: "#DC0D01" }}>Since 2011</span>
          </div>
        </div>

        {/* Headline block */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 28,
            position: "relative",
            maxWidth: 980,
          }}
        >
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
                width: 12,
                height: 12,
                background: "#DC0D01",
                display: "flex",
              }}
            />
            <span>TOYOTA &amp; LEXUS · Жийпийн засвар үйлчилгээ</span>
          </div>
          <div
            style={{
              fontSize: 116,
              fontWeight: 900,
              lineHeight: 0.96,
              letterSpacing: -3,
              textTransform: "uppercase",
              color: "#E7E7E7",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <span>Бид таныг</span>
            <span>
              <span style={{ color: "#DC0D01" }}>аюулгүй </span>зорчиход
            </span>
            <span>туслана.</span>
          </div>
        </div>

        {/* Bottom row: address + phone */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "relative",
            borderTop: "1px solid #353338",
            paddingTop: 28,
            fontSize: 18,
            letterSpacing: 4,
            textTransform: "uppercase",
            color: "#B8B6BB",
          }}
        >
          <span>Улаанбаатар · Нарны зам 6/2</span>
          <span style={{ color: "#E7E7E7", fontWeight: 700 }}>
            +976 77-200-570
          </span>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "Montserrat",
          data: fontBuffer,
          weight: 700,
          style: "normal",
        },
      ],
    },
  );
}
