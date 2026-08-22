export function normalizeKullaniciAdi(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

export function isValidKullaniciAdi(value) {
  const temiz = normalizeKullaniciAdi(value);
  if (temiz.length < 3 || temiz.length > 40) return false;
  if (temiz.includes("@")) return false;
  return /^[a-z0-9çğıöşü\s._-]+$/i.test(temiz);
}

export function kullaniciAdiFromAdSoyad(adSoyad) {
  const slug = normalizeKullaniciAdi(adSoyad)
    .replace(/[^a-z0-9çğıöşü\s]/gi, "")
    .replace(/\s+/g, ".");
  return slug || "kullanici";
}
