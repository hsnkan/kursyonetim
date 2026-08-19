import { normalizeNfcId } from "@/lib/nfc";

export function normalizeMobileCardId(raw) {
  const normalized = normalizeNfcId(raw);
  return normalized || "";
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
