import { normalizeNfcId } from "@/lib/nfc";

export function normalizeMobileCardId(raw) {
  const normalized = normalizeNfcId(raw);
  return normalized || "";
}

/** Kamera / QR / URL taramasından kart ID çıkar */
export function extractCardIdFromScan(raw) {
  if (raw == null) return "";
  const trimmed = String(raw).trim();
  if (!trimmed) return "";

  try {
    const url =
      trimmed.startsWith("http://") ||
      trimmed.startsWith("https://") ||
      trimmed.startsWith("/")
        ? new URL(
            trimmed,
            typeof window !== "undefined"
              ? window.location.origin
              : "https://local.invalid",
          )
        : trimmed.includes("cardId=")
          ? new URL(
              trimmed,
              `${typeof window !== "undefined" ? window.location.origin : "https://local.invalid"}/`,
            )
          : null;

    if (url) {
      const param =
        url.searchParams.get("cardId") ||
        url.searchParams.get("nfc") ||
        url.searchParams.get("id");
      if (param) return normalizeMobileCardId(param);
    }
  } catch {
    // URL değilse ham metin olarak devam
  }

  return normalizeMobileCardId(trimmed);
}

/** Basılı kart numarası / OCR — tek satırdan yalnızca en uzun rakam dizisi */
export function metindenKartIdCikar(text) {
  if (text == null) return "";
  const birlesik = String(text).replace(/\s+/g, "");
  const bloklar = birlesik.match(/\d{5,20}/g) || [];
  if (bloklar.length === 0) {
    const rakamlar = birlesik.replace(/\D/g, "");
    const temiz = normalizeMobileCardId(rakamlar);
    return temiz && temiz.length >= 5 ? temiz : "";
  }
  const enUzun = bloklar.reduce((a, b) => (a.length >= b.length ? a : b));
  return normalizeMobileCardId(enUzun) || "";
}

/** OCR / basılı metinden olası kart numaralarını çıkar */
export function extractCardIdsFromPrintedText(text) {
  if (text == null) return [];
  const trimmed = String(text).trim();
  const birlesik = trimmed.replace(/\s+/g, "");
  const adaylar = birlesik.match(/\d{5,20}/g) || [];
  const sonuc = new Set();
  for (const aday of adaylar) {
    const temiz = normalizeMobileCardId(aday);
    if (temiz) sonuc.add(temiz);
  }
  const genel = normalizeMobileCardId(trimmed);
  if (genel) sonuc.add(genel);
  return Array.from(sonuc);
}

export function isMobileUserAgent() {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

export function isWebNfcSupported() {
  return typeof window !== "undefined" && "NDEFReader" in window;
}

export function isIosDevice() {
  if (typeof navigator === "undefined") return false;
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export function isAndroidDevice() {
  if (typeof navigator === "undefined") return false;
  return /Android/i.test(navigator.userAgent);
}

export function isDesktopUserAgent() {
  return !isMobileUserAgent();
}
