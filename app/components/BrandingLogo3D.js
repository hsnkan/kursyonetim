"use client";

import Image from "next/image";

function LogoFace3D({
  logoSrc,
  alt,
  size,
  borderColor,
  unoptimized,
  className = "",
}) {
  const isDataUrl = logoSrc?.startsWith("data:");

  return (
    <div
      className={`relative overflow-hidden rounded-full w-full h-full border-[3px] bg-slate-950 ${className}`}
      style={{
        borderColor: borderColor || "#f59e0b",
        boxShadow:
          "0 10px 28px rgba(0,0,0,0.45), 0 4px 12px rgba(245,158,11,0.25), inset 0 2px 4px rgba(255,255,255,0.15)",
      }}
    >
      {isDataUrl ? (
        <img src={logoSrc} alt={alt} className="w-full h-full object-cover" />
      ) : (
        <Image
          src={logoSrc || "/logo.png"}
          alt={alt}
          fill
          className="object-cover"
          sizes={`${size}px`}
          priority
          unoptimized={unoptimized}
        />
      )}
    </div>
  );
}

/**
 * Kurum logosu — 3D çift yüzlü Y ekseni dönüşü (navbar, NFC terminal vb.)
 */
export default function BrandingLogo3D({
  logoSrc = "/logo.png",
  alt = "Logo",
  size = 56,
  borderColor = "#f59e0b",
  unoptimized = false,
  className = "",
  animate = true,
}) {
  const perspective = Math.round(size * 2.5);

  if (!animate) {
    return (
      <div
        className={`relative shrink-0 ${className}`}
        style={{ width: size, height: size }}
      >
        <LogoFace3D
          logoSrc={logoSrc}
          alt={alt}
          size={size}
          borderColor={borderColor}
          unoptimized={unoptimized}
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
        className="absolute inset-0 rounded-full border-2 opacity-40 brand-logo-glow-ring pointer-events-none"
        style={{ borderColor: borderColor || "#f59e0b" }}
      />

      <div
        className="brand-logo-flip-slow relative w-full h-full"
        style={{ transformStyle: "preserve-3d" }}
      >
        <div
          className="absolute inset-0"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
          }}
        >
          <LogoFace3D
            logoSrc={logoSrc}
            alt={alt}
            size={size}
            borderColor={borderColor}
            unoptimized={unoptimized}
          />
        </div>
        <div
          className="absolute inset-0"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          <LogoFace3D
            logoSrc={logoSrc}
            alt={alt}
            size={size}
            borderColor={borderColor}
            unoptimized={unoptimized}
          />
        </div>
      </div>
    </div>
  );
}
