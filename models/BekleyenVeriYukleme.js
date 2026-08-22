import mongoose from "mongoose";

const BekleyenVeriYuklemeSchema = new mongoose.Schema(
  {
    salonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "KursSalon",
      required: true,
    },
    tip: {
      type: String,
      enum: ["ogrenci_excel", "gecmis_odeme_excel"],
      required: true,
    },
    payload: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    ozet: {
      kayitSayisi: { type: Number, default: 0 },
      aciklama: { type: String, default: "" },
    },
    durum: {
      type: String,
      enum: ["bekliyor", "onaylandi", "reddedildi", "uygulandi"],
      default: "bekliyor",
    },
    gelistiriciNotu: { type: String, default: "" },
    sonucMesaji: { type: String, default: "" },
    onaylayanUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    onayTarihi: { type: Date, default: null },
  },
  { timestamps: true },
);

export default mongoose.models.BekleyenVeriYukleme ||
  mongoose.model("BekleyenVeriYukleme", BekleyenVeriYuklemeSchema);
