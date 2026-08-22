"use client";

import Image from "next/image";

function parseHexColor(hex) {
  if (!hex || typeof hex !== "string") return { r: 212, g: 175, b: 55 };
  let h = hex.replace("#", "").trim();
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  if (h.length !== 6) return { r: 212, g: 175, b: 55 };
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

function mixHex(hex, mix, weight) {
  const w = Math.min(1, Math.max(0, weight));
  const a = parseHexColor(hex);
  const b = parseHexColor(mix);
  return `rgb(${Math.round(a.r + (b.r - a.r) * w)}, ${Math.round(a.g + (b.g - a.g) * w)}, ${Math.round(a.b + (b.b - a.b) * w)})`;
}

/** Para kenarı — yalnızca silindir çevresi (kalınlık boyunca), yüzeyi kaplamaz */
function CoinEdge({ size, thickness, accent }) {
  const segments = 40;
  const radius = size / 2;
  const stripAngle = 360 / segments;
  const stripWidth = (2 * Math.PI * radius) / segments + 0.5;
  const edgeDark = mixHex(accent, "#000000", 0.5);
  const edgeLight = mixHex(accent, "#ffffff", 0.28);
  const edgeMid = accent;

  return Array.from({ length: segments }, (_, i) => (
    <div
      key={i}
      className="absolute left-1/2 top-1/2 pointer-events-none"
      style={{
        width: `${stripWidth}px`,
        height: `${thickness}px`,
        marginLeft: `${-stripWidth / 2}px`,
        marginTop: `${-thickness / 2}px`,
        transformOrigin: "center center",
        transform: `rotateY(${stripAngle * i}deg) translateZ(${radius}px) rotateX(90deg)`,
        background: `linear-gradient(90deg, ${edgeDark} 0%, ${edgeLight} 40%, ${edgeMid} 55%, ${edgeDark} 100%)`,
        boxShadow: `inset 0 0 1px ${mixHex(accent, "#000000", 0.35)}`,
      }}
    />
  ));
}

function CoinFace({
  logoSrc,
  alt,
  size,
  borderColor,
  unoptimized,
  fit = "cover",
  className = "",
}) {
  const isDataUrl = logoSrc?.startsWith("data:");
  const accent = borderColor || "#d4af37";

  return (
    <div
      className={`relative overflow-hidden rounded-full w-full h-full coin-face ${className}`}
      style={{
        background: "transparent",
        boxShadow: `
          inset 0 0 0 3px ${accent},
          inset 0 2px 6px rgba(255,255,255,0.2),
          inset 0 -3px 8px rgba(0,0,0,0.35),
          0 6px 18px rgba(0,0,0,0.35),
          0 0 12px ${accent}33
        `,
      }}
    >
      {isDataUrl ? (
        <img
          src={logoSrc}
          alt={alt}
          className={`w-full h-full ${fit === "contain" ? "object-contain p-1.5" : "object-cover"}`}
        />
      ) : (
        <Image
          src={logoSrc || "/logo.png"}
          alt={alt}
          fill
          className={fit === "contain" ? "object-contain p-1.5" : "object-cover"}
          sizes={`${size}px`}
          priority
          unoptimized={unoptimized}
        />
      )}
    </div>
  );
}

/**
 * 3D metal para — kenar kalınlığı görünür, 2 sn bekleyip tek tur döner.
 */
export default function LogoCoin3D({
  logoSrc = "/logo.png",
  alt = "Logo",
  size = 56,
  borderColor = "#d4af37",
  unoptimized = false,
  fit = "cover",
  className = "",
  animate = true,
  showGlowRing = true,
}) {
  const perspective = Math.round(size * 3.2);
  const thickness = Math.max(6, Math.round(size * 0.14));
  const half = thickness / 2;
  const accent = borderColor || "#d4af37";

  const coinBody = (
    <>
      <CoinEdge size={size} thickness={thickness} accent={accent} />
      <div
        className="absolute inset-0"
        style={{
          transform: `translateZ(${half}px)`,
          backfaceVisibility: "hidden",
          WebkitBackfaceVisibility: "hidden",
        }}
      >
        <CoinFace
          logoSrc={logoSrc}
          alt={alt}
          size={size}
          borderColor={borderColor}
          unoptimized={unoptimized}
          fit={fit}
        />
      </div>
      <div
        className="absolute inset-0"
        style={{
          transform: `rotateY(180deg) translateZ(${half}px)`,
          backfaceVisibility: "hidden",
          WebkitBackfaceVisibility: "hidden",
        }}
      >
        <CoinFace
          logoSrc={logoSrc}
          alt={alt}
          size={size}
          borderColor={borderColor}
          unoptimized={unoptimized}
          fit={fit}
        />
      </div>
    </>
  );

  if (!animate) {
    return (
      <div
        className={`relative shrink-0 ${className}`}
        style={{ width: size, height: size, perspective: `${perspective}px` }}
      >
        <span
          className="absolute inset-[-4px] rounded-full coin-metal-rim pointer-events-none"
          style={{ "--coin-accent": accent }}
        />
        <div
          className="relative w-full h-full"
          style={{
            transformStyle: "preserve-3d",
            transform: "rotateX(12deg)",
          }}
        >
          {coinBody}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative shrink-0 ${className}`}
      style={{ width: size, height: size, perspective: `${perspective}px` }}
    >
      <span
        className="absolute inset-[-5px] rounded-full coin-metal-rim pointer-events-none"
        style={{ "--coin-accent": accent }}
      />

      {showGlowRing && (
        <span
          className="absolute inset-[-2px] rounded-full border-2 opacity-35 logo-coin-glow-ring pointer-events-none"
          style={{ borderColor: accent }}
        />
      )}

      <div
        className="logo-coin-flip-pause relative w-full h-full"
        style={{
          transformStyle: "preserve-3d",
          transform: "rotateX(12deg)",
        }}
      >
        {coinBody}
      </div>
    </div>
  );
}
