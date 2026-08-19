/**
 * Kurulum bazlı işletme ayarları.
 * Tek deployment = tek işletme. Yeni işletme için env + logo değiştirilerek
 * aynı kod tabanı yeniden deploy edilir.
 */

const FALLBACK = {
  isletmeAdi: "Balans Cimnastik",
  isletmeTamAdi: "Balans Cimnastik Akademi",
  altBaslik: "Akademi Yönetim Paneli",
  logoUrl: "/logo.png",
  whatsappImza: "Balans Cimnastik Akademi 🤸‍♀️",
  temaRengi: "#f59e0b",
  teknikDestekAdi: "Teknik Destek",
  mailFromName: "Kurs Yönetim Güvenlik",
  mailFromAddress: "bildirim@ornek.com",
  mailDomainLabel: "Kurs Yönetim",
};

function env(key, fallback) {
  return (
    process.env[key] ||
    process.env[`NEXT_PUBLIC_${key}`] ||
    fallback
  );
}

export function getSiteConfig() {
  const isletmeAdi = env("SITE_ISLETME_ADI", FALLBACK.isletmeAdi);
  const isletmeTamAdi = env(
    "SITE_ISLETME_TAM_ADI",
    `${isletmeAdi} Akademi`,
  );

  return {
    isletmeAdi,
    isletmeTamAdi,
    altBaslik: env("SITE_ALT_BASLIK", FALLBACK.altBaslik),
    logoUrl: env("SITE_LOGO_URL", FALLBACK.logoUrl),
    whatsappImza:
      env("SITE_WHATSAPP_IMZA", "") ||
      `${isletmeTamAdi} 🤸‍♀️`,
    temaRengi: env("SITE_TEMA_RENGI", FALLBACK.temaRengi),
    teknikDestekAdi: env("SITE_TEKNIK_DESTEK_ADI", FALLBACK.teknikDestekAdi),
    mailFromName: env("SITE_MAIL_FROM_NAME", FALLBACK.mailFromName),
    mailFromAddress: env("SITE_MAIL_FROM_ADDRESS", FALLBACK.mailFromAddress),
    mailDomainLabel: env("SITE_MAIL_DOMAIN_LABEL", isletmeAdi),
    sistemBaslik: env(
      "SITE_SISTEM_BASLIK",
      `${isletmeAdi} - Kurs Yönetim Sistemi`,
    ),
    sistemAciklama: env(
      "SITE_SISTEM_ACIKLAMA",
      "NFC Yoklama ve Öğrenci Yönetimi",
    ),
  };
}

export function getDefaultBranding() {
  const site = getSiteConfig();
  return {
    salonAdi: site.isletmeAdi,
    altBaslik: site.altBaslik,
    logoUrl: site.logoUrl,
    logoSrc: site.logoUrl,
    telefon: "",
    email: "",
    adres: "",
    webSitesi: "",
    whatsappImza: site.whatsappImza,
    temaRengi: site.temaRengi,
  };
}

export function getMailFromHeader() {
  const site = getSiteConfig();
  return `${site.mailFromName} <${site.mailFromAddress}>`;
}

export function getSupportSessionBannerText() {
  const site = getSiteConfig();
  return `${site.teknikDestekAdi.toUpperCase()} HESABINIZDA İŞLEM YAPIYOR (2 SAATLİK SÜRELİ İZİNLİ ERİŞİM)`;
}
