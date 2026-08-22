import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { requireAuth } from "@/lib/auth";
import { getBrandingBySalonId } from "@/lib/branding";
import {
  isValidKullaniciAdi,
  normalizeKullaniciAdi,
} from "@/lib/kullaniciAdi";
import { isValidSecurityQuestion } from "@/lib/securityQuestions";

function normalizeEmail(value) {
  return String(value || "")
    .toLowerCase()
    .trim();
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function buildSessionCookie(user, branding) {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) return null;

  const sessionToken = jwt.sign(
    {
      userId: user._id,
      adSoyad: user.adSoyad,
      kullaniciAdi: user.kullaniciAdi || user.adSoyad,
      email: user.email,
      rol: user.rol,
      salonId: user.salonId ? String(user.salonId) : null,
      salonAdi: branding?.salonAdi || user.salonAdi || "Sistem Yönetimi",
    },
    jwtSecret,
    { expiresIn: "7d" },
  );

  return { sessionToken };
}

export async function GET(request) {
  try {
    const auth = requireAuth(request);
    if (auth.error) return auth.error;

    await dbConnect();
    const user = await User.findById(auth.session.userId).select(
      "adSoyad kullaniciAdi email kurtarmaEmail sifreDegistirmeZorunlu rol securityQuestion +securityAnswerHash",
    );

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Kullanıcı bulunamadı." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        adSoyad: user.adSoyad,
        kullaniciAdi: user.kullaniciAdi || "",
        email: user.email,
        kurtarmaEmail: user.kurtarmaEmail || "",
        sifreDegistirmeZorunlu: Boolean(user.sifreDegistirmeZorunlu),
        rol: user.rol,
        securityQuestion: user.securityQuestion || "",
        hasSecurityAnswer: Boolean(user.securityAnswerHash),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

export async function PATCH(request) {
  try {
    const auth = requireAuth(request);
    if (auth.error) return auth.error;

    if (auth.session.rol === "developer") {
      return NextResponse.json(
        {
          success: false,
          error: "Geliştirici hesabı bu ekrandan güncellenemez.",
        },
        { status: 403 },
      );
    }

    const body = await request.json();
    const {
      adSoyad,
      kullaniciAdi,
      kurtarmaEmail,
      email,
      mevcutSifre,
      yeniSifre,
      securityQuestion,
      gizliCevap,
    } = body;

    await dbConnect();
    const user = await User.findById(auth.session.userId).select(
      "+sifreHash +securityAnswerHash adSoyad kullaniciAdi email kurtarmaEmail salonId salonAdi rol sifreDegistirmeZorunlu securityQuestion",
    );

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Kullanıcı bulunamadı." },
        { status: 404 },
      );
    }

    const kullaniciAdiDegisti =
      kullaniciAdi !== undefined &&
      normalizeKullaniciAdi(kullaniciAdi) !==
        normalizeKullaniciAdi(user.kullaniciAdi || "");
    const emailDegisti =
      email !== undefined &&
      normalizeEmail(email) !== normalizeEmail(user.email);
    const sifreDegisiyor = yeniSifre && String(yeniSifre).length > 0;
    const gizliCevapDegisiyor =
      gizliCevap !== undefined && String(gizliCevap).trim().length > 0;
    const gizliSoruDegisiyor =
      securityQuestion !== undefined &&
      securityQuestion !== (user.securityQuestion || "");

    const needsPassword =
      kullaniciAdiDegisti ||
      emailDegisti ||
      sifreDegisiyor ||
      gizliCevapDegisiyor ||
      gizliSoruDegisiyor;

    if (needsPassword) {
      if (!mevcutSifre) {
        return NextResponse.json(
          {
            success: false,
            error: "Bu işlem için mevcut şifrenizi girmeniz gerekir.",
          },
          { status: 400 },
        );
      }

      const sifreDogru = await bcrypt.compare(mevcutSifre, user.sifreHash);
      if (!sifreDogru) {
        return NextResponse.json(
          { success: false, error: "Mevcut şifre hatalı." },
          { status: 401 },
        );
      }
    }

    let sessionRefresh = false;

    if (adSoyad !== undefined && String(adSoyad).trim()) {
      user.adSoyad = String(adSoyad).trim();
      sessionRefresh = true;
    }

    if (kullaniciAdi !== undefined) {
      const yeniKullaniciAdi = normalizeKullaniciAdi(kullaniciAdi);
      if (!isValidKullaniciAdi(yeniKullaniciAdi)) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Geçerli bir kullanıcı adı girin (3-40 karakter, e-posta formatı olmamalı).",
          },
          { status: 400 },
        );
      }

      if (yeniKullaniciAdi !== normalizeKullaniciAdi(user.kullaniciAdi || "")) {
        const baska = await User.findOne({
          kullaniciAdi: yeniKullaniciAdi,
          _id: { $ne: user._id },
        });
        if (baska) {
          return NextResponse.json(
            {
              success: false,
              error: "Bu kullanıcı adı başka bir hesapta kullanılıyor.",
            },
            { status: 400 },
          );
        }
        user.kullaniciAdi = yeniKullaniciAdi;
        sessionRefresh = true;
      }
    }

    if (kurtarmaEmail !== undefined) {
      const temiz = normalizeEmail(kurtarmaEmail);
      if (temiz && !isValidEmail(temiz)) {
        return NextResponse.json(
          { success: false, error: "Geçerli bir kurtarma e-postası girin." },
          { status: 400 },
        );
      }
      user.kurtarmaEmail = temiz;
    }

    if (email !== undefined) {
      const yeniEmail = normalizeEmail(email);
      if (!yeniEmail || !isValidEmail(yeniEmail)) {
        return NextResponse.json(
          { success: false, error: "Geçerli bir iletişim e-postası girin." },
          { status: 400 },
        );
      }

      if (yeniEmail !== user.email) {
        const baska = await User.findOne({
          email: yeniEmail,
          _id: { $ne: user._id },
        });
        if (baska) {
          return NextResponse.json(
            {
              success: false,
              error: "Bu e-posta adresi başka bir hesapta kullanılıyor.",
            },
            { status: 400 },
          );
        }
        user.email = yeniEmail;
        sessionRefresh = true;
      }
    }

    if (securityQuestion !== undefined) {
      if (securityQuestion && !isValidSecurityQuestion(securityQuestion)) {
        return NextResponse.json(
          { success: false, error: "Geçersiz gizli soru seçimi." },
          { status: 400 },
        );
      }
      user.securityQuestion = securityQuestion || undefined;
    }

    if (gizliCevapDegisiyor) {
      if (!securityQuestion && !user.securityQuestion) {
        return NextResponse.json(
          { success: false, error: "Önce bir gizli soru seçmelisiniz." },
          { status: 400 },
        );
      }
      user.securityAnswerHash = await bcrypt.hash(
        String(gizliCevap).trim().toLowerCase(),
        10,
      );
    }

    if (sifreDegisiyor) {
      if (String(yeniSifre).length < 6) {
        return NextResponse.json(
          { success: false, error: "Yeni şifre en az 6 karakter olmalıdır." },
          { status: 400 },
        );
      }
      user.sifreHash = await bcrypt.hash(String(yeniSifre), 10);
      user.sifreDegistirmeZorunlu = false;
    }

    await user.save();

    const branding = user.salonId
      ? await getBrandingBySalonId(user.salonId)
      : null;

    const response = NextResponse.json({
      success: true,
      message: "Hesap bilgileriniz güncellendi.",
      user: {
        adSoyad: user.adSoyad,
        kullaniciAdi: user.kullaniciAdi || "",
        email: user.email,
        kurtarmaEmail: user.kurtarmaEmail || "",
        sifreDegistirmeZorunlu: Boolean(user.sifreDegistirmeZorunlu),
        securityQuestion: user.securityQuestion || "",
        hasSecurityAnswer: Boolean(user.securityAnswerHash),
      },
    });

    if (sessionRefresh) {
      const cookieData = buildSessionCookie(user, branding);
      if (cookieData) {
        response.cookies.set("session_token", cookieData.sessionToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 24 * 7,
        });
      }
    }

    return response;
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
