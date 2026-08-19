import dbConnect from "@/lib/db";
import KursSalon from "@/models/KursSalon";
import { DEFAULT_BRANDING } from "@/lib/brandingConstants";

export { DEFAULT_BRANDING };

export function resolveLogoSrc(salon) {
  if (!salon) return DEFAULT_BRANDING.logoSrc;
  if (salon.logoBase64) return salon.logoBase64;
  return salon.logoUrl || DEFAULT_BRANDING.logoUrl;
}

export function formatSalonBranding(salonDoc) {
  if (!salonDoc) return { ...DEFAULT_BRANDING };

  const plain =
    typeof salonDoc.toObject === "function" ? salonDoc.toObject() : salonDoc;

  return {
    salonId: plain._id?.toString?.() || plain._id,
    salonAdi: plain.salonAdi || DEFAULT_BRANDING.salonAdi,
    altBaslik: plain.altBaslik || DEFAULT_BRANDING.altBaslik,
    logoUrl: plain.logoUrl || DEFAULT_BRANDING.logoUrl,
    logoSrc: resolveLogoSrc(plain),
    telefon: plain.telefon || "",
    email: plain.email || "",
    adres: plain.adres || "",
    webSitesi: plain.webSitesi || "",
    whatsappImza:
      plain.whatsappImza ||
      `${plain.salonAdi || DEFAULT_BRANDING.salonAdi} 🤸‍♀️`,
    temaRengi: plain.temaRengi || DEFAULT_BRANDING.temaRengi,
    kisaKod: plain.kisaKod || "",
    notlar: plain.notlar || "",
    durum: plain.durum || "taslak",
  };
}

export async function getBrandingBySalonId(salonId) {
  if (!salonId) return { ...DEFAULT_BRANDING };
  await dbConnect();
  const salon = await KursSalon.findById(salonId);
  return formatSalonBranding(salon);
}

export function sanitizeSalonInput(body) {
  return {
    salonAdi: body.salonAdi ? String(body.salonAdi).trim() : "",
    kisaKod: body.kisaKod ? String(body.kisaKod).trim().toLowerCase() : "",
    altBaslik: body.altBaslik
      ? String(body.altBaslik).trim()
      : "Akademi Yönetim Paneli",
    logoUrl: body.logoUrl ? String(body.logoUrl).trim() : "/logo.png",
    logoBase64: body.logoBase64 ? String(body.logoBase64) : null,
    telefon: body.telefon ? String(body.telefon).trim() : "",
    email: body.email ? String(body.email).trim() : "",
    adres: body.adres ? String(body.adres).trim() : "",
    webSitesi: body.webSitesi ? String(body.webSitesi).trim() : "",
    whatsappImza: body.whatsappImza ? String(body.whatsappImza).trim() : "",
    temaRengi: body.temaRengi ? String(body.temaRengi).trim() : "#f59e0b",
    notlar: body.notlar ? String(body.notlar).trim() : "",
    durum: ["aktif", "taslak", "pasif"].includes(body.durum)
      ? body.durum
      : "taslak",
  };
}
