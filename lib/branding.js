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
    isletmeTamAdi: plain.isletmeTamAdi || "",
    teknikDestekAdi: plain.teknikDestekAdi || "",
    sistemBaslik: plain.sistemBaslik || "",
    sistemAciklama: plain.sistemAciklama || "",
    kayitFormUstBaslik: plain.kayitFormUstBaslik || "",
    kayitFormAltBaslik: plain.kayitFormAltBaslik || "",
    kayitFormSlogan: plain.kayitFormSlogan || "",
    raporFooterMetni: plain.raporFooterMetni || "",
    canliSiteUrl: plain.canliSiteUrl || "",
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
    isletmeTamAdi: full.isletmeTamAdi || full.salonAdi,
    teknikDestekAdi: full.teknikDestekAdi,
    kayitFormUstBaslik: full.kayitFormUstBaslik,
    kayitFormAltBaslik: full.kayitFormAltBaslik,
    kayitFormSlogan: full.kayitFormSlogan,
    raporFooterMetni: full.raporFooterMetni,
    ozellikler: sanitizeOzelliklerForClient(full.ozellikler),
  };
}

export async function getBrandingForSession(salonId, rol) {
  await dbConnect();

  let salon = salonId ? await KursSalon.findById(salonId) : null;
  if (!salon) {
    salon = await KursSalon.findOne({ durum: "aktif" }).sort({ updatedAt: -1 });
  }
  if (!salon) {
    salon = await KursSalon.findOne({}).sort({ updatedAt: -1 });
  }

  if (!salon) {
    const fallback = { ...DEFAULT_BRANDING };
    if (rol !== "developer") {
      return formatSalonBrandingForClient(
        { ...fallback, ozellikler: fallback.ozellikler || {} },
        rol,
      );
    }
    return fallback;
  }

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
    isletmeTamAdi: body.isletmeTamAdi ? String(body.isletmeTamAdi).trim() : "",
    teknikDestekAdi: body.teknikDestekAdi
      ? String(body.teknikDestekAdi).trim()
      : "",
    sistemBaslik: body.sistemBaslik ? String(body.sistemBaslik).trim() : "",
    sistemAciklama: body.sistemAciklama
      ? String(body.sistemAciklama).trim()
      : "",
    kayitFormUstBaslik: body.kayitFormUstBaslik
      ? String(body.kayitFormUstBaslik).trim()
      : "",
    kayitFormAltBaslik: body.kayitFormAltBaslik
      ? String(body.kayitFormAltBaslik).trim()
      : "",
    kayitFormSlogan: body.kayitFormSlogan
      ? String(body.kayitFormSlogan).trim()
      : "",
    raporFooterMetni: body.raporFooterMetni
      ? String(body.raporFooterMetni).trim()
      : "",
    canliSiteUrl: body.canliSiteUrl ? String(body.canliSiteUrl).trim() : "",
    ozellikler: sanitizeOzellikler(body.ozellikler),
  };
}
