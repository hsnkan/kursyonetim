import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { requireAuth } from "@/lib/auth";
import {
  calculateRemainingLicenseDays,
  isLicenseWarningPeriod,
} from "@/lib/license";

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
        uyariGerekli: false,
      });
    }

    await dbConnect();
    const user = await User.findById(session.userId).select("licenseEndDate");

    if (!user?.licenseEndDate) {
      return NextResponse.json({
        success: true,
        kalanGun: null,
        bitisTarihi: null,
        uyariGerekli: false,
      });
    }

    const bitis = new Date(user.licenseEndDate);
    const kalanGun = calculateRemainingLicenseDays(user.licenseEndDate);
    const uyariGerekli = isLicenseWarningPeriod(user.licenseEndDate);

    return NextResponse.json({
      success: true,
      kalanGun: kalanGun === null ? null : Math.max(kalanGun, 0),
      bitisTarihi: bitis.toLocaleDateString("tr-TR"),
      licenseExpired: kalanGun !== null && kalanGun < 0,
      uyariGerekli,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
