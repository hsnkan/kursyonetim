import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Ogrenci from "@/models/Ogrenci";

// 🛡️ Sunucu Tarafı Oturum Denetimi
function yetkiKontrolu(request) {
  const sessionToken = request.cookies.get("session_token")?.value;
  return !!sessionToken;
}

export async function PATCH(request, context) {
  try {
    if (!yetkiKontrolu(request)) {
      return NextResponse.json(
        { success: false, error: "Yetkisiz erişim! Lütfen giriş yapın." },
        { status: 401 },
      );
    }

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

    return NextResponse.json({ success: true, data: ogrenci });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
