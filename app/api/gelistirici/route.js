import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import mongoose from "mongoose";
import { requireDeveloperPin } from "@/lib/auth";

const OgrenciSchema = new mongoose.Schema({}, { strict: false });
const YoklamaSchema = new mongoose.Schema({}, { strict: false });
const OdemeSchema = new mongoose.Schema({}, { strict: false });

const Ogrenci =
  mongoose.models.Ogrenci || mongoose.model("Ogrenci", OgrenciSchema);
const Yoklama =
  mongoose.models.Yoklama || mongoose.model("Yoklama", YoklamaSchema);
const Odeme =
  mongoose.models.Odeme ||
  mongoose.models.Muhasebe ||
  mongoose.model("Odeme", OdemeSchema);

const TEHLIKELI_ISLEMLER = [
  "tum_verileri_sifirla",
  "tum_ogrenciler",
  "tum_yoklama",
  "bugun_yoklama",
];

export async function DELETE(request) {
  try {
    const auth = requireDeveloperPin(request);
    if (auth.error) return auth.error;

    await dbConnect();
    const { searchParams } = new URL(request.url);
    const islem = searchParams.get("islem");

    if (
      process.env.NODE_ENV === "production" &&
      TEHLIKELI_ISLEMLER.includes(islem)
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Toplu silme işlemleri canlı ortamda devre dışıdır. MongoDB Atlas yedeğinden kurtarma kullanın.",
        },
        { status: 403 },
      );
    }

    if (islem === "tum_verileri_sifirla") {
      await Promise.all([
        Ogrenci.deleteMany({}),
        Yoklama.deleteMany({}),
        Odeme.deleteMany({}),
      ]);
      return NextResponse.json({
        success: true,
        message:
          "Tüm sistem verileri (Öğrenciler, Yoklamalar ve Kasa Ödemeleri) tamamen sıfırlandı!",
      });
    }

    if (islem === "bugun_yoklama") {
      const bugunBaslangic = new Date();
      bugunBaslangic.setHours(0, 0, 0, 0);
      const bugunBitis = new Date();
      bugunBitis.setHours(23, 59, 59, 999);

      await Yoklama.deleteMany({
        tarih: { $gte: bugunBaslangic, $lte: bugunBitis },
      });
      return NextResponse.json({
        success: true,
        message: "Bugünün yoklama kayıtları temizlendi.",
      });
    }

    if (islem === "tum_yoklama") {
      await Yoklama.deleteMany({});
      return NextResponse.json({
        success: true,
        message: "Tüm yoklama geçmişi temizlendi.",
      });
    }

    if (islem === "tum_ogrenciler") {
      await Ogrenci.deleteMany({});
      return NextResponse.json({
        success: true,
        message: "Tüm öğrenciler veritabanından silindi.",
      });
    }

    return NextResponse.json(
      { success: false, error: "Geçersiz işlem parametresi!" },
      { status: 400 },
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const auth = requireDeveloperPin(request);
    if (auth.error) return auth.error;

    await dbConnect();
    const body = await request.json();

    if (body.islem === "gecmis_odeme_yukle" && Array.isArray(body.odemeler)) {
      const tumOgrenciler = await Ogrenci.find({});
      let basarili = 0;
      let eslesmeyen = 0;

      for (const item of body.odemeler) {
        const ogrenciAd = (item.adSoyad || "").trim().toLowerCase();
        if (!ogrenciAd) continue;

        const ogrenci = tumOgrenciler.find(
          (o) => (o.adSoyad || "").trim().toLowerCase() === ogrenciAd,
        );

        if (ogrenci) {
          const tutar =
            Number(item.tutar) || Number(ogrenci.aylikUcret) || 2000;
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

      return NextResponse.json({
        success: true,
        message: `${basarili} adet geçmiş ödeme kaydı kasanıza başarıyla işlendi.${
          eslesmeyen > 0
            ? ` (${eslesmeyen} adet ödeme, veritabanında eşleşen öğrenci bulunamadığı için atlandı)`
            : ""
        }`,
      });
    }

    if (Array.isArray(body.yuklenecekler)) {
      let yuklenen = 0;
      for (const ogrenci of body.yuklenecekler) {
        if (ogrenci.adSoyad) {
          await Ogrenci.create({
            adSoyad: String(ogrenci.adSoyad).trim(),
            grup: ogrenci.grup ? String(ogrenci.grup) : "",
            aylikUcret: Number(ogrenci.aylikUcret) || 2000,
            odemeGunu: Number(ogrenci.odemeGunu) || 1,
            durum: "aktif",
          });
          yuklenen++;
        }
      }

      return NextResponse.json({
        success: true,
        message: `Toplam ${yuklenen} öğrenci Excel'den veritabanına aktarıldı!`,
      });
    }

    return NextResponse.json(
      { success: false, error: "Yüklenecek veri bulunamadı!" },
      { status: 400 },
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
