"use client";

import Image from "next/image";

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
        background:
          "radial-gradient(circle at 32% 28%, rgba(255,255,255,0.22) 0%, transparent 42%), radial-gradient(circle at 72% 78%, rgba(0,0,0,0.55) 0%, transparent 48%), linear-gradient(145deg, #1a1208 0%, #0a0a0a 55%, #151515 100%)",
        boxShadow: `
          inset 0 3px 10px rgba(255,255,255,0.28),
          inset 0 -5px 14px rgba(0,0,0,0.65),
          0 10px 28px rgba(0,0,0,0.5),
          0 0 18px ${accent}44
        `,
        border: `3px solid ${accent}`,
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
 * 3D metal para dönüşü — Y ekseni sürekli dönüş, çift yüz aynı logo.
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
  speed = "slow",
  showGlowRing = true,
}) {
  const perspective = Math.round(size * 3);
  const depth = Math.max(3, Math.round(size * 0.045));
  const spinClass = speed === "slow" ? "logo-coin-spin-slow" : "logo-coin-spin";
  const accent = borderColor || "#d4af37";

  if (!animate) {
    return (
      <div
        className={`relative shrink-0 ${className}`}
        style={{ width: size, height: size }}
      >
        <span
          className="absolute inset-[-4px] rounded-full coin-metal-rim pointer-events-none"
          style={{ "--coin-accent": accent }}
        />
        <CoinFace
          logoSrc={logoSrc}
          alt={alt}
          size={size}
          borderColor={borderColor}
          unoptimized={unoptimized}
          fit={fit}
        />
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
        className={`${spinClass} relative w-full h-full`}
        style={{ transformStyle: "preserve-3d" }}
      >
        <div
          className="absolute inset-0"
          style={{
            transform: `translateZ(${depth}px)`,
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
            transform: `rotateY(180deg) translateZ(${depth}px)`,
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
      </div>
    </div>
  );
}
