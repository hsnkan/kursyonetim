import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Odeme from "@/models/Odeme";
import Ogrenci from "@/models/Ogrenci";
import { requireAuth } from "@/lib/auth";

// Telefon numarasını öğrenci nesnesinin tüm olası alanlarından bulan yardımcı fonksiyon
const telefonBul = (ogrenci) => {
  if (!ogrenci) return "";
  if (ogrenci.veliTelefon) return ogrenci.veliTelefon;
  if (ogrenci.telefon) return ogrenci.telefon;

  if (Array.isArray(ogrenci.veliListesi) && ogrenci.veliListesi.length > 0) {
    for (const v of ogrenci.veliListesi) {
      if (v.telefon) return v.telefon;
      if (v.veliTelefon) return v.veliTelefon;
    }
  }
  return "";
};

// Veli adını öğrenci nesnesinin tüm olası alanlarından bulan yardımcı fonksiyon
const veliAdBul = (ogrenci) => {
  if (!ogrenci) return "Veli";
  if (ogrenci.veliAdSoyad) return ogrenci.veliAdSoyad;
  if (ogrenci.veliAdi) return ogrenci.veliAdi;

  if (Array.isArray(ogrenci.veliListesi) && ogrenci.veliListesi.length > 0) {
    for (const v of ogrenci.veliListesi) {
      if (v.adSoyad) return v.adSoyad;
      if (v.veliAdSoyad) return v.veliAdSoyad;
    }
  }
  return "Veli";
};

