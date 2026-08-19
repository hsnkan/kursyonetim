import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { islem, email, token, gizliCevap, yeniSifre } = body;

    // 🔗 1. YÖNTEM A: E-POSTA BAĞLANTISI TIKLANDIĞINDA YENİ ŞİFREYİ KAYDETME
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

    const cleanEmail = email.toLowerCase().trim();

    // 🔑 2. YÖNTEM: İLK GİRİŞTE GEÇİCİ ŞİFRE GÜNCELLEME (YENİ EKLENDİ)
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

      user.sifreHash = await bcrypt.hash(yeniSifre, 10);
      user.sifreDegistirmeZorunlu = false; // ✅ İlk giriş şifre değiştirme zorunluluğunu kaldırıyoruz
      await user.save();

      return NextResponse.json({
        success: true,
        message:
          "Şifreniz başarıyla güncellendi! Yeni şifrenizle giriş yapabilirsiniz.",
        redirectTo: "/auth/login",
      });
    }

    // 📧 3. YÖNTEM: E-POSTA İLE SIFIRLAMA LİNKİ GÖNDERME (RESEND API)
    if (islem === "email_link_gonder") {
      const user = await User.findOne({ email: cleanEmail, durum: "aktif" });

      if (!user) {
        return NextResponse.json({
          success: true,
          message:
            "Eğer bu e-posta adresi sistemde kayıtlıysa sıfırlama bağlantısı gönderilmiştir.",
        });
      }

      const resetToken = crypto.randomBytes(32).toString("hex");
      const hashedToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");

      user.resetPasswordToken = hashedToken;
      user.resetPasswordExpires = Date.now() + 60 * 60 * 1000;
      await user.save();

      const siteUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
      const resetUrl = `${siteUrl}/auth/yeni-sifre?token=${resetToken}&email=${encodeURIComponent(user.email)}`;

      if (resend) {
        await resend.emails.send({
          from: "Balans Sistem <sistem@balansakademi.com>",
          to: user.email,
          subject: "🔑 Şifre Sıfırlama Talebi - Balans",
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
              <h2>Şifre Sıfırlama Talebi</h2>
              <p>Merhaba <strong>${user.adSoyad || user.salonAdi}</strong>,</p>
              <p>Hesabınızın şifresini sıfırlamak için aşağıdaki butona tıklayın:</p>
              <a href="${resetUrl}" style="background-color: #f59e0b; color: #000; font-weight: bold; padding: 12px 20px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 15px 0;">
                Şifremi Sıfırla
              </a>
              <p style="font-size: 12px; color: #666;">Bu bağlantı 1 saat süreyle geçerlidir.</p>
            </div>
          `,
        });
      }

      return NextResponse.json({
        success: true,
        message: "Sıfırlama bağlantısı e-posta adresinize gönderildi.",
      });
    }

    // ❓ 4. YÖNTEM: GİZLİ SORU VE CEVAP İLE SIFIRLAMA
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
