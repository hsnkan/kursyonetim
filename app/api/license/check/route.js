import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { requireAuth } from "@/lib/auth";

export async function GET(request) {
  try {
    const auth = requireAuth(request);
    if (auth.error) return auth.error;

    const { session } = auth;

    if (session.rol === "developer") {
      return NextResponse.json({
        success: true,
        kalanGun: null,
        bitisTarihi: null,
        sinirsiz: true,
      });
    }

    await dbConnect();
    const user = await User.findById(session.userId).select("licenseEndDate");

    if (!user?.licenseEndDate) {
      return NextResponse.json({
        success: true,
        kalanGun: null,
        bitisTarihi: null,
      });
    }

    const bugun = new Date();
    const bitis = new Date(user.licenseEndDate);
    const kalanGun = Math.ceil((bitis - bugun) / (1000 * 60 * 60 * 24));

    return NextResponse.json({
      success: true,
      kalanGun: Math.max(kalanGun, 0),
      bitisTarihi: bitis.toLocaleDateString("tr-TR"),
      licenseExpired: kalanGun < 0,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