export async function GET(request) {
  try {
    // 🔒 Oturum Kontrolü
    const auth = requireAuth(request);
    if (auth.error) return auth.error;

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const simdi = new Date();

    const hedefYil =
      Number(searchParams.get("hedefYil")) || simdi.getFullYear();
    const hedefAy = Number(searchParams.get("hedefAy")) || simdi.getMonth() + 1;
    const kiyasYil =
      Number(searchParams.get("kiyasYil")) ||
      (hedefAy === 1 ? hedefYil - 1 : hedefYil);
    const kiyasAy =
      Number(searchParams.get("kiyasAy")) || (hedefAy === 1 ? 12 : hedefAy - 1);

    const hedefBaslangic = new Date(hedefYil, hedefAy - 1, 1, 0, 0, 0, 0);
    const hedefBitis = new Date(hedefYil, hedefAy, 0, 23, 59, 59, 999);

    const kiyasBaslangic = new Date(kiyasYil, kiyasAy - 1, 1, 0, 0, 0, 0);
    const kiyasBitis = new Date(kiyasYil, kiyasAy, 0, 23, 59, 59, 999);

    // 1. HEDEF DÖNEMDEKİ GERÇEK ÖDEME KAYITLARINI ÇEK
    let odemeler = await Odeme.find({
      $or: [
        { sonOdemeTarihi: { $gte: hedefBaslangic, $lte: hedefBitis } },
        { odemeTarihi: { $gte: hedefBaslangic, $lte: hedefBitis } },
      ],
    })
      .populate({
        path: "ogrenciId",
        model: Ogrenci,
        select:
          "adSoyad veliAdSoyad veliAdi telefon veliTelefon veliListesi grup odemeGunu aylikUcret ucret",
      })
      .sort({ createdAt: -1 });

    // 2. AKTİF ÖĞRENCİLERİ ÇEK
    const aktifOgrenciler = await Ogrenci.find({
      $or: [
        { durum: "aktif" },
        { durum: "AKTIF" },
        { durum: { $exists: false } },
      ],
    });

    const bugunGun = simdi.getDate();
    const haftaninGunu = simdi.getDay();

    // 3. ÖDEMESİ GELEN ÖĞRENCİLERİ HESAPLA
    const odemesiGelenOgrenciler = aktifOgrenciler.filter((o) => {
      const hedefGun = o.odemeGunu || 1;
      let odemesiGeldi = bugunGun >= hedefGun;

      if (!odemesiGeldi && haftaninGunu === 1) {
        const cumartesiGun = bugunGun - 2;
        const pazarGun = bugunGun - 1;
        if (hedefGun === cumartesiGun || hedefGun === pazarGun) {
          odemesiGeldi = true;
        }
      }
      return odemesiGeldi;
    });

    const kayitliOgrenciIdleri = new Set(
      odemeler.map((m) => m.ogrenciId?._id?.toString()).filter(Boolean),
    );

    // Eksik olan ödemesi gelen öğrencileri liste görünümüne sanal kayıt olarak ekle
    const sanalOdemeKayitlari = odemesiGelenOgrenciler
      .filter((o) => !kayitliOgrenciIdleri.has(o._id.toString()))
      .map((o) => ({
        _id: `sanal_${o._id}`,
        ogrenciId: {
          _id: o._id,
          adSoyad: o.adSoyad,
          veliAdi: veliAdBul(o),
          telefon: telefonBul(o),
        },
        tutar: Number(o.aylikUcret || o.ucret) || 0,
        sonOdemeTarihi: new Date(hedefYil, hedefAy - 1, o.odemeGunu || 1),
        durum: "bekliyor",
        hatirlatmaGonderildi: false,
      }));

    // Mevcut odemeler dizisindeki öğrenci kayıtlarında da eksik telefon varsa tamamla
    odemeler = odemeler.map((m) => {
      if (m.ogrenciId) {
        const tel = telefonBul(m.ogrenciId);
        const vAd = veliAdBul(m.ogrenciId);
        return {
          ...m.toObject(),
          ogrenciId: {
            ...m.ogrenciId.toObject(),
            telefon: tel,
            veliAdi: vAd,
          },
        };
      }
      return m;
    });

    const birlesikOdemeler = [...sanalOdemeKayitlari, ...odemeler];

    // 💵 FINANSAL HESAPLAMALAR
    const hedefOdemeler = await Odeme.find({
      durum: "odendi",
      odemeTarihi: { $gte: hedefBaslangic, $lte: hedefBitis },
    });

    const hedefTahsilEdilen = hedefOdemeler.reduce(
      (toplam, item) => toplam + (Number(item.tutar) || 0),
      0,
    );

    const kiyasOdemeler = await Odeme.find({
      durum: "odendi",
      odemeTarihi: { $gte: kiyasBaslangic, $lte: kiyasBitis },
    });

    const kiyasTahsilEdilen = kiyasOdemeler.reduce(
      (toplam, item) => toplam + (Number(item.tutar) || 0),
      0,
    );

    const hedefBeklenenToplam = aktifOgrenciler.reduce(
      (toplam, o) => toplam + (Number(o.aylikUcret || o.ucret) || 0),
      0,
    );

    const hedefKalanAlacak = Math.max(
      0,
      hedefBeklenenToplam - hedefTahsilEdilen,
    );

    return NextResponse.json({
      success: true,
      data: birlesikOdemeler,
      dataMali: {
        hedefYil,
        hedefAy,
        kiyasYil,
        kiyasAy,
        hedefBeklenenToplam,
        hedefTahsilEdilen,
        hedefKalanAlacak,
        kiyasTahsilEdilen,
        tahsilatFarki: hedefTahsilEdilen - kiyasTahsilEdilen,
        toplamAktifOgrenci: aktifOgrenciler.length,
        odemesiGelenSayisi: odemesiGelenOgrenciler.length,
      },
      finansalRapor: {
        buAyGelir: hedefTahsilEdilen,
        gecenAyGelir: kiyasTahsilEdilen,
        fark: hedefTahsilEdilen - kiyasTahsilEdilen,
      },
    });
  } catch (error) {
    console.error("🔴 API MUHASEBE GET HATASI:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    // 🔒 Oturum Kontrolü
    const auth = requireAuth(request);
    if (auth.error) return auth.error;

    await dbConnect();
    const body = await request.json();

    // 🛡️ Whitelist Süzgeci (Mass Assignment Koruması)
    const guvenliOdemeVerisi = {
      ogrenciId: body.ogrenciId,
      tutar: Number(body.tutar) || 0,
      odemeTarihi: body.odemeTarihi ? new Date(body.odemeTarihi) : new Date(),
      durum: body.durum === "odendi" ? "odendi" : "bekliyor",
      odemeYontemi: body.odemeYontemi || "Nakit",
      aciklama: body.aciklama ? String(body.aciklama).trim() : "",
    };

    if (!guvenliOdemeVerisi.ogrenciId) {
      return NextResponse.json(
        { success: false, error: "Öğrenci ID zorunludur!" },
        { status: 400 },
      );
    }

    const yeniOdeme = await Odeme.create(guvenliOdemeVerisi);
    return NextResponse.json(
      { success: true, data: yeniOdeme },
      { status: 201 },
    );
  } catch (error) {
    console.error("🔴 API MUHASEBE POST HATASI:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 },
    );
  }
}
