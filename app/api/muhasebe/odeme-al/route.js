import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Odeme from "@/models/Odeme";
import Ogrenci from "@/models/Ogrenci";
import { requireModule } from "@/lib/moduleGuard";
import { logOgrenciIslem } from "@/lib/audit";

export async function POST(request) {
  try {
    const auth = await requireModule(request, "muhasebe");
    if (auth.error) return auth.error;

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

      await logOgrenciIslem(auth.session, hedefOgrenciId, {
        islemTipi: "AİDAT_TAHSİLAT",
        detay: `Aidat ödemesi tahsil edildi (${odemeTutar} ₺)`,
        entityLabel: ogrenci.adSoyad,
      });

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

    await logOgrenciIslem(auth.session, hedefOgrenciId, {
      islemTipi: "AİDAT_TAHSİLAT",
      detay: `Aidat ödemesi tahsil edildi (${odemeTutar} ₺)`,
      entityLabel: ogrenci.adSoyad,
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
