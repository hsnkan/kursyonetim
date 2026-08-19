/** Telefon numarasını wa.me formatına çevirir */
import { DEFAULT_BRANDING } from "@/lib/brandingConstants";

export function normalizePhone(telefon) {
  if (!telefon) return null;
  const temiz = String(telefon).replace(/\D/g, "");
  if (!temiz) return null;
  return temiz.startsWith("90") ? temiz : `90${temiz}`;
}

export function buildVeliMesaji({
  veliAdSoyad,
  yakinlik,
  ogrenciAdSoyad,
  grupAdi,
  mesajMetni,
  whatsappImza = DEFAULT_BRANDING.whatsappImza,
}) {
  return `Sayın ${veliAdSoyad} (${yakinlik}),\n\n*${ogrenciAdSoyad}* sporcumuzun kayıtlı olduğu *${grupAdi}* grubu duyurusudur:\n\n${mesajMetni}\n\n${whatsappImza}`;
}

export function buildWaMeLink(telefon, mesaj) {
  const tel = normalizePhone(telefon);
  if (!tel) return null;
  return `https://wa.me/${tel}?text=${encodeURIComponent(mesaj)}`;
}

/** Öğrenci nesnesinden veli listesi çıkarır */
export function extractVelilerFromOgrenci(ogrenci) {
  const veliler = [];

  if (Array.isArray(ogrenci.veliListesi) && ogrenci.veliListesi.length > 0) {
    ogrenci.veliListesi.forEach((v, idx) => {
      const telefon = v.telefon || v.veliTelefon;
      if (!telefon) return;
      veliler.push({
        uniqueKey: `${ogrenci._id}_v_${idx}`,
        ogrenciId: String(ogrenci._id),
        ogrenciAdSoyad: ogrenci.adSoyad,
        veliAdSoyad: v.adSoyad || v.veliAdSoyad || "Veli",
        yakinlik: v.yakinlikDerecesi || v.yakinlik || "Veli",
        telefon,
      });
    });
  } else if (ogrenci.veliTelefon || ogrenci.telefon) {
    veliler.push({
      uniqueKey: `${ogrenci._id}_v_0`,
      ogrenciId: String(ogrenci._id),
      ogrenciAdSoyad: ogrenci.adSoyad,
      veliAdSoyad: ogrenci.veliAdSoyad || "Veli",
      yakinlik: "Veli",
      telefon: ogrenci.veliTelefon || ogrenci.telefon,
    });
  }

  return veliler;
}
