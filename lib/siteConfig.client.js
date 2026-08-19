/** İstemci bileşenlerinde kullanılan varsayılan işletme bilgisi (NEXT_PUBLIC_* ) */
export const CLIENT_SITE = {
  isletmeAdi:
    process.env.NEXT_PUBLIC_SITE_ISLETME_ADI || "Balans Cimnastik",
  isletmeTamAdi:
    process.env.NEXT_PUBLIC_SITE_ISLETME_TAM_ADI ||
    "Balans Cimnastik Akademi",
  logoUrl: process.env.NEXT_PUBLIC_SITE_LOGO_URL || "/logo.png",
};
