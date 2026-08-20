import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import MesajKampanya from "@/models/MesajKampanya";
import { requireModule } from "@/lib/moduleGuard";
import { logAudit } from "@/lib/audit";

export async function GET(request, context) {
  try {
    const auth = await requireModule(request, "duyurular");
    if (auth.error) return auth.error;

    await dbConnect();
    const { params } = context;
    const resolvedParams = await params;
    const id = resolvedParams.id;

    const kampanya = await MesajKampanya.findById(id).lean();
    if (!kampanya) {
      return NextResponse.json(
        { success: false, error: "Kampanya bulunamadı." },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: kampanya });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

export async function PATCH(request, context) {
  try {
    const auth = await requireModule(request, "duyurular");
    if (auth.error) return auth.error;

    await dbConnect();
    const { params } = context;
    const resolvedParams = await params;
    const kampanyaId = resolvedParams.id;
    const body = await request.json();
    const { kayitId, durum } = body;

    if (!kayitId) {
      return NextResponse.json(
        { success: false, error: "kayitId zorunludur." },
        { status: 400 },
      );
    }

    const kampanya = await MesajKampanya.findById(kampanyaId);
    if (!kampanya) {
      return NextResponse.json(
        { success: false, error: "Kampanya bulunamadı." },
        { status: 404 },
      );
    }

    const kayit = kampanya.kayitlar.id(kayitId);
    if (!kayit) {
      return NextResponse.json(
        { success: false, error: "Mesaj kaydı bulunamadı." },
        { status: 404 },
      );
    }

    kayit.durum = durum === "hata" ? "hata" : "gonderildi";
    kayit.gonderimTarihi = new Date();
    if (body.hataMesaji) kayit.hataMesaji = String(body.hataMesaji);

    kampanya.gonderilenSayisi = kampanya.kayitlar.filter(
      (k) => k.durum === "gonderildi",
    ).length;

    if (kampanya.gonderilenSayisi >= kampanya.toplamAlici) {
      kampanya.durum = "tamamlandi";
    } else if (kampanya.gonderilenSayisi > 0) {
      kampanya.durum = "gonderiliyor";
    }

    await kampanya.save();

    await logAudit(auth.session, {
      action: "WHATSAPP_MESAJ_GONDERILDI",
      entityType: "MesajKampanya",
      entityId: kampanyaId,
      entityLabel: kampanya.grupAdi,
      detay: `${kayit.veliAdSoyad} (${kayit.ogrenciAdSoyad}) — mesaj gönderildi olarak işaretlendi.`,
      metadata: { kayitId, telefon: kayit.telefon },
    });

    return NextResponse.json({
      success: true,
      data: {
        kampanyaId,
        gonderilenSayisi: kampanya.gonderilenSayisi,
        toplamAlici: kampanya.toplamAlici,
        durum: kampanya.durum,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
