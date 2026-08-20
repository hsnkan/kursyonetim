import { requireAuth, forbiddenError } from "@/lib/auth";
import { getBrandingBySalonId } from "@/lib/branding";
import { ozellikAktifMi } from "@/lib/ozellikler";

export { SAYFA_MODUL_HARITASI, pathnameModulAnahtari } from "@/lib/modulePaths";

/** API rotalarında sözleşmeye göre modül kontrolü (yalnızca sunucu) */
export async function requireModule(request, anahtar) {
  const auth = requireAuth(request);
  if (auth.error) return auth;

  if (auth.session.rol === "developer") {
    return auth;
  }

  const branding = await getBrandingBySalonId(auth.session.salonId);
  if (!ozellikAktifMi(branding.ozellikler, anahtar)) {
    return {
      error: forbiddenError("Bu modül sözleşmenizde aktif değildir."),
    };
  }

  return auth;
}
