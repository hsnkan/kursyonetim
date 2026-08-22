import dbConnect from "@/lib/db";
import mongoose from "mongoose";

const OgrenciSchema = new mongoose.Schema({}, { strict: false });
const OdemeSchema = new mongoose.Schema({}, { strict: false });

const Ogrenci =
  mongoose.models.Ogrenci || mongoose.model("Ogrenci", OgrenciSchema);
const Odeme =
  mongoose.models.Odeme ||
  mongoose.models.Muhasebe ||
  mongoose.model("Odeme", OdemeSchema);

export async function uygulaOgrenciExcelYukleme(yuklenecekler) {
  await dbConnect();
  let yuklenen = 0;

  for (const ogrenci of yuklenecekler) {
    if (!ogrenci?.adSoyad) continue;
    await Ogrenci.create({
      adSoyad: String(ogrenci.adSoyad).trim(),
      grup: ogrenci.grup ? String(ogrenci.grup) : "",
      kanGrubu: ogrenci.kanGrubu || "0 Rh+",
      lisansliMi: Boolean(ogrenci.lisansliMi),
      aylikUcret: Number(ogrenci.aylikUcret) || 2000,
      odemeGunu: Number(ogrenci.odemeGunu) || 1,
      nfcKartId: ogrenci.nfcKartId || undefined,
      veliListesi: Array.isArray(ogrenci.veliListesi)
        ? ogrenci.veliListesi
        : [],
      durum: "aktif",
    });
    yuklenen++;
  }

  return {
    success: true,
    message: `Toplam ${yuklenen} öğrenci Excel'den veritabanına aktarıldı!`,
    yuklenen,
  };
}

export async function uygulaGecmisOdemeYukleme(odemeler) {
  await dbConnect();
  const tumOgrenciler = await Ogrenci.find({});
  let basarili = 0;
  let eslesmeyen = 0;

  for (const item of odemeler) {
    const ogrenciAd = (item.adSoyad || "").trim().toLowerCase();
    if (!ogrenciAd) continue;

    const ogrenci = tumOgrenciler.find(
      (o) => (o.adSoyad || "").trim().toLowerCase() === ogrenciAd,
    );

    if (ogrenci) {
      const tutar = Number(item.tutar) || Number(ogrenci.aylikUcret) || 2000;
      const yil = Number(item.yil) || new Date().getFullYear();
      const ay = Number(item.ay) || new Date().getMonth() + 1;
      const odemeGunu = Number(item.odemeGunu) || ogrenci.odemeGunu || 1;
      const odemeTarihiObj = new Date(yil, ay - 1, odemeGunu);

      await Odeme.create({
        ogrenciId: ogrenci._id,
        tutar,
        durum: "odendi",
        yil,
        ay,
        sonOdemeTarihi: odemeTarihiObj,
        odemeTarihi: item.odemeTarihi
          ? new Date(item.odemeTarihi)
          : odemeTarihiObj,
        aciklama:
          item.aciklama || `${yil}/${ay} Dönemi Geçmiş Aidat Tahsilatı`,
        hatirlatmaGonderildi: false,
      });
      basarili++;
    } else {
      eslesmeyen++;
    }
  }

  return {
    success: true,
    message: `${basarili} adet geçmiş ödeme kaydı kasanıza başarıyla işlendi.${
      eslesmeyen > 0
        ? ` (${eslesmeyen} adet ödeme, veritabanında eşleşen öğrenci bulunamadığı için atlandı)`
        : ""
    }`,
    basarili,
    eslesmeyen,
  };
}

export async function uygulaBekleyenYukleme(kayit) {
  if (kayit.tip === "ogrenci_excel") {
    return uygulaOgrenciExcelYukleme(kayit.payload?.yuklenecekler || []);
  }
  if (kayit.tip === "gecmis_odeme_excel") {
    return uygulaGecmisOdemeYukleme(kayit.payload?.odemeler || []);
  }
  throw new Error("Geçersiz yükleme tipi.");
}
