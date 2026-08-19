import mongoose from "mongoose";

const GorevliSchema = new mongoose.Schema(
  {
    adSoyad: {
      type: String,
      required: [true, "Görevli Ad Soyad zorunludur."],
      trim: true,
    },
    unvan: {
      type: String,
      default: "Antrenör", // Örn: Başantrenör, Yardımcı Antrenör, Danışma
      trim: true,
    },
    durum: {
      type: String,
      enum: ["aktif", "pasif"],
      default: "aktif",
    },
  },
  { timestamps: true },
);

export default mongoose.models.Gorevli ||
  mongoose.model("Gorevli", GorevliSchema);
