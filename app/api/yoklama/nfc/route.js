import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Ogrenci from "@/models/Ogrenci";
import Yoklama from "@/models/Yoklama";

export async function POST(request) {
  try {
    await dbConnect();

    let body;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json(
        { success: false, error: "Geçersiz istek gövdesi (JSON hatası)!" },
        { status: 200 }, // 400 yerine 200 dönüp mesajı ekrana basıyoruz
      );
    }

    const { cardId } = body || {};

    if (!cardId || String(cardId).trim() === "") {
      return NextResponse.json(
        { success: false, error: "Kart ID okunurken boş veri algılandı!" },
        { status: 200 },
      );
    }

    // 1. Kart ID'yi tüm gizli/özel karakterlerden (Enter, Tab vb.) temizle
    const hamCardId = String(cardId).trim();
    // Yalnızca harf ve rakamları tut (özel okuyucu eklerini temizle)
    const temizCardId = hamCardId.replace(/[^a-zA-Z0-9]/g, "");
    // Başındaki sıfırları temizlenmiş alternatif
    const sifirsizCardId = temizCardId.replace(/^0+/, "");

    console.log("📡 Okunan Kart Numaraları:", {
      hamCardId,
      temizCardId,
      sifirsizCardId,
    });

    // 2. 🔍 ESNEK ARAMA (Tüm olası kart alanlarında ve formatlarında)
    const ogrenci = await Ogrenci.findOne({
      $or: [
        { cardId: hamCardId },
        { nfcId: hamCardId },
        { nfcKartId: hamCardId },
        { cardId: temizCardId },
        { nfcId: temizCardId },
        { nfcKartId: temizCardId },
        { cardId: sifirsizCardId },
        { nfcId: sifirsizCardId },
        { nfcKartId: sifirsizCardId },
        { cardId: { $regex: new RegExp(`^${temizCardId}$`, "i") } },
        { nfcId: { $regex: new RegExp(`^${temizCardId}$`, "i") } },
        { nfcKartId: { $regex: new RegExp(`^${temizCardId}$`, "i") } },
      ],
    });

    if (!ogrenci) {
      return NextResponse.json(
        {
          success: false,
          error: `Okunan Kart ID (${temizCardId || hamCardId}) sistemde hiçbir öğrenci ile eşleşmedi! Lütfen Öğrenci Düzenle ekranından bu kart numarasını öğrenciye tanımlayınız.`,
          okunanKart: temizCardId || hamCardId,
        },
        { status: 200 },
      );
    }

    // 3. 🗓️ BUGÜNKÜ MÜKERRER YOKLAMA KONTROLÜ
    const bugunBaslangic = new Date();
    bugunBaslangic.setHours(0, 0, 0, 0);

    const bugunBitis = new Date();
    bugunBitis.setHours(23, 59, 59, 999);

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

    // 4. 📝 YENİ YOKLAMA KAYDI OLUŞTUR
    const yeniYoklama = await Yoklama.create({
      ogrenciId: ogrenci._id,
      tarih: new Date(),
      durum: "geldi",
      yoklamaTipi: "nfc",
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
      { status: 200 },
    );
  }
}
