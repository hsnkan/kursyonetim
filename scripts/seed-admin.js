import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import dbConnect from "../lib/db.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";

async function adminOlustur() {
  try {
    await dbConnect();

    const musteriEmail = "akademibalans@gmail.com";
    const geciciSifre = "Balans2026!";
    const gizliCevap = "balans2026";

    const varMi = await User.findOne({ email: musteriEmail });
    if (varMi) {
      console.log("⚠️ Bu e-posta adresiyle zaten kayıtlı bir kullanıcı var!");
      process.exit(0);
    }

    const sifreHash = await bcrypt.hash(geciciSifre, 10);
    const securityAnswerHash = await bcrypt.hash(gizliCevap, 10);

    const yeniAdmin = await User.create({
      adSoyad: "Balans Akademi Yöneticisi",
      email: musteriEmail,
      sifreHash: sifreHash,
      sifreDegistirmeZorunlu: true, // 🔑 İlk girişte şifre değiştirme zorunlu
      rol: "salon_yoneticisi",
      salonAdi: "Balans Cimnastik Akademisi",
      securityQuestion: "Doğduğunuz şehir neresidir?",
      securityAnswerHash: securityAnswerHash,
      twoFactorEnabled: false,
      durum: "aktif",
    });

    console.log("✅ İLK YÖNETİCİ HESABI BAŞARIYLA OLUŞTURULDU!");
    console.log("E-Posta:", yeniAdmin.email);
    console.log("Geçici Şifre:", geciciSifre);
    process.exit(0);
  } catch (err) {
    console.error("Hata:", err);
    process.exit(1);
  }
}

adminOlustur();
