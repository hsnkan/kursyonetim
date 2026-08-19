import mongoose from "mongoose";

const KursSalonSchema = new mongoose.Schema(
  {
    salonAdi: {
      type: String,
      required: [true, "Salon/kurs adı zorunludur."],
      trim: true,
    },
    kisaKod: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      sparse: true,
    },
    altBaslik: {
      type: String,
      default: "Akademi Yönetim Paneli",
      trim: true,
    },
    logoUrl: {
      type: String,
      default: "/logo.png",
    },
    logoBase64: {
      type: String,
      default: null,
    },
    telefon: { type: String, default: "" },
    email: { type: String, default: "" },
    adres: { type: String, default: "" },
    webSitesi: { type: String, default: "" },
    whatsappImza: {
      type: String,
      default: "",
    },
    temaRengi: {
      type: String,
      default: "#f59e0b",
    },
    notlar: { type: String, default: "" },
    durum: {
      type: String,
      enum: ["aktif", "taslak", "pasif"],
      default: "taslak",
    },
  },
  { timestamps: true },
);

export default mongoose.models.KursSalon ||
  mongoose.model("KursSalon", KursSalonSchema);
