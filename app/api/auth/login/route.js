import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getBrandingBySalonId } from "@/lib/branding";

export async function POST(request) {
  try {
    // 🛡️ JWT_SECRET Kontrolü
    if (!process.env.JWT_SECRET) {
      console.error("CRITICAL ERROR: JWT_SECRET ortam değişkeni eksik!");
      return NextResponse.json(
        { success: false, error: "Sunucu güvenlik yapılandırması eksik." },
        { status: 500 },
      );
    }

    const jwtSecret = process.env.JWT_SECRET;
    await dbConnect();

    const body = await request.json();
    const username = body.username || body.email;
    const password = body.password || body.sifre;
    const { deviceId } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: "Kullanıcı adı ve şifre girilmelidir." },
        { status: 400 },
      );
    }

    // 👑 1. GELİŞTİRİCİ (ADMIN ENV) KONTROLÜ
    const isAdminEnv =
      process.env.ADMIN_USERNAME &&
      process.env.ADMIN_PASSWORD &&
      username.trim() === process.env.ADMIN_USERNAME.trim() &&
      password === process.env.ADMIN_PASSWORD;

    let user = null;
    let isMatch = false;
    let userRole = "salon_yoneticisi";

    if (isAdminEnv) {
      isMatch = true;
      userRole = "developer";
      user = await User.findOne({ email: username.toLowerCase().trim() });
    } else {
      // 🔍 2. Normal Müşteri Doğrulaması
      user = await User.findOne({
        $or: [
          { email: username.toLowerCase().trim() },
          { adSoyad: username.trim() },
          { username: username.trim() },
        ],
        durum: "aktif",
      }).select(
        "+sifreHash +twoFactorEnabled +twoFactorSecret +trustedDevices +licenseEndDate +sifreDegistirmeZorunlu",
      );

      if (user && user.sifreHash) {
        isMatch = await bcrypt.compare(password, user.sifreHash);
        userRole = user.rol || "salon_yoneticisi";
      }
    }

    if (!isMatch) {
      return NextResponse.json(
        { success: false, error: "Kullanıcı adı veya şifre hatalı!" },
        { status: 401 },
      );
    }

    // 🔑 3. ZORUNLU ŞİFRE DEĞİŞTİRME KONTROLÜ
    if (userRole !== "developer" && user?.sifreDegistirmeZorunlu) {
      const tempToken = jwt.sign(
        { userId: user._id, step: "password_reset_pending" },
        jwtSecret,
        { expiresIn: "15m" },
      );

      const response = NextResponse.json({
        success: true,
        requirePasswordChange: true,
        tempToken,
        redirectTo: "/auth/sifre-guncelle",
        message:
          "Geçici şifre ile giriş yaptınız. Lütfen devam etmek için yeni şifrenizi belirleyin.",
      });

      // 🛡️ Şifre güncelleme için geçici HttpOnly Çerez
      response.cookies.set("temp_token", tempToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 15, // 15 Dakika
      });

      return response;
    }

    // 💳 4. LİSANS SÜRESİ KONTROLÜ
    if (userRole !== "developer" && user?.licenseEndDate) {
      const bugun = new Date();
      const lisansBitis = new Date(user.licenseEndDate);

      if (lisansBitis < bugun) {
        return NextResponse.json(
          {
            success: false,
            error:
              "⚠️ Lisans süreniz dolmuştur! Sistem erişimi için teknik servis ile iletişime geçiniz.",
            licenseExpired: true,
          },
          { status: 403 },
        );
      }
    }

    // 🛡️ 5. 2FA (GOOGLE AUTHENTICATOR) KONTROLÜ
    if (userRole !== "developer" && user && user.twoFactorEnabled) {
      const bugun = new Date();
      const guvenliCihazMi = user.trustedDevices?.some(
        (device) =>
          device.deviceId === deviceId && new Date(device.expiresAt) > bugun,
      );

      if (!guvenliCihazMi) {
        // 🔑 Token içine email verisi de eklendi
        const tempToken = jwt.sign(
          { userId: user._id, email: user.email, step: "2fa_pending" },
          jwtSecret,
          { expiresIn: "5m" },
        );

        return NextResponse.json({
          success: true,
          requireTwoFactor: true,
          tempToken,
          redirectTo: "/auth/2fa",
          message:
            "Lütfen Google Authenticator uygulamanızdaki 6 haneli doğrulama kodunu girin.",
        });
      }
    }

    // 🎯 6. TAM BAŞARILI GİRİŞ & SESSION TOKEN OLUŞTURMA
    const fallbackDevId = "000000000000000000000000";
    const branding =
      userRole !== "developer" && user?.salonId
        ? await getBrandingBySalonId(user.salonId)
        : null;

    const sessionToken = jwt.sign(
      {
        userId: user ? user._id : fallbackDevId,
        adSoyad: user ? user.adSoyad : "Geliştirici / Teknik Servis",
        email: user ? user.email : process.env.ADMIN_USERNAME,
        rol: userRole,
        salonId: user?.salonId ? String(user.salonId) : null,
        salonAdi: branding?.salonAdi || user?.salonAdi || "Sistem Yönetimi",
      },
      jwtSecret,
      { expiresIn: "7d" },
    );

    const targetRedirect =
      userRole === "developer"
        ? "/admin/kullanicilar"
        : "/dashboard/yoklama/nfc";

    const response = NextResponse.json({
      success: true,
      message: "Giriş başarılı",
      redirectTo: targetRedirect,
      user: {
        adSoyad: user ? user.adSoyad : "Geliştirici / Teknik Servis",
        email: user ? user.email : process.env.ADMIN_USERNAME,
        rol: userRole,
      },
    });

    response.cookies.set("session_token", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 Gün
    });

    return response;
  } catch (error) {
    const errInfo = {
      name: error?.name,
      message: error?.message,
      code: error?.code,
    };
    console.error("Login API Hata:", errInfo, error);
    // #region agent log
    fetch("http://127.0.0.1:7509/ingest/b658938a-a4df-4187-b293-73636f9d4d0a", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "b3fe49",
      },
      body: JSON.stringify({
        sessionId: "b3fe49",
        runId: "login-error",
        hypothesisId: "A",
        location: "app/api/auth/login/route.js:catch",
        message: "Login failed with server error",
        data: {
          hasMongoUri: Boolean(process.env.MONGODB_URI),
          hasJwtSecret: Boolean(process.env.JWT_SECRET),
          ...errInfo,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    return NextResponse.json(
      { success: false, error: "Giriş işlemi sırasında sunucu hatası oluştu." },
      { status: 500 },
    );
  }
}
