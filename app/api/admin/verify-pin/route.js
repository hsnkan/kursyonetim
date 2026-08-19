import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";

export async function POST(request) {
  try {
    const roleCheck = requireRole(request, ["developer", "salon_yoneticisi"]);
    if (roleCheck.error) return roleCheck.error;

    const envPin = process.env.DEVELOPER_PIN;
    if (!envPin) {
      return NextResponse.json(
        {
          success: false,
          error: "DEVELOPER_PIN ortam değişkeni tanımlı değil.",
        },
        { status: 500 },
      );
    }

    const { pin } = await request.json();
    const pinHeader = request.headers.get("x-developer-pin") || pin;

    if (pinHeader && pinHeader.trim() === envPin.trim()) {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { success: false, error: "Hatalı PIN kodu!" },
      { status: 401 },
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "PIN doğrulanamadı." },
      { status: 500 },
    );
  }
}
