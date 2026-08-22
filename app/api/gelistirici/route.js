import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import mongoose from "mongoose";
import { requireDeveloperPin } from "@/lib/auth";
import {
  uygulaGecmisOdemeYukleme,
  uygulaOgrenciExcelYukleme,
} from "@/lib/dataUploadApply";

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
      const sonuc = await uygulaGecmisOdemeYukleme(body.odemeler);
      return NextResponse.json(sonuc);
    }

    if (Array.isArray(body.yuklenecekler)) {
      const sonuc = await uygulaOgrenciExcelYukleme(body.yuklenecekler);
      return NextResponse.json(sonuc);
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
