import mongoose from "mongoose";

const MesajKayitSchema = new mongoose.Schema({
  ogrenciId: { type: String, default: null },
  ogrenciAdSoyad: { type: String, required: true },
  veliAdSoyad: { type: String, required: true },
  yakinlik: { type: String, default: "Veli" },
  telefon: { type: String, required: true },
  mesajMetni: { type: String, required: true },
  waLink: { type: String, required: true },
  durum: {
    type: String,
    enum: ["bekliyor", "gonderildi", "hata"],
    default: "bekliyor",
  },
  gonderimTarihi: { type: Date, default: null },
  hataMesaji: { type: String, default: null },
});

const MesajKampanyaSchema = new mongoose.Schema(
  {
    grupAdi: { type: String, required: true },
    sablon: { type: String, default: "GENEL" },
    mesajMetni: { type: String, required: true },
    gonderenId: { type: String, default: null },
    gonderenAdSoyad: { type: String, required: true },
    durum: {
      type: String,
      enum: ["hazir", "gonderiliyor", "tamamlandi", "iptal"],
      default: "hazir",
    },
    toplamAlici: { type: Number, default: 0 },
    gonderilenSayisi: { type: Number, default: 0 },
    kayitlar: [MesajKayitSchema],
  },
  { timestamps: true },
);

export default mongoose.models.MesajKampanya ||
  mongoose.model("MesajKampanya", MesajKampanyaSchema);
