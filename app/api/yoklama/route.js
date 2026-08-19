import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Ogrenci from "@/models/Ogrenci";
import Yoklama from "@/models/Yoklama";
import mongoose from "mongoose";
import { requireAuth } from "@/lib/auth";

// ==========================================================
// 1. YOKLAMA GEÇMİŞİ / GÜNLÜK - ANLIK LİSTE VE SAYIM GETİR (GET)
// ==========================================================
export async function GET(request) {
  try {
    const auth = requireAuth(request);
    if (auth.error) return auth.error;

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const ogrenciId = searchParams.get("ogrenciId");
    const tarihParam = searchParams.get("tarih"); // Örn: 2026-08-13

    let sorgu = {};

    // 🎯 SCENARIO A: Bireysel Öğrenci Yoklama Geçmişi
    if (ogrenciId) {
      const isValidObjectId = mongoose.Types.ObjectId.isValid(ogrenciId);
      sorgu = {
        $or: [
          { ogrenciId: ogrenciId },
          ...(isValidObjectId
            ? [{ ogrenciId: new mongoose.Types.ObjectId(ogrenciId) }]
            : []),
        ],
      };
    }
    // 🎯 SCENARIO B: Belirli Bir Tarih veya Bugünün (Anlık) Tüm Yoklama Sayımı
    else {
      let hedefTarih = new Date();
      if (tarihParam) {
        const [yil, ay, gun] = tarihParam.split("-");
        hedefTarih = new Date(yil, parseInt(ay) - 1, gun);
      }

      const baslangic = new Date(
        hedefTarih.getFullYear(),
        hedefTarih.getMonth(),
        hedefTarih.getDate(),
        0,
        0,
        0,
        0,
      );
      const bitis = new Date(
        hedefTarih.getFullYear(),
        hedefTarih.getMonth(),
        hedefTarih.getDate(),
        23,
        59,
        59,
        999,
      );

      sorgu = { tarih: { $gte: baslangic, $lte: bitis } };
    }

    const yoklamalar = await Yoklama.find(sorgu).sort({ tarih: -1 }).lean();

    // 🏆 Öğrenci Detaylarını (Ad Soyad, Grup) Yoklama Kayıtlarıyla Birleştir
    const ogrenciIdleri = [
      ...new Set(yoklamalar.map((y) => y.ogrenciId).filter((id) => id != null)),
    ];

    const ogrenciler = await Ogrenci.find({
      _id: { $in: ogrenciIdleri },
    })
      .select("adSoyad grup")
      .lean();

    const ogrenciMap = {};
    ogrenciler.forEach((o) => {
      ogrenciMap[o._id.toString()] = o;
    });

    const birlesikYoklamalar = yoklamalar.map((y) => {
      const ogr = y.ogrenciId ? ogrenciMap[y.ogrenciId.toString()] : null;
      return {
        ...y,
        ogrenciAdSoyad: ogr?.adSoyad || y.ogrenciAdSoyad || "Bilinmeyen Sporcu",
        grup: ogr?.grup || y.grup || "Grup Yok",
      };
    });

    return NextResponse.json({
      success: true,
      toplamSayi: birlesikYoklamalar.length, // Personelin anlık girenleri sayabilmesi için
      data: birlesikYoklamalar || [],
    });
  } catch (error) {
    console.error("🔴 GET YOKLAMA HATASI:", error);
    return NextResponse.json(
      { success: false, error: error.message, data: [] },
      { status: 500 },
    );
  }
}
