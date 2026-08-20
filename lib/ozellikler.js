/** Anlaşmaya göre açılıp kapatılabilen modüller */
export const OZELLIK_TANIMLARI = {
  nfcYoklama: {
    label: "NFC / Kartlı Yoklama",
    aciklama: "USB okuyucu ile yoklama ekranı",
    navHref: "/dashboard/yoklama/nfc",
  },
  ogrenciYonetimi: {
    label: "Öğrenci Yönetimi",
    aciklama: "Kayıt, arşiv, NFC kart eşleştirme",
    navHref: "/dashboard/ogrenciler",
  },
  duyurular: {
    label: "Duyurular & WhatsApp",
    aciklama: "Toplu mesaj kampanyası (wa.me)",
    navHref: "/dashboard/duyurular",
  },
  raporlar: {
    label: "Raporlar",
    aciklama: "Yoklama PDF ve istatistikler",
    navHref: "/dashboard/raporlar",
  },
  muhasebe: {
    label: "Aidat & Kasa Takibi",
    aciklama: "Tahsilat paneli (resmi bilanço değil)",
    navHref: "/dashboard/muhasebe",
  },
  auditLog: {
    label: "İşlem Geçmişi",
    aciklama: "Kim ne yaptı kaydı",
    navHref: "/dashboard/audit",
  },
};

export const VARSAYILAN_OZELLIKLER = Object.fromEntries(
  Object.keys(OZELLIK_TANIMLARI).map((k) => [k, true]),
);

export function birlestirOzellikler(kaynak) {
  const birlesik = { ...VARSAYILAN_OZELLIKLER };
  if (kaynak && typeof kaynak === "object") {
    for (const key of Object.keys(OZELLIK_TANIMLARI)) {
      if (typeof kaynak[key] === "boolean") {
        birlesik[key] = kaynak[key];
      }
    }
  }
  return birlesik;
}

export function sanitizeOzellikler(body) {
  if (!body || typeof body !== "object") return { ...VARSAYILAN_OZELLIKLER };
  const sonuc = { ...VARSAYILAN_OZELLIKLER };
  for (const key of Object.keys(OZELLIK_TANIMLARI)) {
    if (typeof body[key] === "boolean") {
      sonuc[key] = body[key];
    }
  }
  return sonuc;
}

export function ozellikAktifMi(ozellikler, anahtar) {
  const birlesik = birlestirOzellikler(ozellikler);
  return birlesik[anahtar] !== false;
}

/** Geliştirici her modüle erişir; salon kullanıcısı için modül kontrolü */
export function modulErisilebilir(session, ozellikler, anahtar) {
  if (session?.rol === "developer") return true;
  return ozellikAktifMi(ozellikler, anahtar);
}
