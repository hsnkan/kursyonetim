"use client";

import Image from "next/image";

function FlatLogoFace({
  logoSrc,
  alt,
  size,
  borderColor,
  unoptimized,
  fit = "cover",
  faceMode = "rim",
}) {
  const isDataUrl = logoSrc?.startsWith("data:");
  const accent = borderColor || "#d4af37";
  const zoom = faceMode === "medallion" ? 1.22 : 1;

  return (
    <div
      className="relative w-full h-full rounded-full overflow-hidden bg-slate-950"
      style={{ border: `2px solid ${accent}` }}
    >
      <div
        className="absolute inset-0"
        style={zoom !== 1 ? { transform: `scale(${zoom})` } : undefined}
      >
        {isDataUrl ? (
          <img
            src={logoSrc}
            alt={alt}
            className={`w-full h-full ${fit === "contain" || faceMode === "medallion" ? "object-cover object-center" : "object-cover"}`}
          />
        ) : (
          <Image
            src={logoSrc || "/logo.png"}
            alt={alt}
            fill
            className={
              fit === "contain" || faceMode === "medallion"
                ? "object-cover object-center"
                : "object-cover"
            }
            sizes={`${size}px`}
            priority
            unoptimized={unoptimized}
          />
        )}
      </div>
    </div>
  );
}

/** 2D logo — 2 sn bekler, Y ekseninde tek tur döner (ön/arka aynı). */
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
  const perspective = Math.round(size * 2.5);
  const accent = borderColor || "#d4af37";

  const faceProps = {
    logoSrc,
    alt,
    size,
    borderColor,
    unoptimized,
    fit,
    faceMode,
  };

  const coinDisc = (
    <>
      <div
        className="absolute inset-0"
        style={{
          backfaceVisibility: "hidden",
          WebkitBackfaceVisibility: "hidden",
        }}
      >
        <FlatLogoFace {...faceProps} />
      </div>
      <div
        className="absolute inset-0"
        style={{
          transform: "rotateY(180deg)",
          backfaceVisibility: "hidden",
          WebkitBackfaceVisibility: "hidden",
        }}
      >
        <FlatLogoFace {...faceProps} />
      </div>
    </>
  );

  if (!animate) {
    return (
      <div
        className={`relative shrink-0 ${className}`}
        style={{ width: size, height: size }}
      >
        <FlatLogoFace {...faceProps} />
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
        {coinDisc}
      </div>
    </div>
  );
}
