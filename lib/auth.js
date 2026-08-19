import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

/**
 * JWT oturumunu doğrular. Geçersiz/eksik token için null döner.
 */
export function getSessionFromRequest(request) {
  const token = request.cookies.get("session_token")?.value;
  if (!token || !process.env.JWT_SECRET) return null;

  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
}

export function authError(message = "Yetkisiz erişim! Lütfen giriş yapın.") {
  return NextResponse.json({ success: false, error: message }, { status: 401 });
}

export function forbiddenError(message = "Bu işlem için yetkiniz yok.") {
  return NextResponse.json({ success: false, error: message }, { status: 403 });
}

/** Oturum zorunlu — geçerli JWT yoksa 401 döner */
export function requireAuth(request) {
  const session = getSessionFromRequest(request);
  if (!session) {
    return { error: authError() };
  }
  return { session };
}

/** Belirli rollerden biri zorunlu */
export function requireRole(request, allowedRoles) {
  const result = requireAuth(request);
  if (result.error) return result;

  if (!allowedRoles.includes(result.session.rol)) {
    return { error: forbiddenError() };
  }
  return result;
}

/** Geliştirici PIN — yalnızca env'den; varsayılan yok */
export function checkDeveloperPin(request) {
  const envPin = process.env.DEVELOPER_PIN;
  if (!envPin) return false;
  const pinHeader = request.headers.get("x-developer-pin");
  return pinHeader === envPin;
}

/** Geliştirici oturumu + PIN zorunlu */
export function requireDeveloperPin(request) {
  const result = requireRole(request, ["developer"]);
  if (result.error) return result;

  if (!checkDeveloperPin(request)) {
    return { error: forbiddenError("Geliştirici PIN kodu hatalı veya eksik.") };
  }
  return result;
}
