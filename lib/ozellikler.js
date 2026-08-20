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

/** Müşteri API yanıtında yalnızca aktif modüller döner; kapalı modül adları sızmaz */
export function sanitizeOzelliklerForClient(fullOzellikler) {
  const birlesik = birlestirOzellikler(fullOzellikler);
  return Object.fromEntries(
    Object.keys(OZELLIK_TANIMLARI)
      .filter((k) => birlesik[k] !== false)
      .map((k) => [k, true]),
  );
}

export function ozellikAktifMi(ozellikler, anahtar) {
  if (!ozellikler || typeof ozellikler !== "object") {
    return VARSAYILAN_OZELLIKLER[anahtar] !== false;
  }

  const tanimliKeys = Object.keys(OZELLIK_TANIMLARI);
  const verilenKeys = Object.keys(ozellikler);
  const sparseGorunum =
    verilenKeys.length > 0 &&
    verilenKeys.every((k) => ozellikler[k] === true) &&
    verilenKeys.length < tanimliKeys.length;

  if (sparseGorunum) {
    return ozellikler[anahtar] === true;
  }

  const birlesik = birlestirOzellikler(ozellikler);
  return birlesik[anahtar] !== false;
}

export function varsayilanDashboardYolu(ozellikler) {
  const birlesik = birlestirOzellikler(ozellikler);
  for (const [anahtar, tanim] of Object.entries(OZELLIK_TANIMLARI)) {
    if (birlesik[anahtar] !== false && tanim.navHref) {
      return tanim.navHref;
    }
  }
  return "/dashboard/profil";
}

/** Geliştirici her modüle erişir; salon kullanıcısı için modül kontrolü */
export function modulErisilebilir(session, ozellikler, anahtar) {
  if (session?.rol === "developer") return true;
  return ozellikAktifMi(ozellikler, anahtar);
}
