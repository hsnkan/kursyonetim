import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import KursSalon from "@/models/KursSalon";
import { requireRole } from "@/lib/auth";
import { sanitizeSalonInput } from "@/lib/branding";

export async function GET(request) {
  try {
    const auth = requireRole(request, ["developer"]);
    if (auth.error) return auth.error;

    await dbConnect();
    const salonlar = await KursSalon.find({}).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: salonlar });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const auth = requireRole(request, ["developer"]);
    if (auth.error) return auth.error;

    await dbConnect();
    const body = await request.json();
    const veri = sanitizeSalonInput(body);

    if (!veri.salonAdi) {
      return NextResponse.json(
        { success: false, error: "Salon/kurs adı zorunludur." },
        { status: 400 },
      );
    }

    if (!veri.whatsappImza) {
      veri.whatsappImza = `${veri.salonAdi} 🤸‍♀️`;
    }

    const yeniSalon = await KursSalon.create(veri);
    return NextResponse.json(
      { success: true, data: yeniSalon },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 },
    );
  }
}
