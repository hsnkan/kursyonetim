import dbConnect from "@/lib/db";
import KursSalon from "@/models/KursSalon";
import { DEFAULT_BRANDING } from "@/lib/brandingConstants";
import { birlestirOzellikler, sanitizeOzellikler, sanitizeOzelliklerForClient } from "@/lib/ozellikler";

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
    musteriEmail: plain.musteriEmail || "",
    gelistiriciEmail: plain.gelistiriciEmail || "",
    kurtarmaEmail: plain.kurtarmaEmail || "",
    kurtarmaTelefon: plain.kurtarmaTelefon || "",
    mailFromName: plain.mailFromName || "",
    mailFromAddress: plain.mailFromAddress || "",
    kurulumNotu: plain.kurulumNotu || "",
    ozellikler: birlestirOzellikler(plain.ozellikler),
  };
}

export async function getBrandingBySalonId(salonId) {
  if (!salonId) return { ...DEFAULT_BRANDING };
  await dbConnect();
  const salon = await KursSalon.findById(salonId);
  return formatSalonBranding(salon);
}

/** Müşteriye teknik/kurtarma alanları ve kapalı modül adları sızdırmaz */
export function formatSalonBrandingForClient(salonDoc, rol) {
  const full = formatSalonBranding(salonDoc);
  if (rol === "developer") return full;

  return {
    salonAdi: full.salonAdi,
    altBaslik: full.altBaslik,
    logoUrl: full.logoUrl,
    logoSrc: full.logoSrc,
    telefon: full.telefon,
    email: full.email,
    adres: full.adres,
    webSitesi: full.webSitesi,
    whatsappImza: full.whatsappImza,
    temaRengi: full.temaRengi,
    ozellikler: sanitizeOzelliklerForClient(full.ozellikler),
  };
}

export async function getBrandingForSession(salonId, rol) {
  if (!salonId) {
    const fallback = { ...DEFAULT_BRANDING };
    if (rol !== "developer") {
      return formatSalonBrandingForClient(
        { ...fallback, ozellikler: fallback.ozellikler || {} },
        rol,
      );
    }
    return fallback;
  }
  await dbConnect();
  const salon = await KursSalon.findById(salonId);
  return formatSalonBrandingForClient(salon, rol);
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
    musteriEmail: body.musteriEmail ? String(body.musteriEmail).trim() : "",
    gelistiriciEmail: body.gelistiriciEmail
      ? String(body.gelistiriciEmail).trim()
      : "",
    kurtarmaEmail: body.kurtarmaEmail ? String(body.kurtarmaEmail).trim() : "",
    kurtarmaTelefon: body.kurtarmaTelefon
      ? String(body.kurtarmaTelefon).trim()
      : "",
    mailFromName: body.mailFromName ? String(body.mailFromName).trim() : "",
    mailFromAddress: body.mailFromAddress
      ? String(body.mailFromAddress).trim()
      : "",
    kurulumNotu: body.kurulumNotu ? String(body.kurulumNotu).trim() : "",
    ozellikler: sanitizeOzellikler(body.ozellikler),
  };
}
