import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import mongoose from "mongoose";

// 🛡️ Sunucu Tarafı Oturum Doğrulama Yardımcısı
function yetkiKontrolu(request) {
  const sessionToken = request.cookies.get("session_token")?.value;
  return !!sessionToken;
}

// Mongoose Grup Şeması
const GrupSchema = new mongoose.Schema(
  {
    ad: { type: String, required: true, unique: true },
    aciklama: { type: String, default: "" },
    antrenor: { type: String, default: "" },
    dersGunleri: { type: [String], default: [] },
    whatsappLink: { type: String, default: "" },
  },
  { timestamps: true },
);

const Grup = mongoose.models.Grup || mongoose.model("Grup", GrupSchema);

// 🏆 DİREKT TANIMLANAN 6 ANA GRUP LİSTESİ
const DIKREK_GRUPLAR = [
  {
    ad: "Salı–Perşembe 17:00–18:00",
    dersGunleri: ["Salı", "Perşembe"],
    whatsappLink: "",
  },
  {
    ad: "Salı–Perşembe 18:00–19:00",
    dersGunleri: ["Salı", "Perşembe"],
    whatsappLink: "",
  },
  {
    ad: "Cumartesi–Pazar 11:00–12:00",
    dersGunleri: ["Cumartesi", "Pazar"],
    whatsappLink: "",
  },
  {
    ad: "Cumartesi–Pazar 12:00–13:00",
    dersGunleri: ["Cumartesi", "Pazar"],
    whatsappLink: "",
  },
  {
    ad: "Salı–Perşembe–Cumartesi–Pazar 13:30–16:00",
    dersGunleri: ["Salı", "Perşembe", "Cumartesi", "Pazar"],
    whatsappLink: "",
  },
  {
    ad: "Pazar 10:00–11:00",
    dersGunleri: ["Pazar"],
    whatsappLink: "",
  },
];

// ==========================================
// GRUPLARI GETİR (GET)
// ==========================================
export async function GET(request) {
  try {
    if (!yetkiKontrolu(request)) {
      return NextResponse.json(
        { success: false, error: "Yetkisiz erişim! Lütfen oturum açın." },
        { status: 401 },
      );
    }

    await dbConnect();

    // Veritabanında eksik olan direkt grupları oluştur/tamamla
    for (const g of DIKREK_GRUPLAR) {
      await Grup.updateOne({ ad: g.ad }, { $setOnInsert: g }, { upsert: true });
    }

    const gruplar = await Grup.find({}).sort({ createdAt: 1 });
    return NextResponse.json({ success: true, data: gruplar });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

// ==========================================
// YENİ GRUP EKLE (POST - GELİŞTİRİCİ KORUMALI)
// ==========================================
export async function POST(request) {
  try {
    if (!yetkiKontrolu(request)) {
      return NextResponse.json(
        { success: false, error: "Yetkisiz erişim! Lütfen oturum açın." },
        { status: 401 },
      );
    }

    const pinHeader = request.headers.get("x-developer-pin");
    const beklenenPin = process.env.DEVELOPER_PIN || "2026";

    if (pinHeader !== beklenenPin) {
      return NextResponse.json(
        { success: false, error: "Geliştirici PIN kilit kodu hatalı!" },
        { status: 403 },
      );
    }

    await dbConnect();
    const body = await request.json();

    const guvenliGrupVerisi = {
      ad: body.ad ? String(body.ad).trim() : "",
      aciklama: body.aciklama ? String(body.aciklama).trim() : "",
      antrenor: body.antrenor ? String(body.antrenor).trim() : "",
      dersGunleri: Array.isArray(body.dersGunleri)
        ? body.dersGunleri.map((g) => String(g).trim())
        : [],
      whatsappLink: body.whatsappLink ? String(body.whatsappLink).trim() : "",
    };

    if (!guvenliGrupVerisi.ad) {
      return NextResponse.json(
        { success: false, error: "Grup adı zorunludur!" },
        { status: 400 },
      );
    }

    const yeniGrup = await Grup.create(guvenliGrupVerisi);
    return NextResponse.json(
      { success: true, data: yeniGrup },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

// ==========================================
// MEVCUT GRUBU GÜNCELLE (PUT - GELİŞTİRİCİ KORUMALI)
// ==========================================
export async function PUT(request) {
  try {
    if (!yetkiKontrolu(request)) {
      return NextResponse.json(
        { success: false, error: "Yetkisiz erişim! Lütfen oturum açın." },
        { status: 401 },
      );
    }

    const pinHeader = request.headers.get("x-developer-pin");
    const beklenenPin = process.env.DEVELOPER_PIN || "2026";

    if (pinHeader !== beklenenPin) {
      return NextResponse.json(
        { success: false, error: "Geliştirici PIN kilit kodu hatalı!" },
        { status: 403 },
      );
    }

    await dbConnect();
    const body = await request.json();

    if (!body._id) {
      return NextResponse.json(
        { success: false, error: "Güncellenecek grup ID'si zorunludur!" },
        { status: 400 },
      );
    }

    const guncelVeri = {
      ad: body.ad ? String(body.ad).trim() : "",
      dersGunleri: Array.isArray(body.dersGunleri)
        ? body.dersGunleri.map((g) => String(g).trim())
        : [],
      whatsappLink: body.whatsappLink ? String(body.whatsappLink).trim() : "",
    };

    const guncellenenGrup = await Grup.findByIdAndUpdate(body._id, guncelVeri, {
      new: true,
    });

    return NextResponse.json({ success: true, data: guncellenenGrup });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

// ==========================================
// GRUP SİL (DELETE - GELİŞTİRİCİ KORUMALI)
// ==========================================
export async function DELETE(request) {
  try {
    if (!yetkiKontrolu(request)) {
      return NextResponse.json(
        { success: false, error: "Yetkisiz erişim! Lütfen oturum açın." },
        { status: 401 },
      );
    }

    const pinHeader = request.headers.get("x-developer-pin");
    const beklenenPin = process.env.DEVELOPER_PIN || "2026";

    if (pinHeader !== beklenenPin) {
      return NextResponse.json(
        { success: false, error: "Geliştirici PIN kilit kodu hatalı!" },
        { status: 403 },
      );
    }

    await dbConnect();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Silinecek grup ID'si belirtilmedi!" },
        { status: 400 },
      );
    }

    await Grup.findByIdAndDelete(id);
    return NextResponse.json({
      success: true,
      message: "Grup başarıyla silindi.",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
