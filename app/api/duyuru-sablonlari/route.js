import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import KursSalon from "@/models/KursSalon";
import { requireModule } from "@/lib/moduleGuard";
import {
  birlestirDuyuruSablonlari,
  DUYURU_SABLON_ANAHTARLARI,
} from "@/lib/duyuruSablonlari";

async function getSalonForSession(session) {
  if (session.salonId) {
    return KursSalon.findById(session.salonId);
  }
  return KursSalon.findOne({ durum: "aktif" }).sort({ updatedAt: -1 });
}

export async function GET(request) {
  try {
    const auth = await requireModule(request, "duyurular");
    if (auth.error) return auth.error;

    await dbConnect();
    const salon = await getSalonForSession(auth.session);
    const salonAdi = salon?.salonAdi || "Akademimiz";
    const sablonlar = birlestirDuyuruSablonlari(
      salon?.duyuruSablonlari,
      salonAdi,
    );

    return NextResponse.json({ success: true, data: sablonlar });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

export async function PATCH(request) {
  try {
    const auth = await requireModule(request, "duyurular");
    if (auth.error) return auth.error;

    const body = await request.json();
    const { anahtar, baslik, icerik } = body;

    if (!anahtar || !DUYURU_SABLON_ANAHTARLARI.includes(anahtar)) {
      return NextResponse.json(
        { success: false, error: "Geçersiz duyuru şablonu." },
        { status: 400 },
      );
    }

    if (!baslik?.trim() || !icerik?.trim()) {
      return NextResponse.json(
        { success: false, error: "Duyuru başlığı ve metni zorunludur." },
        { status: 400 },
      );
    }

    await dbConnect();
    const salon = await getSalonForSession(auth.session);
    if (!salon) {
      return NextResponse.json(
        { success: false, error: "Salon kaydı bulunamadı." },
        { status: 404 },
      );
    }

    const mevcut = salon.duyuruSablonlari || {};
    mevcut[anahtar] = {
      baslik: String(baslik).trim(),
      icerik: String(icerik).trim(),
    };
    salon.duyuruSablonlari = mevcut;
    await salon.save();

    const birlesik = birlestirDuyuruSablonlari(
      salon.duyuruSablonlari,
      salon.salonAdi,
    );

    return NextResponse.json({
      success: true,
      message: "Duyuru şablonu kaydedildi.",
      data: birlesik,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
