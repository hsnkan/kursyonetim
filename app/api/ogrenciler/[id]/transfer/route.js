import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Ogrenci from "@/models/Ogrenci";
import { requireModule } from "@/lib/moduleGuard";
import { logOgrenciIslem } from "@/lib/audit";

export async function PATCH(request, context) {
  try {
    const auth = await requireModule(request, "ogrenciYonetimi");
    if (auth.error) return auth.error;

    await dbConnect();
    const { params } = context;
    const resolvedParams = await params;
    const id = resolvedParams.id;

    const body = await request.json();
    const yeniGrup = body.yeniGrup ? String(body.yeniGrup).trim() : null;

    if (!yeniGrup) {
      return NextResponse.json(
        { success: false, error: "Yeni grup belirtilmedi." },
        { status: 400 },
      );
    }

    const ogrenci = await Ogrenci.findById(id);
    if (!ogrenci) {
      return NextResponse.json(
        { success: false, error: "Öğrenci bulunamadı." },
        { status: 404 },
      );
    }

    // Transfer geçmişine kayıt ekle
    if (!ogrenci.grupTransferGecmisi) ogrenci.grupTransferGecmisi = [];
    ogrenci.grupTransferGecmisi.push({
      eskiGrup: ogrenci.grup,
      yeniGrup: yeniGrup,
      tarih: new Date(),
    });

    // Otomatik İşlem Geçmişi Logu
    if (!ogrenci.islemGecmisi) ogrenci.islemGecmisi = [];
    ogrenci.islemGecmisi.push({
      islemTipi: "TRANSFER",
      detay: `Grup Transferi yapıldı: '${ogrenci.grup}' ➔ '${yeniGrup}'`,
      tarih: new Date(),
    });

    ogrenci.grup = yeniGrup;
    await ogrenci.save();

    await logOgrenciIslem(auth.session, id, {
      islemTipi: "TRANSFER",
      detay: `Grup transferi: '${ogrenci.grupTransferGecmisi.at(-1)?.eskiGrup}' ➔ '${yeniGrup}'`,
      entityLabel: ogrenci.adSoyad,
    });

    return NextResponse.json({ success: true, data: ogrenci });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
