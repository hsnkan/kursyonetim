import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Ogrenci from "@/models/Ogrenci";
import Yoklama from "@/models/Yoklama";
import mongoose from "mongoose";

// 🛡️ Sunucu Tarafı Oturum Denetimi Yardımcısı
function yetkiKontrolu(request) {
  const sessionToken = request.cookies.get("session_token")?.value;
  return !!sessionToken;
}

// ==========================================================
// 1. YOKLAMA GEÇMİŞİ / GÜNLÜK - ANLIK LİSTE VE SAYIM GETİR (GET)
// ==========================================================
export async function GET(request) {
  try {
    // 🔒 Oturum Kontrolü
    if (!yetkiKontrolu(request)) {
      return NextResponse.json(
        { success: false, error: "Yetkisiz erişim! Lütfen giriş yapın." },
        { status: 401 },
      );
    }

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

// ==========================================================
// 2. NFC KART İLE YOKLAMA AL (POST)
// ==========================================================
export async function POST(request) {
  try {
    // 🔒 Oturum Kontrolü
    if (!yetkiKontrolu(request)) {
      return NextResponse.json(
        { success: false, error: "Yetkisiz erişim! Lütfen giriş yapın." },
        { status: 401 },
      );
    }

    await dbConnect();

    let body;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json(
        { success: false, error: "Geçersiz istek gövdesi (JSON hatası)!" },
        { status: 400 },
      );
    }

    const { cardId } = body || {};

    if (!cardId || String(cardId).trim() === "") {
      return NextResponse.json(
        { success: false, error: "Kart ID'si gönderilmedi!" },
        { status: 400 },
      );
    }

    // 1. Kart ID temizleme
    const hamCardId = String(cardId).trim();
    const temizCardId = hamCardId.replace(/[^a-zA-Z0-9]/g, "");
    const sifirsizCardId = temizCardId.replace(/^0+/, "");

    // 2. 🔍 GÜVENLİ VE TAM EŞLEŞMELİ ÖĞRENCİ ARAMASI
    const aramaParametreleri = Array.from(
      new Set(
        [
          hamCardId,
          temizCardId,
          sifirsizCardId,
          hamCardId.toLowerCase(),
          temizCardId.toLowerCase(),
          sifirsizCardId.toLowerCase(),
        ].filter(Boolean),
      ),
    );

    const ogrenci = await Ogrenci.findOne({
      $or: [
        { nfcKartId: { $in: aramaParametreleri } },
        { cardId: { $in: aramaParametreleri } },
        { nfcId: { $in: aramaParametreleri } },
      ],
    });

    if (!ogrenci) {
      return NextResponse.json(
        {
          success: false,
          error: `Okunan Kart ID (${temizCardId || hamCardId}) sistemde hiçbir öğrenci ile eşleşmedi. Lütfen Öğrenci Düzenle ekranından bu kart ID'sini öğrenciye tanımlayınız.`,
          okunanKart: temizCardId || hamCardId,
        },
        { status: 404 },
      );
    }

    // 3. 🗓️ MÜKERRER KONTROLÜ (Aynı gün içinde tekrar kart okutma engeli)
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

    // 4. 📝 YENİ YOKLAMA KAYDI OLUŞTURMA
    const yeniYoklama = await Yoklama.create({
      ogrenciId: ogrenci._id,
      tarih: simdi,
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
    console.error("🔴 NFC YOKLAMA API HATASI:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
