import { NextResponse } from "next/server";

// 🛡️ KVKK & Gizlilik Uyumlu Auth/Oturum Rota İşleyicisi
export async function GET(request) {
  return NextResponse.json({
    success: true,
    message: "Balans Cimnastik Akademi - KVKK & Oturum Servisi Aktif",
  });
}

export async function POST(request) {
  return NextResponse.json({
    success: true,
    message: "KVKK Onay / Oturum İsteği Alındı",
  });
}
