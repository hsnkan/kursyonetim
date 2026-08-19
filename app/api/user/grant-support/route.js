import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/db";
import User from "@/models/User";

export async function POST() {
  try {
    await dbConnect();
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Oturum bulunamadı." },
        { status: 401 },
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Şu andan itibaren 2 saat sonrasını hesaplıyoruz
    const twoHoursLater = new Date(Date.now() + 2 * 60 * 60 * 1000);

    const updatedUser = await User.findByIdAndUpdate(
      decoded.userId,
      { supportAccessGrantedUntil: twoHoursLater },
      { new: true },
    );

    return NextResponse.json({
      success: true,
      message:
        "Balans Yazılım Desteği için 2 saatlik erişim izni başarıyla tanımlandı!",
      until: updatedUser.supportAccessGrantedUntil,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
