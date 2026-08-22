/**
 * Geliştirici (Eagle Software) marka ve iletişim bilgileri.
 * Geliştirici paneli ve teknik destek alanlarında kullanılır.
 */

export const GELISTIRICI_BRANDING = {
  firmaAdi: "Eagle Software",
  altBaslik: "Freelance Yazılım Hizmetleri",
  telefon: "05377329384",
  telefonUluslararasi: "905377329384",
  email: "hsnkan7@gmail.com",
  kartvizitUrl: "/developer/eagle-kartvizit.png",
  logoUrl: "/developer/eagle-logo-coin.png",
  temaRengi: "#d4af37",
  vurguRengi: "#22d3ee",
};

export function getGelistiriciWhatsappUrl(mesaj = "") {
  const tel = GELISTIRICI_BRANDING.telefonUluslararasi;
  const text = mesaj || `${GELISTIRICI_BRANDING.firmaAdi} — teknik destek`;
  return `https://wa.me/${tel}?text=${encodeURIComponent(text)}`;
}

export function getGelistiriciMailUrl(konu = "Kurs Yönetim — Teknik Destek") {
  return `mailto:${GELISTIRICI_BRANDING.email}?subject=${encodeURIComponent(konu)}`;
}
