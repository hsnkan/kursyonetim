import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Ogrenci from "@/models/Ogrenci";
import Yoklama from "@/models/Yoklama";
import { requireAuth } from "@/lib/auth";

export async function GET(request) {
  try {
    const auth = requireAuth(request);
    if (auth.error) return auth.error;

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const simdi = new Date();

    // 📅 1. GÜNLÜK YOKLAMA İÇİN TARİH PARAMS
    const secilenGun = Number(searchParams.get("gun")) || simdi.getDate();
    const secilenGunAy =
      Number(searchParams.get("gunAy")) || simdi.getMonth() + 1;
    const secilenGunYil =
      Number(searchParams.get("gunYil")) || simdi.getFullYear();

    const oGunBaslangic = new Date(
      secilenGunYil,
      secilenGunAy - 1,
      secilenGun,
      0,
      0,
      0,
      0,
    );
    const oGunBitis = new Date(
      secilenGunYil,
      secilenGunAy - 1,
      secilenGun,
      23,
      59,
      59,
      999,
    );

    // Seçilen Spesifik Günün Yoklama Kayıtları
    const gunlukYoklamaListesi = await Yoklama.find({
      tarih: { $gte: oGunBaslangic, $lte: oGunBitis },
    })
      .populate("ogrenciId", "adSoyad grup")
      .sort({ tarih: -1 });

    // 2. YENİ KAYIT FİLTRELERİ (Mevcut Mantık Korundu)
    const yeniHedefYil =
      Number(searchParams.get("yeniHedefYil")) || simdi.getFullYear();
    const yeniHedefAy =
      Number(searchParams.get("yeniHedefAy")) || simdi.getMonth() + 1;
    const yeniKiyasYil =
      Number(searchParams.get("yeniKiyasYil")) ||
      (yeniHedefAy === 1 ? yeniHedefYil - 1 : yeniHedefYil);
    const yeniKiyasAy =
      Number(searchParams.get("yeniKiyasAy")) ||
      (yeniHedefAy === 1 ? 12 : yeniHedefAy - 1);

    // 3. DONDURULAN FİLTRELERİ (Mevcut Mantık Korundu)
    const donHedefYil =
      Number(searchParams.get("donHedefYil")) || simdi.getFullYear();
    const donHedefAy =
      Number(searchParams.get("donHedefAy")) || simdi.getMonth() + 1;
    const donKiyasYil =
      Number(searchParams.get("donKiyasYil")) ||
      (donHedefAy === 1 ? donHedefYil - 1 : donHedefYil);
    const donKiyasAy =
      Number(searchParams.get("donKiyasAy")) ||
      (donHedefAy === 1 ? 12 : donHedefAy - 1);

    // TARİH ARALIKLARI
    const yeniHedefBas = new Date(yeniHedefYil, yeniHedefAy - 1, 1);
    const yeniHedefBit = new Date(
      yeniHedefYil,
      yeniHedefAy,
      0,
      23,
      59,
      59,
      999,
    );
    const yeniKiyasBas = new Date(yeniKiyasYil, yeniKiyasAy - 1, 1);
    const yeniKiyasBit = new Date(
      yeniKiyasYil,
      yeniKiyasAy,
      0,
      23,
      59,
      59,
      999,
    );

    const donHedefBas = new Date(donHedefYil, donHedefAy - 1, 1);
    const donHedefBit = new Date(donHedefYil, donHedefAy, 0, 23, 59, 59, 999);
    const donKiyasBas = new Date(donKiyasYil, donKiyasAy - 1, 1);
    const donKiyasBit = new Date(donKiyasYil, donKiyasAy, 0, 23, 59, 59, 999);

    // SORGULAR
    const toplamOgrenci = await Ogrenci.countDocuments({});
    const aktifOgrenci = await Ogrenci.countDocuments({
      $or: [
        { durum: "aktif" },
        { durum: "AKTIF" },
        { durum: { $exists: false } },
      ],
    });
    const pasifOgrenci = await Ogrenci.countDocuments({
      $or: [{ durum: "pasif" }, { durum: "PASIF" }],
    });

    const yeniHedefSayi = await Ogrenci.countDocuments({
      createdAt: { $gte: yeniHedefBas, $lte: yeniHedefBit },
    });
    const yeniKiyasSayi = await Ogrenci.countDocuments({
      createdAt: { $gte: yeniKiyasBas, $lte: yeniKiyasBit },
    });

    const donHedefSayi = await Ogrenci.countDocuments({
      $or: [{ durum: "pasif" }, { durum: "PASIF" }],
      updatedAt: { $gte: donHedefBas, $lte: donHedefBit },
    });
    const donKiyasSayi = await Ogrenci.countDocuments({
      $or: [{ durum: "pasif" }, { durum: "PASIF" }],
      updatedAt: { $gte: donKiyasBas, $lte: donKiyasBit },
    });

    const gruplar = await Ogrenci.aggregate([
      {
        $match: {
          $or: [
            { durum: "aktif" },
            { durum: "AKTIF" },
            { durum: { $exists: false } },
          ],
        },
      },
      { $group: { _id: "$grup", sayi: { $sum: 1 } } },
      { $project: { _id: 0, grup: "$_id", sayi: 1 } },
    ]);

    return NextResponse.json({
      success: true,
      data: {
        secilenGun,
        secilenGunAy,
        secilenGunYil,
        gunlukYoklamaListesi,
        toplamOgrenci,
        aktifOgrenci,
        pasifOgrenci,
        yeniHedefSayi,
        yeniKiyasSayi,
        yeniFark: yeniHedefSayi - yeniKiyasSayi,
        donHedefSayi,
        donKiyasSayi,
        donFark: donHedefSayi - donKiyasSayi,
        grupDağılimi: gruplar,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
