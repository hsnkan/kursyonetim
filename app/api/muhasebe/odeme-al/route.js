import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Odeme from "@/models/Odeme";
import Ogrenci from "@/models/Ogrenci";

function yetkiKontrolu(request) {
  const sessionToken = request.cookies.get("session_token")?.value;
  return !!sessionToken;
}

export async function POST(request) {
  try {
    if (!yetkiKontrolu(request)) {
      return NextResponse.json(
        { success: false, error: "Yetkisiz erişim! Lütfen giriş yapın." },
        { status: 401 },
      );
    }

    await dbConnect();
    const body = await request.json();

    const { odemeId, ogrenciId, tutar, ay, yil } = body || {};

    let hedefOgrenciId = ogrenciId;

    // Eğer odemeId "sanal_" ile başlıyorsa sanal kayıttır, ID'yi ayıkla
    if (odemeId && String(odemeId).startsWith("sanal_")) {
      hedefOgrenciId = String(odemeId).replace("sanal_", "");
    }

    if (!hedefOgrenciId) {
      return NextResponse.json(
        { success: false, error: "Geçerli bir öğrenci ID bulunamadı!" },
        { status: 400 },
      );
    }

    const ogrenci = await Ogrenci.findById(hedefOgrenciId);
    if (!ogrenci) {
      return NextResponse.json(
        { success: false, error: "Öğrenci bulunamadı!" },
        { status: 404 },
      );
    }

    const simdi = new Date();
    const odemeTutar =
      Number(tutar) || Number(ogrenci.aylikUcret || ogrenci.ucret) || 0;

    // Sanal olmayan gerçek bir ödeme ID'si varsa doğrudan güncelle
    if (odemeId && !String(odemeId).startsWith("sanal_")) {
      const guncelOdeme = await Odeme.findByIdAndUpdate(
        odemeId,
        {
          durum: "odendi",
          odemeTarihi: simdi,
          tutar: odemeTutar,
        },
        { new: true },
      );

      return NextResponse.json({ success: true, data: guncelOdeme });
    }

    // Yoksa veritabanına yeni ödeme kaydı aç (Ödemesi Alındı olarak)
    const yeniOdeme = await Odeme.create({
      ogrenciId: hedefOgrenciId,
      tutar: odemeTutar,
      durum: "odendi",
      odemeTarihi: simdi,
      sonOdemeTarihi: new Date(
        yil || simdi.getFullYear(),
        (ay || simdi.getMonth() + 1) - 1,
        ogrenci.odemeGunu || 1,
      ),
      odemeYontemi: "Nakit",
      aciklama: "Kasa ekranından tahsilat alındı.",
    });

    // 📜 Öğrencinin kronolojik işlem geçmişine log ekle
    const yeniLog = {
      islemTipi: "AİDAT_TAHSİLAT",
      detay: `Aidat ödemesi tahsil edildi (${odemeTutar} ₺)`,
      tarih: simdi,
    };

    const mevcutLoglar = Array.isArray(ogrenci.islemGecmisi)
      ? ogrenci.islemGecmisi
      : [];
    await Ogrenci.findByIdAndUpdate(hedefOgrenciId, {
      islemGecmisi: [...mevcutLoglar, yeniLog],
    });

    return NextResponse.json({ success: true, data: yeniOdeme });
  } catch (error) {
    console.error("🔴 ÖDEME ALMA API HATASI:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
