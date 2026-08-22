import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import KursSalon from "@/models/KursSalon";
import bcrypt from "bcryptjs";
import { requireRole } from "@/lib/auth";
import { createInitialLicenseEndDate } from "@/lib/license";
import {
  isValidKullaniciAdi,
  kullaniciAdiFromAdSoyad,
  normalizeKullaniciAdi,
} from "@/lib/kullaniciAdi";

export async function GET(request) {
  try {
    const auth = requireRole(request, ["developer"]);
    if (auth.error) return auth.error;

    await dbConnect();
    const users = await User.find({ rol: { $ne: "developer" } })
      .select("-sifreHash -securityAnswerHash")
      .populate("salonId", "salonAdi kisaKod durum")
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: users });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const auth = requireRole(request, ["developer"]);
    if (auth.error) return auth.error;

    const { salonId, salonAdi, adSoyad, kullaniciAdi, email, sabitSifre } =
      await request.json();

    if ((!salonId && !salonAdi) || !email || !sabitSifre) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Salon seçimi (veya salon adı), iletişim e-postası ve geçici şifre zorunludur.",
        },
        { status: 400 },
      );
    }

    const temizKullaniciAdi = normalizeKullaniciAdi(
      kullaniciAdi || kullaniciAdiFromAdSoyad(adSoyad || email.split("@")[0]),
    );

    if (!isValidKullaniciAdi(temizKullaniciAdi)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Geçerli bir kullanıcı adı girin (3-40 karakter, e-posta formatı olmamalı).",
        },
        { status: 400 },
      );
    }

    await dbConnect();

    let hedefSalonAdi = salonAdi;
    let hedefSalonId = salonId || null;

    if (salonId) {
      const salon = await KursSalon.findById(salonId);
      if (!salon) {
        return NextResponse.json(
          { success: false, error: "Seçilen salon kaydı bulunamadı." },
          { status: 404 },
        );
      }
      hedefSalonAdi = salon.salonAdi;
      hedefSalonId = salon._id;
    }

    const mevcutKullaniciAdi = await User.findOne({
      kullaniciAdi: temizKullaniciAdi,
    });
    if (mevcutKullaniciAdi) {
      return NextResponse.json(
        {
          success: false,
          error: "Bu kullanıcı adı zaten kullanılıyor.",
        },
        { status: 400 },
      );
    }

    const mevcutUser = await User.findOne({
      email: email.toLowerCase().trim(),
    });
    if (mevcutUser) {
      return NextResponse.json(
        {
          success: false,
          error: "Bu e-posta adresiyle zaten kayıtlı bir kullanıcı var.",
        },
        { status: 400 },
      );
    }

    const sifreHash = await bcrypt.hash(sabitSifre, 10);
    const lisansBitis = createInitialLicenseEndDate();

    const newUser = await User.create({
      salonId: hedefSalonId,
      salonAdi: hedefSalonAdi,
      adSoyad: adSoyad || temizKullaniciAdi,
      kullaniciAdi: temizKullaniciAdi,
      email: email.toLowerCase().trim(),
      sifreHash,
      licenseEndDate: lisansBitis,
      sifreDegistirmeZorunlu: true,
      rol: "salon_yoneticisi",
      durum: "aktif",
    });

    return NextResponse.json({ success: true, data: newUser });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

export async function PATCH(request) {
  try {
    const auth = requireRole(request, ["developer"]);
    if (auth.error) return auth.error;

    const { userId, salonAdi, adSoyad, kullaniciAdi, email, geciciSifre } =
      await request.json();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Kullanıcı ID'si zorunludur." },
        { status: 400 },
      );
    }

    await dbConnect();

    const updateFields = {};
    if (salonAdi) updateFields.salonAdi = salonAdi;
    if (adSoyad) updateFields.adSoyad = adSoyad;
    if (kullaniciAdi) {
      const temiz = normalizeKullaniciAdi(kullaniciAdi);
      if (!isValidKullaniciAdi(temiz)) {
        return NextResponse.json(
          { success: false, error: "Geçersiz kullanıcı adı." },
          { status: 400 },
        );
      }
      const baska = await User.findOne({
        kullaniciAdi: temiz,
        _id: { $ne: userId },
      });
      if (baska) {
        return NextResponse.json(
          { success: false, error: "Bu kullanıcı adı zaten kullanılıyor." },
          { status: 400 },
        );
      }
      updateFields.kullaniciAdi = temiz;
    }
    if (email) updateFields.email = email.toLowerCase().trim();

    if (geciciSifre && geciciSifre.trim() !== "") {
      updateFields.sifreHash = await bcrypt.hash(geciciSifre, 10);
      updateFields.sifreDegistirmeZorunlu = true;
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateFields },
      { new: true },
    );

    if (!updatedUser) {
      return NextResponse.json(
        { success: false, error: "Güncellenecek kullanıcı bulunamadı." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Kullanıcı bilgileri başarıyla güncellendi.",
      data: updatedUser,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
