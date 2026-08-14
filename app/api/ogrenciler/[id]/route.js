import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Ogrenci from "@/models/Ogrenci";

// 🛡️ Sunucu Tarafı Oturum Denetimi
function yetkiKontrolu(request) {
  const sessionToken = request.cookies.get("session_token")?.value;
  return !!sessionToken;
}

// 🛡️ Whitelist: Güncellenebilir İzinli Alanları Süzme (Mass Assignment Koruması)
function guvenliGuncellemeSüz(body) {
  const guncelData = {};

  if (body.adSoyad !== undefined)
    guncelData.adSoyad = String(body.adSoyad).trim();
  if (body.dogumTarihi !== undefined)
    guncelData.dogumTarihi = String(body.dogumTarihi);
  if (body.yas !== undefined) guncelData.yas = String(body.yas);
  if (body.tcKimlikNo !== undefined)
    guncelData.tcKimlikNo = String(body.tcKimlikNo);
  if (body.kanGrubu !== undefined) guncelData.kanGrubu = String(body.kanGrubu);
  if (body.lisansliMi !== undefined)
    guncelData.lisansliMi = Boolean(body.lisansliMi);
  if (body.grup !== undefined) guncelData.grup = String(body.grup);
  if (body.aylikUcret !== undefined)
    guncelData.aylikUcret = Number(body.aylikUcret);
  if (body.odemeGunu !== undefined)
    guncelData.odemeGunu = Number(body.odemeGunu);
  if (body.nfcKartId !== undefined)
    guncelData.nfcKartId = body.nfcKartId
      ? String(body.nfcKartId).trim()
      : undefined;
  if (body.okulAnaokulu !== undefined)
    guncelData.okulAnaokulu = String(body.okulAnaokulu);
  if (body.sinifi !== undefined) guncelData.sinifi = String(body.sinifi);
  if (body.veliEposta !== undefined)
    guncelData.veliEposta = String(body.veliEposta);
  if (body.veliAdres !== undefined)
    guncelData.veliAdres = String(body.veliAdres);
  if (body.saglikProblemiVarMi !== undefined)
    guncelData.saglikProblemiVarMi = String(body.saglikProblemiVarMi);
  if (body.saglikAciklama !== undefined)
    guncelData.saglikAciklama = String(body.saglikAciklama);
  if (body.duzenliIlacVarMi !== undefined)
    guncelData.duzenliIlacVarMi = String(body.duzenliIlacVarMi);
  if (body.ilacAciklama !== undefined)
    guncelData.ilacAciklama = String(body.ilacAciklama);
  if (body.alerjiVarMi !== undefined)
    guncelData.alerjiVarMi = String(body.alerjiVarMi);
  if (body.alerjiAciklama !== undefined)
    guncelData.alerjiAciklama = String(body.alerjiAciklama);
  if (body.haftalikGunSayisi !== undefined)
    guncelData.haftalikGunSayisi = String(body.haftalikGunSayisi);
  if (body.tercihGunler !== undefined)
    guncelData.tercihGunler = String(body.tercihGunler);
  if (body.hedefler !== undefined && Array.isArray(body.hedefler))
    guncelData.hedefler = body.hedefler;
  if (body.cimnastikHedefi !== undefined)
    guncelData.cimnastikHedefi = String(body.cimnastikHedefi);
  if (body.duydugunuzYer !== undefined)
    guncelData.duydugunuzYer = String(body.duydugunuzYer);
  if (body.fotografIznı !== undefined)
    guncelData.fotografIznı = String(body.fotografIznı);
  if (body.ekBilgiler !== undefined)
    guncelData.ekBilgiler = String(body.ekBilgiler);
  if (body.fotoUrl !== undefined) guncelData.fotoUrl = body.fotoUrl;
  if (body.durum !== undefined)
    guncelData.durum = body.durum === "pasif" ? "pasif" : "aktif";
  if (body.veliListesi !== undefined && Array.isArray(body.veliListesi)) {
    guncelData.veliListesi = body.veliListesi.map((v) => ({
      adSoyad: String(v.adSoyad || "").trim(),
      yakinlikDerecesi: String(v.yakinlikDerecesi || "Anne"),
      telefon: String(v.telefon || "").trim(),
    }));
  }
  if (body.islemGecmisi !== undefined && Array.isArray(body.islemGecmisi)) {
    guncelData.islemGecmisi = body.islemGecmisi;
  }

  return guncelData;
}

// 🗑️ ÖĞRENCİ SİLME (DELETE)
export async function DELETE(request, context) {
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

    const silinen = await Ogrenci.findByIdAndDelete(id);

    if (!silinen) {
      return NextResponse.json(
        { success: false, error: "Öğrenci bulunamadı" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, message: "Öğrenci silindi" });
  } catch (error) {
    console.error("Silme Hatası:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

// ✏️ ÖĞRENCİ BİLGİLERİNİ GÜNCELLEME (PUT)
export async function PUT(request, context) {
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
    const guvenliVeri = guvenliGuncellemeSüz(body);

    const guncellenen = await Ogrenci.findByIdAndUpdate(
      id,
      { $set: guvenliVeri },
      { new: true, runValidators: true },
    );

    if (!guncellenen) {
      return NextResponse.json(
        { success: false, error: "Öğrenci bulunamadı" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: guncellenen });
  } catch (error) {
    console.error("Güncelleme Hatası:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

// ⏸️ ÖĞRENCİ DONDURMA / DURUM DEĞİŞTİRME (PATCH)
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
    const guncelData = {};

    if (body.durum)
      guncelData.durum = body.durum === "pasif" ? "pasif" : "aktif";
    if (body.islemGecmisi && Array.isArray(body.islemGecmisi)) {
      guncelData.islemGecmisi = body.islemGecmisi;
    }

    const guncellenen = await Ogrenci.findByIdAndUpdate(
      id,
      { $set: guncelData },
      { new: true },
    );

    if (!guncellenen) {
      return NextResponse.json(
        { success: false, error: "Öğrenci bulunamadı" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: guncellenen });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
