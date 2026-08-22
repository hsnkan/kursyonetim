import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    // 👤 Temel Kullanıcı Bilgileri
    adSoyad: {
      type: String,
      required: [true, "Ad Soyad alanı zorunludur."],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "E-posta adresi zorunludur."],
      unique: true,
      lowercase: true,
      trim: true,
    },
    /** Şifre sıfırlama bağlantısının gideceği adres (kullanıcı profilden tanımlar) */
    kurtarmaEmail: {
      type: String,
      default: "",
      lowercase: true,
      trim: true,
    },
    sifreHash: {
      type: String,
      required: [true, "Şifre alanı zorunludur."],
      select: false, // 🔒 KVKK / Güvenlik: Sorgularda istemciye sızması engellendi
    },
    sifreDegistirmeZorunlu: {
      type: Boolean,
      default: true, // 🔑 Yeni eklenen/şifresi sıfırlanan kullanıcı ilk girişte değiştirmek zorunda
    },
    rol: {
      type: String,
      enum: ["developer", "superadmin", "salon_yoneticisi", "antrenor"],
      default: "salon_yoneticisi",
    },
    salonAdi: {
      type: String,
      default: "Balans Cimnastik Akademisi",
    },
    salonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "KursSalon",
      default: null,
    },

    // 💳 0. KATMAN: Lisans & Yıllık Kiralama Takibi
    licenseEndDate: {
      type: Date,
      default: () => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Varsayılan 1 Yıl (365 Gün)
    },
    licenseWarningSent: {
      type: Boolean,
      default: false, // 30 gün kala geliştiriciye uyarı maili atıldı mı?
    },
    licenseCustomerReminderSent: {
      type: Boolean,
      default: false, // 30 gün kala müşteriye hatırlatma maili atıldı mı?
    },

    // 🔐 1. KATMAN: 2FA (Google Authenticator / TOTP)
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },
    twoFactorSecret: {
      type: String, // Google Auth Gizli Anahtarı
      select: false, // Varsayılan sorgularda istemciye sızmasını önler
    },

    // 🔑 2. KATMAN: Gizli Soru & Cevap (E-postaya Erişim Olmadığında)
    securityQuestion: {
      type: String,
      enum: [
        "İlk evcil hayvanınızın adı nedir?",
        "İlkokul öğretmeninizin adı nedir?",
        "Doğduğunuz şehir neresidir?",
        "En sevdiğiniz çocukluk arkadaşınızın adı nedir?",
      ],
    },
    securityAnswerHash: {
      type: String, // Cevap bcrypt/hash olarak saklanır
      select: false,
    },

    // 📧 3. KATMAN: E-Posta ile Şifre Sıfırlama Token'ı
    resetPasswordToken: {
      type: String,
      select: false,
    },
    resetPasswordExpires: {
      type: Date,
      select: false,
    },

    // 👁️ 4. KATMAN: Müşteri Mahremiyeti & Destek Girişi (Impersonation)
    supportAccessGrantedUntil: {
      type: Date, // Müşterinin teknik desteğe verdiği iznin bitiş tarihi (3 Saatlik)
      default: null,
    },
    /** Excel / toplu veri yüklemesi için geliştirici izni */
    dataUploadAccessGrantedUntil: {
      type: Date,
      default: null,
    },

    // 🌐 Güvenlik & Cihaz Hatırlama
    trustedDevices: [
      {
        deviceId: String, // 30 gün hatırlama için cihaz imzası
        expiresAt: Date,
      },
    ],

    // ⚡ Durum Kontrolü
    durum: {
      type: String,
      enum: ["aktif", "pasif", "askida"],
      default: "aktif",
    },
  },
  {
    timestamps: true, // createdAt ve updatedAt otomatik tutulur
  },
);

export default mongoose.models.User || mongoose.model("User", UserSchema);
