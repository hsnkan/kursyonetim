import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

export async function GET(request) {
  const auth = requireAuth(request);
  if (auth.error) return auth.error;

  const { session } = auth;

  return NextResponse.json({
    success: true,
    user: {
      userId: session.userId,
      adSoyad: session.adSoyad,
      email: session.email,
      rol: session.rol,
      salonAdi: session.salonAdi,
    },
  });
}
