import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { getBrandingBySalonId } from "@/lib/branding";
import { sendPasswordResetEmail } from "@/lib/mail";

function normalizeEmail(value) {
  return String(value || "")
    .toLowerCase()
    .trim();
}

async function findUserByLoginOrRecovery(email) {
  const clean = normalizeEmail(email);
  if (!clean) return null;
  return User.findOne({
    durum: "aktif",
    $or: [{ email: clean }, { kurtarmaEmail: clean }],
  });
}

export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { islem, email, token, gizliCevap, yeniSifre } = body;

    if (islem === "token_sifre_guncelle") {
      if (!token || !yeniSifre) {
        return NextResponse.json(
          {
            success: false,
            error: "Geçersiz istek. Token ve yeni şifre zorunludur.",
          },
          { status: 400 },
        );
      }

      if (yeniSifre.length < 6) {
        return NextResponse.json(
          { success: false, error: "Yeni şifre en az 6 karakter olmalıdır." },
          { status: 400 },
        );
      }

      const hashedToken = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

      const user = await User.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpires: { $gt: Date.now() },
      });

      if (!user) {
        return NextResponse.json(
          {
            success: false,
            error: "Şifre sıfırlama bağlantısının süresi dolmuş veya geçersiz.",
          },
          { status: 400 },
        );
      }

      user.sifreHash = await bcrypt.hash(yeniSifre, 10);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      user.sifreDegistirmeZorunlu = false;
      await user.save();

      return NextResponse.json({
        success: true,
        message: "Şifreniz başarıyla sıfırlandı! Giriş yapabilirsiniz.",
        redirectTo: "/auth/login",
      });
    }

    if (!email) {
      return NextResponse.json(
        { success: false, error: "E-posta adresi zorunludur." },
        { status: 400 },
      );
    }

    const cleanEmail = normalizeEmail(email);

    if (islem === "sifre_guncelle") {
      if (!yeniSifre || yeniSifre.length < 6) {
        return NextResponse.json(
          { success: false, error: "Yeni şifre en az 6 karakter olmalıdır." },
          { status: 400 },
        );
      }

      const user = await User.findOne({ email: cleanEmail, durum: "aktif" });

      if (!user) {
        return NextResponse.json(
          { success: false, error: "Kullanıcı bulunamadı." },
          { status: 404 },
        );
      }

      if (!user.sifreDegistirmeZorunlu) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Bu ekran yalnızca ilk giriş / geçici şifre değişimi içindir. Profil sayfasından veya şifremi unuttum ile güncelleyin.",
          },
          { status: 403 },
        );
      }

      user.sifreHash = await bcrypt.hash(yeniSifre, 10);
      user.sifreDegistirmeZorunlu = false;
      await user.save();

      return NextResponse.json({
        success: true,
        message:
          "Şifreniz başarıyla güncellendi! Yeni şifrenizle giriş yapabilirsiniz.",
        redirectTo: "/auth/login",
      });
    }

    if (islem === "email_link_gonder") {
      const user = await findUserByLoginOrRecovery(cleanEmail);

      if (!user) {
        return NextResponse.json({
          success: true,
          message:
            "Eğer bu e-posta adresi sistemde kayıtlıysa sıfırlama bağlantısı gönderilmiştir.",
        });
      }

      const hedefEmail = user.kurtarmaEmail || user.email;

      const resetToken = crypto.randomBytes(32).toString("hex");
      const hashedToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");

      user.resetPasswordToken = hashedToken;
      user.resetPasswordExpires = Date.now() + 60 * 60 * 1000;
      await user.save();

      const siteUrl =
        process.env.NEXTAUTH_URL ||
        process.env.NEXT_PUBLIC_SITE_URL ||
        "http://localhost:3000";
      const resetUrl = `${siteUrl}/auth/yeni-sifre?token=${resetToken}&email=${encodeURIComponent(user.email)}`;

      const branding = user.salonId
        ? await getBrandingBySalonId(user.salonId)
        : null;

      const mailResult = await sendPasswordResetEmail({
        to: hedefEmail,
        adSoyad: user.adSoyad,
        salonAdi: user.salonAdi,
        resetUrl,
        salonBranding: branding,
      });

      if (!mailResult.sent) {
        console.error("Şifre sıfırlama maili gönderilemedi:", mailResult.reason);
        return NextResponse.json(
          {
            success: false,
            error:
              mailResult.reason === "no_resend_or_recipient"
                ? "E-posta servisi yapılandırılmamış. Lütfen sistem yöneticinizle iletişime geçin."
                : "Sıfırlama e-postası gönderilemedi. Lütfen daha sonra tekrar deneyin.",
          },
          { status: 503 },
        );
      }

      return NextResponse.json({
        success: true,
        message: user.kurtarmaEmail
          ? "Sıfırlama bağlantısı kurtarma e-posta adresinize gönderildi."
          : "Sıfırlama bağlantısı e-posta adresinize gönderildi.",
      });
    }

    if (islem === "gizli_soru_sifirla") {
      if (!gizliCevap || !yeniSifre) {
        return NextResponse.json(
          { success: false, error: "Tüm alanların doldurulması zorunludur." },
          { status: 400 },
        );
      }

      if (yeniSifre.length < 6) {
        return NextResponse.json(
          { success: false, error: "Yeni şifre en az 6 karakter olmalıdır." },
          { status: 400 },
        );
      }

      const user = await User.findOne({
        email: cleanEmail,
        durum: "aktif",
      }).select("+securityAnswerHash");

      if (!user || !user.securityAnswerHash) {
        return NextResponse.json(
          {
            success: false,
            error: "Kullanıcı bulunamadı veya tanımlı gizli soru yok.",
          },
          { status: 400 },
        );
      }

      const cevapDogru = await bcrypt.compare(
        gizliCevap.trim().toLowerCase(),
        user.securityAnswerHash,
      );

      if (!cevapDogru) {
        return NextResponse.json(
          { success: false, error: "Gizli soru cevabı hatalı!" },
          { status: 401 },
        );
      }

      user.sifreHash = await bcrypt.hash(yeniSifre, 10);
      user.sifreDegistirmeZorunlu = false;
      await user.save();

      return NextResponse.json({
        success: true,
        message:
          "Şifreniz başarıyla güncellendi! Yeni şifrenizle giriş yapabilirsiniz.",
        redirectTo: "/auth/login",
      });
    }

    return NextResponse.json(
      { success: false, error: "Geçersiz işlem tipi." },
      { status: 400 },
    );
  } catch (error) {
    console.error("Şifre Sıfırlama Hata:", error);
    return NextResponse.json(
      { success: false, error: "Şifre sıfırlanırken sunucu hatası oluştu." },
      { status: 500 },
    );
  }
}
