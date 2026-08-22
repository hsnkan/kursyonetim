import dbConnect from "@/lib/db";
import KursSalon from "@/models/KursSalon";
import User from "@/models/User";
import { getSiteConfig } from "@/lib/siteConfig";
import { formatSalonBranding, sanitizeSalonInput } from "@/lib/branding";

/** Bu deployment'taki aktif kurum kaydı */
export async function getAktifKurumSalon() {
  await dbConnect();
  const aktif = await KursSalon.findOne({ durum: "aktif" }).sort({
    updatedAt: -1,
  });
  if (aktif) return aktif;
  return KursSalon.findOne({}).sort({ updatedAt: -1 });
}

export function kurumMetinleri(salonDoc) {
  const env = getSiteConfig();
  const b = salonDoc ? formatSalonBranding(salonDoc) : null;
  const salonAdi = b?.salonAdi || env.isletmeAdi;
  const tamAd =
    b?.isletmeTamAdi ||
    salonDoc?.isletmeTamAdi ||
    env.isletmeTamAdi ||
    `${salonAdi} Akademi`;

  return {
    salonAdi,
    isletmeTamAdi: tamAd,
    altBaslik: b?.altBaslik || env.altBaslik,
    teknikDestekAdi:
      b?.teknikDestekAdi || salonDoc?.teknikDestekAdi || env.teknikDestekAdi,
    sistemBaslik:
      b?.sistemBaslik ||
      salonDoc?.sistemBaslik ||
      env.sistemBaslik ||
      `${salonAdi} - Kurs Yönetim Sistemi`,
    sistemAciklama:
      b?.sistemAciklama || salonDoc?.sistemAciklama || env.sistemAciklama,
    kayitFormUstBaslik:
      b?.kayitFormUstBaslik ||
      salonDoc?.kayitFormUstBaslik ||
      salonAdi.split(" ")[0]?.toUpperCase() ||
      salonAdi.toUpperCase(),
    kayitFormAltBaslik:
      b?.kayitFormAltBaslik ||
      salonDoc?.kayitFormAltBaslik ||
      tamAd.toUpperCase().replace(salonAdi.toUpperCase(), "").trim() ||
      "AKADEMİ",
    kayitFormSlogan:
      b?.kayitFormSlogan ||
      salonDoc?.kayitFormSlogan ||
      "★ ELİT EĞİTİM • GÜÇLÜ GELECEK • SINIRSIZ POTANSİYEL ★",
    raporFooterMetni:
      b?.raporFooterMetni ||
      salonDoc?.raporFooterMetni ||
      `${tamAd} Otomatik Rapor Sistemleri`,
    whatsappImza: b?.whatsappImza || env.whatsappImza,
  };
}

export async function getAktifKurumMetinleri() {
  const salon = await getAktifKurumSalon();
  return kurumMetinleri(salon);
}

export async function kaydetKurumYapilandirma(body) {
  await dbConnect();
  const veri = sanitizeSalonInput(body);

  if (!veri.salonAdi) {
    throw new Error("Kurum / salon adı zorunludur.");
  }

  if (!veri.isletmeTamAdi) {
    veri.isletmeTamAdi = veri.salonAdi.includes("Akademi")
      ? veri.salonAdi
      : `${veri.salonAdi} Akademi`;
  }

  if (!veri.whatsappImza) {
    veri.whatsappImza = `${veri.salonAdi} 🤸‍♀️`;
  }

  if (!veri.teknikDestekAdi) {
    veri.teknikDestekAdi = `${veri.salonAdi} Yazılım Desteği`;
  }

  if (!veri.sistemBaslik) {
    veri.sistemBaslik = `${veri.salonAdi} - Kurs Yönetim Sistemi`;
  }

  if (!veri.sistemAciklama) {
    veri.sistemAciklama = "NFC Yoklama ve Öğrenci Yönetimi";
  }

  if (!veri.raporFooterMetni) {
    veri.raporFooterMetni = `${veri.isletmeTamAdi} Otomatik Rapor Sistemleri`;
  }

  if (!veri.kayitFormUstBaslik) {
    veri.kayitFormUstBaslik =
      veri.salonAdi.split(" ")[0]?.toUpperCase() || veri.salonAdi.toUpperCase();
  }

  if (!veri.kayitFormAltBaslik) {
    veri.kayitFormAltBaslik = veri.isletmeTamAdi
      .replace(new RegExp(`^${veri.kayitFormUstBaslik}`, "i"), "")
      .trim()
      .toUpperCase() || "AKADEMİ";
  }

  veri.durum = "aktif";

  let salon = await getAktifKurumSalon();

  if (salon) {
    Object.assign(salon, veri);
    await salon.save();
  } else {
    salon = await KursSalon.create(veri);
  }

  await KursSalon.updateMany(
    { _id: { $ne: salon._id } },
    { $set: { durum: "pasif" } },
  );

  await User.updateMany(
    { salonId: salon._id },
    { $set: { salonAdi: veri.salonAdi } },
  );

  await User.updateMany(
    { salonId: null, rol: { $ne: "developer" } },
    { $set: { salonAdi: veri.salonAdi, salonId: salon._id } },
  );

  return salon;
}
