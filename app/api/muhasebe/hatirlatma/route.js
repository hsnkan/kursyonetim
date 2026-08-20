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
    const { odemeId } = await request.json();

    if (!odemeId) {
      return NextResponse.json(
        { success: false, error: "Ödeme ID zorunludur." },
        { status: 400 },
      );
    }

    const guncelOdeme = await Odeme.findByIdAndUpdate(
      odemeId,
      {
        hatirlatmaGonderildi: true,
        hatirlatmaTarihi: new Date(),
      },
      { new: true },
    );

    if (guncelOdeme?.ogrenciId) {
      const ogrenci = await Ogrenci.findById(guncelOdeme.ogrenciId);
      if (ogrenci) {
        await logOgrenciIslem(auth.session, ogrenci._id, {
          islemTipi: "AİDAT_HATIRLATMA",
          detay: `Aidat hatırlatma mesajı gönderildi (${guncelOdeme.tutar} ₺)`,
          entityLabel: ogrenci.adSoyad,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Hatırlatma mesajı gönderildi olarak işaretlendi.",
      data: guncelOdeme,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 },
    );
  }
}
