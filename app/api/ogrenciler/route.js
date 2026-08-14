import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Ogrenci from "@/models/Ogrenci";

// 🛡️ 1. Sunucu Tarafı Oturum Doğrulama Yardımcısı
function yetkiKontrolu(request) {
  const sessionToken = request.cookies.get("session_token")?.value;
  return !!sessionToken;
}

// 🛡️ 2. Whitelist: İstemciden Gelen İzinli Alanları Süzme (Mass Assignment Koruması)
function guvenliOgrenciVerisiSüz(body) {
  return {
    adSoyad: body.adSoyad ? String(body.adSoyad).trim() : "",
    dogumTarihi: body.dogumTarihi ? String(body.dogumTarihi) : "",
    yas: body.yas ? String(body.yas) : "",
    tcKimlikNo: body.tcKimlikNo ? String(body.tcKimlikNo) : "",
    kanGrubu: body.kanGrubu || "Bilinmiyor",
    lisansliMi: Boolean(body.lisansliMi),
    grup: body.grup ? String(body.grup) : "",
    aylikUcret: Number(body.aylikUcret) || 2000,
    odemeGunu: Number(body.odemeGunu) || 1,
    nfcKartId: body.nfcKartId ? String(body.nfcKartId).trim() : undefined,
    okulAnaokulu: body.okulAnaokulu ? String(body.okulAnaokulu) : "",
    sinifi: body.sinifi ? String(body.sinifi) : "",
    veliEposta: body.veliEposta ? String(body.veliEposta) : "",
    veliAdres: body.veliAdres ? String(body.veliAdres) : "",
    saglikProblemiVarMi: body.saglikProblemiVarMi || "Hayır",
    saglikAciklama: body.saglikAciklama || "",
    duzenliIlacVarMi: body.duzenliIlacVarMi || "Hayır",
    ilacAciklama: body.ilacAciklama || "",
    alerjiVarMi: body.alerjiVarMi || "Hayır",
    alerjiAciklama: body.alerjiAciklama || "",
    haftalikGunSayisi: body.haftalikGunSayisi || "2 GÜN",
    tercihGunler: body.tercihGunler || "Fark Etmez",
    hedefler: Array.isArray(body.hedefler) ? body.hedefler : [],
    cimnastikHedefi: body.cimnastikHedefi || "Hobi Olarak",
    duydugunuzYer: body.duydugunuzYer || "Tavsiye",
    fotografIznı: body.fotografIznı || "İzin Veriyorum",
    ekBilgiler: body.ekBilgiler || "",
    fotoUrl: body.fotoUrl || null,
    durum: body.durum === "pasif" ? "pasif" : "aktif",
    veliListesi: Array.isArray(body.veliListesi)
      ? body.veliListesi.map((v) => ({
          adSoyad: String(v.adSoyad || "").trim(),
          yakinlikDerecesi: String(v.yakinlikDerecesi || "Anne"),
          telefon: String(v.telefon || "").trim(),
        }))
      : [],
    islemGecmisi: Array.isArray(body.islemGecmisi) ? body.islemGecmisi : [],
  };
}

export async function GET(request) {
  try {
    // 🔒 Oturum Kontrolü
    if (!yetkiKontrolu(request)) {
      return NextResponse.json(
        { success: false, error: "Yetkisiz erişim! Lütfen oturum açın." },
        { status: 401 },
      );
    }

    await dbConnect();
    const { searchParams } = new URL(request.url);
    const durum = searchParams.get("durum") || "aktif";

    const ogrenciler = await Ogrenci.find({ durum }).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: ogrenciler });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    // 🔒 Oturum Kontrolü
    if (!yetkiKontrolu(request)) {
      return NextResponse.json(
        { success: false, error: "Yetkisiz erişim! Lütfen oturum açın." },
        { status: 401 },
      );
    }

    await dbConnect();
    const body = await request.json();

    // 🛡️ Mass Assignment Koruması
    const guvenliVeri = guvenliOgrenciVerisiSüz(body);

    if (!guvenliVeri.adSoyad) {
      return NextResponse.json(
        { success: false, error: "Öğrenci Ad Soyad zorunludur." },
        { status: 400 },
      );
    }

    const yeniOgrenci = await Ogrenci.create(guvenliVeri);
    return NextResponse.json(
      { success: true, data: yeniOgrenci },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 },
    );
  }
}
