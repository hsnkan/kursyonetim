import {
  isAndroidDevice,
  isIosDevice,
  isMobileUserAgent,
} from "@/lib/mobileYoklama";

/** Cihaz ve tarayıcı tespiti */
export function detectKameraPlatform() {
  if (typeof navigator === "undefined") {
    return { tip: "desktop", tarayici: "unknown", etiket: "Bilinmeyen cihaz" };
  }

  const ua = navigator.userAgent;

  if (isIosDevice()) {
    if (/CriOS/i.test(ua)) {
      return { tip: "ios", tarayici: "chrome-ios", etiket: "iPhone / iPad — Chrome" };
    }
    if (/FxiOS/i.test(ua)) {
      return { tip: "ios", tarayici: "firefox-ios", etiket: "iPhone / iPad — Firefox" };
    }
    return { tip: "ios", tarayici: "safari-ios", etiket: "iPhone / iPad — Safari" };
  }

  if (isAndroidDevice()) {
    if (/SamsungBrowser/i.test(ua)) {
      return {
        tip: "android",
        tarayici: "samsung",
        etiket: "Android — Samsung Internet",
      };
    }
    if (/Chrome/i.test(ua)) {
      return { tip: "android", tarayici: "chrome-android", etiket: "Android — Chrome" };
    }
    return { tip: "android", tarayici: "android-other", etiket: "Android tarayıcı" };
  }

  if (/Edg\//i.test(ua)) {
    return { tip: "desktop", tarayici: "edge", etiket: "Windows — Edge" };
  }
  if (/Chrome/i.test(ua)) {
    return { tip: "desktop", tarayici: "chrome-desktop", etiket: "Bilgisayar — Chrome" };
  }
  if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) {
    return { tip: "desktop", tarayici: "safari-mac", etiket: "Mac — Safari" };
  }

  return {
    tip: isMobileUserAgent() ? "mobile" : "desktop",
    tarayici: "other",
    etiket: "Tarayıcınız",
  };
}

/** Kamera izin durumu (destekleniyorsa) */
export async function queryKameraIzniDurumu() {
  if (typeof navigator === "undefined" || !navigator.permissions?.query) {
    return "unknown";
  }
  try {
    const sonuc = await navigator.permissions.query({ name: "camera" });
    return sonuc.state;
  } catch {
    return "unknown";
  }
}

/** Cihaza özel adım adım rehber */
export function getKameraIzniAdimlari(platform = detectKameraPlatform()) {
  const siteAdi =
    typeof window !== "undefined" ? window.location.hostname : "bu site";

  const { tip, tarayici } = platform;

  if (tip === "ios") {
    if (tarayici === "chrome-ios") {
      return [
        "iPhone Ayarlar uygulamasını açın",
        "Aşağı kaydırın → Chrome",
        "Kamera → İzin Ver veya Sor",
        "Chrome'a dönüp sayfayı yenileyin",
      ];
    }
    return [
      "iPhone Ayarlar uygulamasını açın",
      "Uygulamalar → Safari (veya Safari → Gelişmiş)",
      "Kamera → İzin Ver / Sor",
      `Safari'de ${siteAdi} sitesini yenileyin`,
      "Adres çubuğundaki aa simgesi → Web Sitesi Ayarları → Kamera → İzin Ver",
    ];
  }

  if (tip === "android") {
    if (tarayici === "chrome-android") {
      return [
        "Chrome'da adres çubuğunun solundaki kilit / ayar simgesine dokunun",
        "İzinler → Kamera → İzin ver",
        "Alternatif: Telefon Ayarları → Uygulamalar → Chrome → İzinler → Kamera",
        "Sayfayı yenileyip 📷 Kamera ile Oku'ya tekrar basın",
      ];
    }
    if (tarayici === "samsung") {
      return [
        "Samsung Internet'te adres çubuğundaki kilit simgesine dokunun",
        "Site ayarları → Kamera → İzin ver",
        "Alternatif: Ayarlar → Uygulamalar → Samsung Internet → İzinler → Kamera",
      ];
    }
    return [
      "Tarayıcıda adres çubuğundaki kilit simgesine dokunun",
      "Site izinleri → Kamera → İzin ver",
      "Telefon Ayarları → Uygulamalar → tarayıcınız → İzinler → Kamera",
    ];
  }

  if (tarayici === "chrome-desktop" || tarayici === "edge") {
    return [
      `Adres çubuğunun solundaki kilit / ayar simgesine tıklayın`,
      `${siteAdi} için Kamera → İzin ver`,
      "Alternatif: Tarayıcı Ayarları → Gizlilik → Site ayarları → Kamera",
      "Sayfayı yenileyip tekrar deneyin",
    ];
  }

  if (tarayici === "safari-mac") {
    return [
      "Safari → Ayarlar (Tercihler) → Web siteleri → Kamera",
      `${siteAdi} için İzin Ver seçin`,
      "Sayfayı yenileyip tekrar deneyin",
    ];
  }

  return [
    "Adres çubuğundaki kilit veya bilgi simgesine tıklayın",
    "Kamera iznini bulun ve İzin ver seçin",
    "HTTPS (https://) ile açıldığından emin olun",
    "Sayfayı yenileyip tekrar deneyin",
  ];
}

