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

/** Dönüşte görünen altın silindir kenarı — yalnızca çevre kalınlığı */
function CoinCylinderEdge({ size, thickness, accent }) {
  const segments = 48;
  const radius = size / 2;
  const stripAngle = 360 / segments;
  const stripWidth = (2 * Math.PI * radius) / segments + 0.35;
  const edgeDark = mixHex(accent, "#000000", 0.42);
  const edgeLight = mixHex(accent, "#ffffff", 0.35);
  const edgeMid = accent;

  return Array.from({ length: segments }, (_, i) => (
    <div
      key={i}
      className="absolute left-1/2 top-1/2 pointer-events-none coin-cylinder-edge"
      style={{
        width: `${stripWidth}px`,
        height: `${thickness}px`,
        marginLeft: `${-stripWidth / 2}px`,
        marginTop: `${-thickness / 2}px`,
        transformOrigin: "center center",
        transform: `rotateY(${stripAngle * i}deg) translateZ(${radius}px) rotateX(90deg)`,
        background: `linear-gradient(90deg, ${edgeDark} 0%, ${edgeLight} 38%, ${edgeMid} 55%, ${edgeDark} 100%)`,
      }}
    />
  ));
}

function MedallionFace({ logoSrc, alt, size, unoptimized }) {
  const isDataUrl = logoSrc?.startsWith("data:");
  const zoom = 1.22;

  return (
    <div className="relative w-full h-full rounded-full overflow-hidden logo-medallion-face">
      <div
        className="absolute inset-0"
        style={{ transform: `scale(${zoom})` }}
      >
        {isDataUrl ? (
          <img
            src={logoSrc}
            alt={alt}
            className="w-full h-full object-cover object-center"
          />
        ) : (
          <Image
            src={logoSrc}
            alt={alt}
            fill
            className="object-cover object-center"
            sizes={`${size}px`}
            priority
            unoptimized={unoptimized}
          />
        )}
      </div>
    </div>
  );
}

function CoinFaceContent({
  faceMode,
  logoSrc,
  alt,
  size,
  borderColor,
  unoptimized,
  fit,
}) {
  if (faceMode === "medallion") {
    return (
      <MedallionFace
        logoSrc={logoSrc}
        alt={alt}
        size={size}
        unoptimized={unoptimized}
      />
    );
  }

  return (
    <LogoWithRim3D
      logoSrc={logoSrc}
      alt={alt}
      size={size}
      borderColor={borderColor}
      unoptimized={unoptimized}
      fit={fit}
    />
  );
}
function LogoWithRim3D({
  logoSrc,
  alt,
  size,
  borderColor,
  unoptimized,
  fit = "cover",
}) {
  const isDataUrl = logoSrc?.startsWith("data:");
  const accent = borderColor || "#d4af37";
  const rimWidth = Math.max(5, Math.round(size * 0.12));
  const grooveWidth = Math.max(2, Math.round(rimWidth * 0.2));
  const faceInset = rimWidth + grooveWidth;

  return (
    <div
      className="relative w-full h-full rounded-full logo-rim-3d"
      style={{ "--coin-accent": accent }}
    >
      <div className="absolute inset-0 rounded-full logo-rim-3d-outer pointer-events-none" />

      <div
        className="absolute rounded-full logo-rim-3d-groove pointer-events-none"
        style={{ inset: rimWidth - grooveWidth }}
      />

      <div
        className="absolute rounded-full pointer-events-none logo-rim-3d-accent-ring"
        style={{
          inset: rimWidth + 1,
          border: `1.5px solid color-mix(in srgb, ${accent} 85%, #fff)`,
        }}
      />

      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          inset: rimWidth + Math.max(3, Math.round(size * 0.025)),
          border: `1px solid color-mix(in srgb, ${accent} 55%, #6366f1)`,
          opacity: 0.85,
        }}
      />

      <div
        className="absolute rounded-full overflow-hidden logo-rim-3d-face"
        style={{ inset: faceInset }}
      >
        {isDataUrl ? (
          <img
            src={logoSrc}
            alt={alt}
            className={`w-full h-full ${fit === "contain" ? "object-contain p-0.5" : "object-cover"}`}
          />
        ) : (
          <Image
            src={logoSrc || "/logo.png"}
            alt={alt}
            fill
            className={fit === "contain" ? "object-contain p-0.5" : "object-cover"}
            sizes={`${size}px`}
            priority
            unoptimized={unoptimized}
          />
        )}
      </div>
    </div>
  );
}

/**
 * 3D madalyon — yüzde çevresel halka, dönüşte altın kenar kalınlığı görünür.
 * 2 sn bekler → tek tur → 2 sn bekler.
 */
export default function LogoCoin3D({
  logoSrc = "/logo.png",
  alt = "Logo",
  size = 56,
  borderColor = "#d4af37",
  unoptimized = false,
  fit = "cover",
  faceMode = "rim",
  className = "",
  animate = true,
  showGlowRing = true,
}) {
  const perspective = Math.round(size * 3.5);
  const thickness = Math.max(5, Math.round(size * 0.1));
  const half = thickness / 2;
  const accent = borderColor || "#d4af37";
  const isMedallion = faceMode === "medallion";

  const faceProps = {
    faceMode,
    logoSrc,
    alt,
    size,
    borderColor,
    unoptimized,
    fit,
  };

  const coinBody = (
    <>
      {!isMedallion && (
        <CoinCylinderEdge size={size} thickness={thickness} accent={accent} />
      )}
      <div
        className="absolute inset-0"
        style={{
          transform: isMedallion ? undefined : `translateZ(${half}px)`,
          backfaceVisibility: "hidden",
          WebkitBackfaceVisibility: "hidden",
        }}
      >
        <CoinFaceContent {...faceProps} />
      </div>
      <div
        className="absolute inset-0"
        style={{
          transform: isMedallion ? "rotateY(180deg)" : `rotateY(180deg) translateZ(${half}px)`,
          backfaceVisibility: "hidden",
          WebkitBackfaceVisibility: "hidden",
        }}
      >
        <CoinFaceContent {...faceProps} />
      </div>
    </>
  );

  if (!animate) {
    return (
      <div
        className={`relative shrink-0 ${className}`}
        style={{ width: size, height: size, perspective: `${perspective}px` }}
      >
        <div
          className="relative w-full h-full"
          style={{ transformStyle: "preserve-3d" }}
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
      {showGlowRing && (
        <span
          className="absolute inset-[-3px] rounded-full border-2 opacity-30 logo-coin-glow-ring pointer-events-none"
          style={{ borderColor: accent }}
        />
      )}

      <div
        className="logo-coin-flip-pause relative w-full h-full"
        style={{ transformStyle: "preserve-3d" }}
      >
        {coinBody}
      </div>
    </div>
  );
}
