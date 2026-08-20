import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Ogrenci from "@/models/Ogrenci";
import MesajKampanya from "@/models/MesajKampanya";
import { requireModule } from "@/lib/moduleGuard";
import { logAudit } from "@/lib/audit";
import {
  buildVeliMesaji,
  buildWaMeLink,
  extractVelilerFromOgrenci,
} from "@/lib/whatsapp";

export async function GET(request) {
  try {
    const auth = await requireModule(request, "duyurular");
    if (auth.error) return auth.error;

    await dbConnect();
    const limit = Math.min(Number(new URL(request.url).searchParams.get("limit")) || 20, 100);

    const kampanyalar = await MesajKampanya.find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .select("-kayitlar")
      .lean();

    return NextResponse.json({ success: true, data: kampanyalar });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const auth = await requireModule(request, "duyurular");
    if (auth.error) return auth.error;

    await dbConnect();
    const body = await request.json();
    const { grupAdi, sablon, mesajMetni, aliciKeys } = body;

    if (!grupAdi || !mesajMetni?.trim()) {
      return NextResponse.json(
        { success: false, error: "Grup adı ve mesaj metni zorunludur." },
        { status: 400 },
      );
    }

    const ogrenciler = await Ogrenci.find({ grup: grupAdi, durum: "aktif" }).lean();
    let tumVeliler = [];

    ogrenciler.forEach((o) => {
      tumVeliler = tumVeliler.concat(extractVelilerFromOgrenci(o));
    });

    const hedefVeliler =
      Array.isArray(aliciKeys) && aliciKeys.length > 0
        ? tumVeliler.filter((v) => aliciKeys.includes(v.uniqueKey))
        : tumVeliler;

    if (hedefVeliler.length === 0) {
      return NextResponse.json(
        { success: false, error: "Gönderilecek veli bulunamadı." },
        { status: 400 },
      );
    }

    const kayitlar = hedefVeliler.map((v) => {
      const mesaj = buildVeliMesaji({
        veliAdSoyad: v.veliAdSoyad,
        yakinlik: v.yakinlik,
        ogrenciAdSoyad: v.ogrenciAdSoyad,
        grupAdi,
        mesajMetni: mesajMetni.trim(),
      });

      return {
        ogrenciId: v.ogrenciId,
        ogrenciAdSoyad: v.ogrenciAdSoyad,
        veliAdSoyad: v.veliAdSoyad,
        yakinlik: v.yakinlik,
        telefon: v.telefon,
        mesajMetni: mesaj,
        waLink: buildWaMeLink(v.telefon, mesaj),
        durum: "bekliyor",
      };
    }).filter((k) => k.waLink);

    const kampanya = await MesajKampanya.create({
      grupAdi,
      sablon: sablon || "GENEL",
      mesajMetni: mesajMetni.trim(),
      gonderenId: auth.session.userId ? String(auth.session.userId) : null,
      gonderenAdSoyad: auth.session.adSoyad || auth.session.email || "Kullanıcı",
      durum: "hazir",
      toplamAlici: kayitlar.length,
      gonderilenSayisi: 0,
      kayitlar,
    });

    await logAudit(auth.session, {
      action: "WHATSAPP_KAMPANYA_OLUSTUR",
      entityType: "MesajKampanya",
      entityId: kampanya._id,
      entityLabel: grupAdi,
      detay: `${grupAdi} grubuna ${kayitlar.length} veli için toplu mesaj kampanyası oluşturuldu.`,
      metadata: { sablon: sablon || "GENEL", toplamAlici: kayitlar.length },
    });

    return NextResponse.json({
      success: true,
      data: {
        kampanyaId: kampanya._id,
        grupAdi,
        toplamAlici: kayitlar.length,
        kayitlar: kampanya.kayitlar.map((k, idx) => ({
          kayitId: k._id,
          index: idx,
          ogrenciAdSoyad: k.ogrenciAdSoyad,
          veliAdSoyad: k.veliAdSoyad,
          telefon: k.telefon,
          waLink: k.waLink,
          durum: k.durum,
        })),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
