"use client";

import Image from "next/image";
import {
  GELISTIRICI_BRANDING,
  getGelistiriciMailUrl,
  getGelistiriciWhatsappUrl,
} from "@/lib/gelistiriciBranding";

export function GelistiriciLogo({ size = 56, className = "" }) {
  return (
    <div
      className={`relative overflow-hidden rounded-full border-2 border-amber-500/60 shadow-lg shadow-amber-500/10 bg-slate-950 shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <Image
        src={GELISTIRICI_BRANDING.logoUrl}
        alt={`${GELISTIRICI_BRANDING.firmaAdi} logo`}
        fill
        className="object-cover object-[center_28%] scale-[2.8]"
        sizes={`${size}px`}
        priority
      />
    </div>
  );
}

const ACiklama = {
  gelistirici:
    "Teknik destek, kurulum, lisans uzatma ve yazılım güncellemeleri için aşağıdaki kanallardan ulaşabilirsiniz.",
  musteri:
    "Lisans uzatma, teknik destek, kurulum ve yazılım güncellemeleri için yazılım geliştiricinizle aşağıdaki kanallardan iletişime geçebilirsiniz.",
};

export default function GelistiriciKartvizit({
  compact = false,
  variant = "gelistirici",
}) {
  const { firmaAdi, altBaslik, telefon, email, kartvizitUrl } =
    GELISTIRICI_BRANDING;
  const aciklama = ACiklama[variant] || ACiklama.gelistirici;

  if (compact) {
    return (
      <div className="flex items-center gap-3 min-w-0">
        <GelistiriciLogo size={52} />
        <div className="min-w-0">
          <p className="text-sm font-black text-amber-400 uppercase tracking-wide truncate">
            {firmaAdi}
          </p>
          <p className="text-[10px] text-slate-400 font-semibold truncate">
            {altBaslik}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 md:p-6 shadow-2xl space-y-4">
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        <div className="w-full lg:max-w-xl shrink-0">
          <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden border border-amber-500/30 shadow-xl">
            <Image
              src={kartvizitUrl}
              alt={`${firmaAdi} kartvizit`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 560px"
            />
          </div>
        </div>

        <div className="flex-1 space-y-4 min-w-0">
          <div className="flex items-center gap-3">
            <GelistiriciLogo size={64} />
            <div>
              <h2 className="text-xl font-black text-amber-400 uppercase tracking-wide">
                {firmaAdi}
              </h2>
              <p className="text-xs text-cyan-300/90 font-bold uppercase tracking-wider">
                {altBaslik}
              </p>
            </div>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">{aciklama}</p>

          <div className="space-y-2 text-sm">
            <a
              href={getGelistiriciWhatsappUrl(
                variant === "musteri"
                  ? "Merhaba, kurs yönetim yazılımı hakkında destek almak istiyorum."
                  : "",
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 font-bold transition"
            >
              <span>💬</span>
              <span>WhatsApp: {telefon}</span>
            </a>
            <a
              href={`tel:+${GELISTIRICI_BRANDING.telefonUluslararasi}`}
              className="flex items-center gap-2 text-amber-300 hover:text-amber-200 font-bold transition"
            >
              <span>📞</span>
              <span>{telefon}</span>
            </a>
            <a
              href={getGelistiriciMailUrl(
                variant === "musteri"
                  ? "Kurs Yönetim — Destek Talebi"
                  : "Kurs Yönetim — Teknik Destek",
              )}
              className="flex items-center gap-2 text-sky-400 hover:text-sky-300 font-bold transition break-all"
            >
              <span>✉️</span>
              <span>{email}</span>
            </a>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <a
              href={getGelistiriciWhatsappUrl(
                variant === "musteri"
                  ? "Merhaba, kurs yönetim yazılımı hakkında destek almak istiyorum."
                  : "",
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-4 py-2 rounded-xl text-xs cursor-pointer"
            >
              WhatsApp ile Yaz
            </a>
            <a
              href={getGelistiriciMailUrl(
                variant === "musteri"
                  ? "Kurs Yönetim — Destek Talebi"
                  : "Kurs Yönetim — Teknik Destek",
              )}
              className="bg-slate-800 hover:bg-slate-700 text-amber-300 font-black px-4 py-2 rounded-xl text-xs border border-slate-600 cursor-pointer"
            >
              E-Posta Gönder
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
