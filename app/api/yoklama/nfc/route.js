import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Ogrenci from "@/models/Ogrenci";
import Yoklama from "@/models/Yoklama";
import { requireAuth } from "@/lib/auth";
import { findOgrenciByNfc } from "@/lib/nfc";
import { logOgrenciIslem } from "@/lib/audit";

export async function POST(request) {
  try {
    const auth = requireAuth(request);
    if (auth.error) return auth.error;

    await dbConnect();

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Geçersiz istek gövdesi (JSON hatası)!" },
        { status: 400 },
      );
    }

    const { cardId } = body || {};

    if (!cardId || String(cardId).trim() === "") {
      return NextResponse.json(
        { success: false, error: "Kart ID okunurken boş veri algılandı!" },
        { status: 400 },
      );
    }

    const ogrenci = await findOgrenciByNfc(Ogrenci, cardId);

    if (!ogrenci) {
      return NextResponse.json(
        {
          success: false,
          error: `Okunan Kart ID (${String(cardId).trim()}) sistemde hiçbir öğrenci ile eşleşmedi!`,
          okunanKart: String(cardId).trim(),
        },
        { status: 404 },
      );
    }

    const simdi = new Date();
    const bugunBaslangic = new Date(
      simdi.getFullYear(),
      simdi.getMonth(),
      simdi.getDate(),
      0,
      0,
      0,
      0,
    );
    const bugunBitis = new Date(
      simdi.getFullYear(),
      simdi.getMonth(),
      simdi.getDate(),
      23,
      59,
      59,
      999,
    );

    const mevcutYoklama = await Yoklama.findOne({
      ogrenciId: ogrenci._id,
      tarih: { $gte: bugunBaslangic, $lte: bugunBitis },
    });

    if (mevcutYoklama) {
      return NextResponse.json({
        success: true,
        zatenVar: true,
        message: `⚠️ ${ogrenci.adSoyad} için bugün zaten yoklama kaydı alınmış!`,
        ogrenci: {
          _id: ogrenci._id,
          adSoyad: ogrenci.adSoyad,
          grup: ogrenci.grup || "Grup Yok",
        },
      });
    }

    const yeniYoklama = await Yoklama.create({
      ogrenciId: ogrenci._id,
      tarih: simdi,
      durum: "geldi",
      yoklamaTipi: "nfc",
    });

    await logOgrenciIslem(auth.session, ogrenci._id, {
      islemTipi: "YOKLAMA_NFC",
      detay: `NFC kart ile yoklama alındı (${simdi.toLocaleString("tr-TR")}).`,
      entityLabel: ogrenci.adSoyad,
    });

    return NextResponse.json({
      success: true,
      ogrenci: {
        _id: ogrenci._id,
        adSoyad: ogrenci.adSoyad,
        grup: ogrenci.grup || "Grup Yok",
      },
      yoklama: yeniYoklama,
    });
  } catch (error) {
    console.error("🔴 NFC API HATASI:", error);
    return NextResponse.json(
      { success: false, error: "Sunucu hatası: " + error.message },
      { status: 500 },
    );
  }
}
