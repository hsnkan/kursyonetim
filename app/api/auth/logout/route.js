import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: "Oturum başarıyla kapatıldı.",
  });

  // 🛡️ Tüm oturum çerezlerini tarayıcıdan temizle
  response.cookies.set("session_token", "", {
    httpOnly: true,
    expires: new Date(0),
    path: "/",
  });

  response.cookies.set("temp_token", "", {
    httpOnly: true,
    expires: new Date(0),
    path: "/",
  });

  return response;
}