/**
 * Cihaz ayarlarına yönlendirme dene (kullanıcı tıklaması gerekir).
 * Tarayıcılar çoğu deep linki engeller; adımlar her zaman gösterilir.
 */
export function acKameraIzniAyarlari(platform = detectKameraPlatform()) {
  if (typeof window === "undefined") {
    return { acildi: false, mesaj: "Tarayıcı ortamı bulunamadı." };
  }

  const { tip, tarayici } = platform;

  try {
    if (tip === "ios") {
      // iOS: Ayarlar uygulamasına yönlendirme (Safari'de sınırlı destek)
      window.location.href = "app-settings:";
      return {
        acildi: true,
        mesaj: "Ayarlar uygulaması açılıyor. Safari/Chrome → Kamera iznini açın.",
      };
    }

    if (tip === "android") {
      const paket =
        tarayici === "chrome-android"
          ? "com.android.chrome"
          : tarayici === "samsung"
            ? "com.sec.android.app.sbrowser"
            : null;

      if (paket) {
        window.location.href = `intent:#Intent;action=android.settings.APPLICATION_DETAILS_SETTINGS;data=package:${paket};end`;
        return {
          acildi: true,
          mesaj: "Uygulama ayarları açılıyor. İzinler → Kamera → İzin ver.",
        };
      }

      window.location.href =
        "intent:#Intent;action=android.settings.APPLICATION_SETTINGS;end";
      return {
        acildi: true,
        mesaj: "Telefon ayarları açılıyor. Tarayıcı uygulamanızdan Kamera iznini açın.",
      };
    }

    // Masaüstü: tarayıcı içi site izinleri (chrome:// dışarıdan açılamaz)
    return {
      acildi: false,
      mesaj:
        "Masaüstünde adres çubuğundaki kilit simgesinden site kamera iznini açın.",
    };
  } catch {
    return {
      acildi: false,
      mesaj: "Otomatik yönlendirme desteklenmiyor. Lütfen adımları izleyin.",
    };
  }
}

/** Kamera iznini tekrar iste (henüz kalıcı reddedilmediyse) */
export async function tekrarKameraIzniIste() {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    return { basarili: false, hata: "Bu tarayıcı kamera desteklemiyor." };
  }

  if (!window.isSecureContext) {
    return { basarili: false, hata: "HTTPS gerekli." };
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: "environment" } },
    });
    stream.getTracks().forEach((track) => track.stop());
    return { basarili: true };
  } catch (err) {
    return { basarili: false, hata: err?.name || "NotAllowedError" };
  }
}

export function kameraHataDetay(err) {
  if (typeof window !== "undefined" && !window.isSecureContext) {
    return {
      mesaj:
        "Kamera yalnızca güvenli bağlantıda (https://) çalışır. Adres çubuğunda https:// olduğundan emin olun.",
      izinRehberi: true,
      httpsSorunu: true,
    };
  }

  const ad = err?.name || "";
  const mesaj = String(err?.message || err || "").toLowerCase();

  if (ad === "NotAllowedError" || mesaj.includes("permission")) {
    return {
      mesaj: "Kamera izni reddedildi veya kapalı.",
      izinRehberi: true,
      httpsSorunu: false,
    };
  }
  if (ad === "NotFoundError" || mesaj.includes("not found")) {
    return {
      mesaj: "Bu cihazda kullanılabilir kamera bulunamadı.",
      izinRehberi: false,
      httpsSorunu: false,
    };
  }
  if (ad === "NotReadableError" || mesaj.includes("in use")) {
    return {
      mesaj:
        "Kamera başka bir uygulama tarafından kullanılıyor olabilir. Diğer uygulamaları kapatıp tekrar deneyin.",
      izinRehberi: false,
      httpsSorunu: false,
    };
  }
  if (mesaj.includes("secure") || mesaj.includes("https")) {
    return {
      mesaj: "HTTPS güvenlik ayarlarınızı kontrol edin.",
      izinRehberi: true,
      httpsSorunu: true,
    };
  }

  return {
    mesaj: "Kamera açılamadı. İzin ve HTTPS ayarlarını kontrol edin.",
    izinRehberi: true,
    httpsSorunu: false,
  };
}
