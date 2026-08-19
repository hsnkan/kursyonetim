import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/db";
import Gorevli from "@/models/Gorevli";
import { requireAuth } from "@/lib/auth";

export async function GET(request) {
  try {
    const auth = requireAuth(request);
    if (auth.error) return auth.error;

    await dbConnect();
    const gorevliler = await Gorevli.find({ durum: "aktif" }).sort({
      adSoyad: 1,
    });

    return NextResponse.json({ success: true, data: gorevliler });
  } catch (error) {
    console.error("GET /api/gorevliler Hata:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Görevli listesi alınırken sunucu hatası oluştu.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const auth = requireAuth(request);
    if (auth.error) return auth.error;

    await dbConnect();
    const body = await request.json();

    if (
      !body.adSoyad ||
      typeof body.adSoyad !== "string" ||
      !body.adSoyad.trim()
    ) {
      return NextResponse.json(
        { success: false, error: "Geçerli bir görevli adı girmelisiniz." },
        { status: 400 },
      );
    }

    const temizAdSoyad = body.adSoyad.trim();
    const temizUnvan =
      typeof body.unvan === "string" && body.unvan.trim()
        ? body.unvan.trim()
        : "Antrenör";

    const yeniGorevli = await Gorevli.create({
      adSoyad: temizAdSoyad,
      unvan: temizUnvan,
      durum: "aktif",
    });

    return NextResponse.json(
      { success: true, data: yeniGorevli },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/gorevliler Hata:", error);
    return NextResponse.json(
      { success: false, error: "Görevli eklenirken bir hata oluştu." },
      { status: 400 },
    );
  }
}

export async function DELETE(request) {
  try {
    const auth = requireAuth(request);
    if (auth.error) return auth.error;

    await dbConnect();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Silinecek görevli ID'si belirtilmedi." },
        { status: 400 },
      );
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Geçersiz görevli ID formatı." },
        { status: 400 },
      );
    }

    const silinen = await Gorevli.findByIdAndDelete(id);

    if (!silinen) {
      return NextResponse.json(
        { success: false, error: "Silinecek görevli bulunamadı." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Görevli başarıyla silindi.",
    });
  } catch (error) {
    console.error("DELETE /api/gorevliler Hata:", error);
    return NextResponse.json(
      { success: false, error: "Görevli silinirken sunucu hatası oluştu." },
      { status: 500 },
    );
  }
}
