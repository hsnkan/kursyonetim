import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getBrandingForSession } from "@/lib/branding";

export async function GET(request) {
  const auth = requireAuth(request);
  if (auth.error) return auth.error;

  const branding = await getBrandingForSession(
    auth.session.salonId,
    auth.session.rol,
  );

  return NextResponse.json({
    success: true,
    branding: {
      ...branding,
      salonAdi: auth.session.salonAdi || branding.salonAdi,
    },
  });
}
