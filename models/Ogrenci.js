import mongoose from "mongoose";

const OgrenciSchema = new mongoose.Schema(
  {
    adSoyad: {
      type: String,
      required: [true, "Öğrenci adı soyadı zorunludur"],
      trim: true,
    },
    grup: {
      type: String,
      required: true,
    },
    kanGrubu: {
      type: String,
      default: "Bilinmiyor",
    },
    lisansliMi: {
      type: Boolean,
      default: false,
    },
    aylikUcret: {
      type: Number,
      default: 2000,
    },
    odemeGunu: {
      type: Number,
      default: 1,
    },
    nfcKartId: {
      type: String,
      trim: true,
    },
    durum: {
      type: String,
      enum: ["aktif", "pasif"],
      default: "aktif",
    },
    veliListesi: [
      {
        adSoyad: String,
        yakinlikDerecesi: String,
        telefon: String,
      },
    ],
    grupTransferGecmisi: [
      {
        eskiGrup: String,
        yeniGrup: String,
        tarih: { type: Date, default: Date.now },
      },
    ],
    // 📜 YENİ: Kronolojik İşlem Geçmişi Logları
    islemGecmisi: [
      {
        islemTipi: String, // "GÜNCELLEME", "DONDURMA", "TRANSFER", "AKTİF ETME" vb.
        detay: String, // "Grup Minikler'den Yıldızlar'a transfer edildi." vb.
        tarih: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true },
);

export default mongoose.models.Ogrenci ||
  mongoose.model("Ogrenci", OgrenciSchema);
