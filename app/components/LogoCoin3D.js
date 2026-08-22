"use client";

import Image from "next/image";

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
  const rimWidth = Math.max(4, Math.round(size * 0.1));

  return (
    <div
      className="relative w-full h-full rounded-full logo-rim-3d"
      style={{
        "--coin-accent": accent,
        "--rim-width": `${rimWidth}px`,
      }}
    >
      <div className="absolute inset-0 rounded-full logo-rim-3d-ring pointer-events-none" />

      <div
        className="absolute rounded-full overflow-hidden logo-rim-3d-face bg-slate-950"
        style={{ inset: rimWidth }}
      >
        {isDataUrl ? (
          <img
            src={logoSrc}
            alt={alt}
            className={`w-full h-full ${fit === "contain" ? "object-contain p-1" : "object-cover"}`}
          />
        ) : (
          <Image
            src={logoSrc || "/logo.png"}
            alt={alt}
            fill
            className={fit === "contain" ? "object-contain p-1" : "object-cover"}
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
 * Logo + çevresel 3D metal halka. 2 sn bekleyip tek tur döner.
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
  const perspective = Math.round(size * 2.8);
  const accent = borderColor || "#d4af37";

  const faceProps = {
    logoSrc,
    alt,
    size,
    borderColor,
    unoptimized,
    fit,
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
        <LogoWithRim3D {...faceProps} />
      </div>
      <div
        className="absolute inset-0"
        style={{
          transform: "rotateY(180deg)",
          backfaceVisibility: "hidden",
          WebkitBackfaceVisibility: "hidden",
        }}
      >
        <LogoWithRim3D {...faceProps} />
      </div>
    </>
  );

  if (!animate) {
    return (
      <div
        className={`relative shrink-0 ${className}`}
        style={{ width: size, height: size }}
      >
        <LogoWithRim3D {...faceProps} />
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
