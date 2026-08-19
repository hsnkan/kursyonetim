import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getBrandingBySalonId } from "@/lib/branding";

export async function GET(request) {
  const auth = requireAuth(request);
  if (auth.error) return auth.error;

  const branding = await getBrandingBySalonId(auth.session.salonId);

  return NextResponse.json({
    success: true,
    branding: {
      ...branding,
      salonAdi: auth.session.salonAdi || branding.salonAdi,
    },
  });
}
