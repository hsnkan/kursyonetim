import { NextResponse } from "next/server";

// 🛡️ KVKK & Gizlilik Uyumlu Auth/Oturum Yönlendiricisi
export async function GET(request) {
  return NextResponse.json({
    success: true,
    message: "Balans Cimnastik Akademi - KVKK Aydınlatma & Yetki Doğrulama",
  });
}
