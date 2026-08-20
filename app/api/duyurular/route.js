import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import mongoose from "mongoose";
import { requireModule } from "@/lib/moduleGuard";

const DuyuruSchema = new mongoose.Schema(
  {
    baslik: { type: String, required: true },
    icerik: { type: String, required: true },
    onemDerecesi: {
      type: String,
      enum: ["genel", "onemli", "acil"],
      default: "genel",
    },
    yayinlayan: { type: String, default: "Akademi Yönetimi" },
  },
  { timestamps: true },
);

const Duyuru = mongoose.models.Duyuru || mongoose.model("Duyuru", DuyuruSchema);

export async function GET(request) {
  try {
    const auth = await requireModule(request, "duyurular");
    if (auth.error) return auth.error;

    await dbConnect();
    const duyurular = await Duyuru.find({}).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: duyurular });
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

    if (!body.baslik || !body.icerik) {
      return NextResponse.json(
        { success: false, error: "Başlık ve içerik alanları zorunludur!" },
        { status: 400 },
      );
    }

    const yeniDuyuru = await Duyuru.create({
      baslik: String(body.baslik).trim(),
      icerik: String(body.icerik).trim(),
      onemDerecesi: ["genel", "onemli", "acil"].includes(body.onemDerecesi)
        ? body.onemDerecesi
        : "genel",
      yayinlayan: body.yayinlayan
        ? String(body.yayinlayan).trim()
        : "Akademi Yönetimi",
    });
    return NextResponse.json({ success: true, data: yeniDuyuru });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

export async function DELETE(request) {
  try {
    const auth = await requireModule(request, "duyurular");
    if (auth.error) return auth.error;

    await dbConnect();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID bulunamadı" },
        { status: 400 },
      );
    }

    await Duyuru.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: "Duyuru silindi" });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
