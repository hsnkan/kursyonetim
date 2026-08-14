import mongoose from "mongoose";

const YoklamaSchema = new mongoose.Schema(
  {
    ogrenciId: {
      type: mongoose.Schema.Types.Mixed, // Hem String hem ObjectId tiplerini sorunsuz kabul eder
      ref: "Ogrenci",
      required: [true, "Öğrenci ID zorunludur."],
    },
    tarih: {
      type: Date,
      default: Date.now,
    },
    durum: {
      type: String,
      enum: ["geldi", "gelmedi", "izinli"],
      default: "geldi",
    },
    yöntem: {
      type: String,
      enum: ["manuel", "nfc"],
      default: "nfc",
    },
    yoklamaTipi: {
      type: String,
      default: "nfc", // API geriye dönük uyumluluğu için eklendi
    },
  },
  { timestamps: true },
);

export default mongoose.models.Yoklama ||
  mongoose.model("Yoklama", YoklamaSchema);
