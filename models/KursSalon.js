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
    musteriEmail: { type: String, default: "", trim: true },
    gelistiriciEmail: { type: String, default: "", trim: true },
    kurtarmaEmail: { type: String, default: "", trim: true },
    kurtarmaTelefon: { type: String, default: "", trim: true },
    mailFromName: { type: String, default: "", trim: true },
    mailFromAddress: { type: String, default: "", trim: true },
    kurulumNotu: { type: String, default: "" },
    /** Tam kurum adı (Word formu, KVKK, rapor) */
    isletmeTamAdi: { type: String, default: "", trim: true },
    /** Destek oturumu / KVKK metinleri */
    teknikDestekAdi: { type: String, default: "", trim: true },
    sistemBaslik: { type: String, default: "", trim: true },
    sistemAciklama: { type: String, default: "", trim: true },
    /** Word kayıt formu üst bilgileri */
    kayitFormUstBaslik: { type: String, default: "", trim: true },
    kayitFormAltBaslik: { type: String, default: "", trim: true },
    kayitFormSlogan: {
      type: String,
      default: "★ ELİT EĞİTİM • GÜÇLÜ GELECEK • SINIRSIZ POTANSİYEL ★",
      trim: true,
    },
    raporFooterMetni: { type: String, default: "", trim: true },
    /** Teslim checklist — canlı URL notu */
    canliSiteUrl: { type: String, default: "", trim: true },
    /** WhatsApp duyuru şablonları (baslik + icerik) */
    duyuruSablonlari: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({}),
    },
    ozellikler: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({}),
    },
  },
  { timestamps: true },
);

export default mongoose.models.KursSalon ||
  mongoose.model("KursSalon", KursSalonSchema);
