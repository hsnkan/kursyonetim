"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { extractCardIdFromScan, metindenKartIdCikar, isIosDevice } from "@/lib/mobileYoklama";
import { kameraHataDetay, tekrarKameraIzniIste } from "@/lib/kameraIzniYardim";
import KameraIzniRehberi from "@/app/components/KameraIzniRehberi";

const OCR_INTERVAL_MS = 700;
const OCR_INTERVAL_IOS_MS = 750;
const MIN_KART_UZUNLUK = 5;
const OCR_ONAY_SAYISI = 2;
const OCR_GUVEN_ESIK = 48;
const OCR_TEK_OKUMA_ESIK = 42;
/** Odak şeridi — önceki boyutun ~2 katı (yükseklik + geniş okuma alanı) */
const SATIR_OKUMA_GENISLIK = 0.92;
const SATIR_OKUMA_YUKSEKLIK_ORAN = 0.11;
const SATIR_OKUMA_MIN_PX = 40;
const SATIR_OKUMA_MAX_PX = 56;
const ODAK_SERIT_KENAR_ORAN = (1 - SATIR_OKUMA_GENISLIK) / 2;
const OCR_BUYUTME = 3;

function satirTaramaOlculeri(genislikTaban, yukseklikTaban) {
  const width = Math.floor(genislikTaban * SATIR_OKUMA_GENISLIK);
  const height = Math.min(
    SATIR_OKUMA_MAX_PX,
    Math.max(
      SATIR_OKUMA_MIN_PX,
      Math.floor(yukseklikTaban * SATIR_OKUMA_YUKSEKLIK_ORAN),
    ),
  );
  return { width, height };
}

function ocrIcinHazirla(canvas) {
  const scale = OCR_BUYUTME;
  const out = document.createElement("canvas");
  out.width = canvas.width * scale;
  out.height = canvas.height * scale;
  const octx = out.getContext("2d");
  if (!octx) return canvas;

  octx.imageSmoothingEnabled = false;
  octx.drawImage(canvas, 0, 0, out.width, out.height);

  const img = octx.getImageData(0, 0, out.width, out.height);
  const d = img.data;
  let min = 255;
  let max = 0;
  const grays = new Float32Array(d.length / 4);

  for (let i = 0, j = 0; i < d.length; i += 4, j++) {
    const g = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    grays[j] = g;
    if (g < min) min = g;
    if (g > max) max = g;
  }

  const aralik = max - min || 1;
  const esik = min + aralik * 0.42;
  for (let i = 0, j = 0; i < d.length; i += 4, j++) {
    const v = grays[j] >= esik ? 255 : 0;
    d[i] = v;
    d[i + 1] = v;
    d[i + 2] = v;
    d[i + 3] = 255;
  }

  octx.putImageData(img, 0, 0);
  return out;
}

const odakSeritStili = {
  "--odak-serit-yukseklik": `${SATIR_OKUMA_MAX_PX}px`,
  "--odak-serit-yarim": `${SATIR_OKUMA_MAX_PX / 2}px`,
  "--odak-serit-kenar": `${ODAK_SERIT_KENAR_ORAN * 100}%`,
};

async function kameraKaynagiSec(Html5Qrcode) {
  try {
    const devices = await Html5Qrcode.getCameras();
    if (devices?.length) {
      const arka =
        devices.find((d) => /back|rear|environment|arka/i.test(d.label)) ||
        devices[devices.length - 1];
      return arka.id;
    }
  } catch {
    // getCameras bazen izin sonrası çalışır
  }
  return { facingMode: "environment" };
}

function satirOkumaKutusu(viewfinderWidth, viewfinderHeight) {
  return satirTaramaOlculeri(viewfinderWidth, viewfinderHeight);
}

/** Odak şeridi: ortada şeffaf, çevre flu + karartma */
function KameraOdakOverlay() {
  return (
    <div className="kart-kamera-odak-overlay pointer-events-none absolute inset-0 z-10">
      <div className="kart-kamera-odak-blur kart-kamera-odak-blur-top" />
      <div className="kart-kamera-odak-blur kart-kamera-odak-blur-bottom" />
      <div className="kart-kamera-odak-blur kart-kamera-odak-blur-left" />
      <div className="kart-kamera-odak-blur kart-kamera-odak-blur-right" />
      <div className="kart-kamera-odak-serit" aria-hidden="true" />
    </div>
  );
}

function taramaConfigOlustur() {
  const ios = isIosDevice();
  const config = {
    fps: ios ? 10 : 15,
    qrbox: satirOkumaKutusu,
    disableFlip: false,
  };

  if (!ios) {
    config.aspectRatio = 1.333333;
  }

  return config;
}

export default function KartKameraTarayici({ acik, onKapat, onKodOkundu }) {
  const [hata, setHata] = useState("");
  const [hataDetay, setHataDetay] = useState(null);
  const [taraniyor, setTaraniyor] = useState(false);
  const [mod, setMod] = useState("");
  const [adayNumara, setAdayNumara] = useState("");
  const [taramaKey, setTaramaKey] = useState(0);

  const scannerRef = useRef(null);
  const islemRef = useRef(false);
  const ocrWorkerRef = useRef(null);
  const ocrTimerRef = useRef(null);
  const ocrTekrarRef = useRef(new Map());
  const ocrBusyRef = useRef(false);
  const onKapatRef = useRef(onKapat);
  const onKodOkunduRef = useRef(onKodOkundu);

  const hataGoster = useCallback((err) => {
    const detay = kameraHataDetay(err);
    setHata(detay.mesaj);
    setHataDetay(detay);
  }, []);

  const taramayiYenidenBaslat = useCallback(() => {
    setHata("");
    setHataDetay(null);
    setTaraniyor(true);
    setMod("");
    setAdayNumara("");
    setTaramaKey((k) => k + 1);
  }, []);

  useEffect(() => {
    onKapatRef.current = onKapat;
  }, [onKapat]);

  useEffect(() => {
    onKodOkunduRef.current = onKodOkundu;
  }, [onKodOkundu]);

  const temizleKaynaklar = useCallback(async () => {
    if (ocrTimerRef.current) {
      clearInterval(ocrTimerRef.current);
      ocrTimerRef.current = null;
    }
    if (ocrWorkerRef.current) {
      try {
        await ocrWorkerRef.current.terminate();
      } catch {
        // ignore
      }
      ocrWorkerRef.current = null;
    }
    const scanner = scannerRef.current;
    scannerRef.current = null;
    if (scanner) {
      try {
        await scanner.stop();
      } catch {
        // ignore
      }
    }
  }, []);

  const basariliOku = useCallback(
    async (kartId) => {
      if (islemRef.current) return;
      const temiz = extractCardIdFromScan(kartId);
      if (!temiz || temiz.length < MIN_KART_UZUNLUK) {
        setHata("Okunan kod geçersiz. Kart numarasını net gösterin.");
        return;
      }

      islemRef.current = true;
      await temizleKaynaklar();
      onKodOkunduRef.current(temiz);
      onKapatRef.current();
    },
    [temizleKaynaklar],
  );

  const videoAl = useCallback(() => {
    const kok = document.getElementById("kart-kamera-view");
    return kok?.querySelector("video") || null;
  }, []);

  const kareYakala = useCallback((videoEl, merkezKirp = false) => {
    if (!videoEl?.videoWidth || !videoEl?.videoHeight) return null;

    const sw = videoEl.videoWidth;
    const sh = videoEl.videoHeight;
    const canvas = document.createElement("canvas");

    if (!merkezKirp) {
      canvas.width = sw;
      canvas.height = sh;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;
      ctx.drawImage(videoEl, 0, 0);
      return canvas;
    }

    const { width: cropW, height: cropH } = satirTaramaOlculeri(sw, sh);
    const sx = (sw - cropW) / 2;
    const sy = (sh - cropH) / 2;

    canvas.width = cropW;
    canvas.height = cropH;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.drawImage(videoEl, sx, sy, cropW, cropH, 0, 0, cropW, cropH);
    return canvas;
  }, []);

  const ocrTekrarKaydet = useCallback(
    (kartId, guven = 0) => {
      ocrTekrarRef.current.forEach((_, key) => {
        if (key !== kartId) ocrTekrarRef.current.delete(key);
      });

      setAdayNumara(kartId);

      if (guven >= OCR_GUVEN_ESIK) {
        basariliOku(kartId);
        return;
      }

      const onceki = ocrTekrarRef.current.get(kartId) || 0;
      const yeni = onceki + 1;
      ocrTekrarRef.current.set(kartId, yeni);
      const gereken = guven >= OCR_TEK_OKUMA_ESIK ? 1 : OCR_ONAY_SAYISI;
      if (yeni >= gereken) {
        basariliOku(kartId);
      }
    },
    [basariliOku],
  );

  const ocrBaslat = useCallback(async () => {
    try {
      const ios = isIosDevice();
      const { createWorker, PSM } = await import("tesseract.js");
      const worker = await createWorker("eng", 1, {
        logger: () => {},
      });
      await worker.setParameters({
        tessedit_char_whitelist: "0123456789",
        tessedit_pageseg_mode: PSM.SINGLE_LINE,
        user_defined_dpi: "300",
      });
      ocrWorkerRef.current = worker;
      setMod("numara");

      ocrTimerRef.current = setInterval(async () => {
        if (islemRef.current || !ocrWorkerRef.current || ocrBusyRef.current) return;
        const video = videoAl();
        const canvas = kareYakala(video, true);
        if (!canvas) return;

        ocrBusyRef.current = true;
        try {
          const hazir = ocrIcinHazirla(canvas);
          const {
            data: { text, confidence },
          } = await ocrWorkerRef.current.recognize(hazir);
          const kartId = metindenKartIdCikar(text);
          if (kartId) {
            ocrTekrarKaydet(kartId, confidence || 0);
          }
        } catch {
          // OCR turu atlandı
        } finally {
          ocrBusyRef.current = false;
        }
      }, ios ? OCR_INTERVAL_IOS_MS : OCR_INTERVAL_MS);
    } catch (err) {
      console.error("OCR başlatılamadı:", err);
      if (isIosDevice()) {
        setHata(
          "Numara okuma başlatılamadı. Işığı artırın veya kart numarasını USB okuyucu alanına yazın.",
        );
      }
    }
  }, [kareYakala, ocrTekrarKaydet, videoAl]);

  useEffect(() => {
    if (!acik) return;

    islemRef.current = false;
    ocrTekrarRef.current = new Map();
    setHata("");
    setHataDetay(null);
    setAdayNumara("");
    setTaraniyor(true);
    setMod("");

    let iptal = false;

    const baslat = async () => {
      if (typeof window !== "undefined" && !window.isSecureContext) {
        setTaraniyor(false);
        hataGoster(null);
        return;
      }

      try {
        const izinSonuc = await tekrarKameraIzniIste();
        if (iptal) return;
        if (!izinSonuc.basarili) {
          setTaraniyor(false);
          hataGoster({
            name: izinSonuc.hata || "NotAllowedError",
            message: izinSonuc.hata,
          });
          return;
        }

        const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import(
          "html5-qrcode"
        );
        if (iptal) return;

        const formatlar = [
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.CODE_93,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.ITF,
          Html5QrcodeSupportedFormats.CODABAR,
        ];

        const scanner = new Html5Qrcode("kart-kamera-view", {
          formatsToSupport: formatlar,
          verbose: false,
          experimentalFeatures: {
            useBarCodeDetectorIfSupported: true,
          },
        });
        scannerRef.current = scanner;

        const kameraKaynak = await kameraKaynagiSec(Html5Qrcode);

        await scanner.start(
          kameraKaynak,
          taramaConfigOlustur(),
          (decodedText) => {
            if (islemRef.current) return;
            const sadeceRakam = String(decodedText).replace(/\D/g, "");
            if (sadeceRakam.length < MIN_KART_UZUNLUK) return;
            const kartId = extractCardIdFromScan(sadeceRakam);
            if (kartId) basariliOku(kartId);
          },
          () => {},
        );

        setTaraniyor(false);
        setMod("numara");
        await ocrBaslat();
      } catch (err) {
        console.error("Kamera tarayıcı hatası:", err);
        setTaraniyor(false);
        hataGoster(err);
      }
    };

    baslat();

    return () => {
      iptal = true;
      temizleKaynaklar();
    };
  }, [acik, taramaKey, basariliOku, hataGoster, ocrBaslat, temizleKaynaklar]);

  if (!acik) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/90 p-4"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="w-full max-w-md bg-white rounded-3xl border-2 border-amber-400 shadow-2xl overflow-hidden">
        <div className="bg-slate-900 text-white px-5 py-4 flex justify-between items-center">
          <div>
            <h3 className="font-black text-sm uppercase tracking-wide">
              📷 Kart Numarası Oku
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Kamera izinlerini açın, numarayı kareye hizalayın
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              temizleKaynaklar();
              onKapatRef.current();
            }}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 font-black text-lg cursor-pointer"
            aria-label="Kamerayı kapat"
          >
            ×
          </button>
        </div>

        <div className="p-4 space-y-3">
          <div
            className="relative w-full min-h-[260px] rounded-2xl overflow-hidden bg-slate-950"
            style={odakSeritStili}
          >
            <div id="kart-kamera-view" className="absolute inset-0 w-full h-full min-h-[260px]" />
            {!taraniyor && !hata && <KameraOdakOverlay />}
          </div>

          {taraniyor && (
            <p className="text-center text-xs font-bold text-slate-500">
              Kamera açılıyor...
            </p>
          )}

          {!taraniyor && !hata && (
            <div className="space-y-2">
              <p className="text-center text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-2.5">
                {mod === "numara"
                  ? "Numarayı geniş şeffaf şeride hizalayın. Algılanırsa yeşil butona basabilirsiniz."
                  : "Kamera hazırlanıyor..."}
              </p>
              <details className="text-[10px] text-slate-600 bg-slate-50 border border-slate-200 rounded-xl p-2.5">
                <summary className="font-bold cursor-pointer text-slate-700">
                  Kartta okuma kalitesi için
                </summary>
                <ul className="mt-2 space-y-1 list-disc list-inside leading-relaxed">
                  <li>Siyah veya koyu numara, açık/beyaz zemin (yüksek kontrast)</li>
                  <li>Kalın ve büyük yazı (en az 16pt), tek yatay satır</li>
                  <li>Mat yüzey; parlak/laminasyon yansıma yapar</li>
                  <li>Fiziksel kart kullanın (bilgisayar/telefon ekranı zor okunur)</li>
                  <li>İyi ışık, gölgesiz; kartı düz tutup 2 sn sabit bekleyin</li>
                  <li>İsteğe bağlı: numaranın altına Code128 barkod ekleyin (en hızlı okuma)</li>
                </ul>
              </details>
              {adayNumara && (
                <button
                  type="button"
                  onClick={() => basariliOku(adayNumara)}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm cursor-pointer"
                >
                  {adayNumara} — Bu numarayı kullan
                </button>
              )}
            </div>
          )}

          {hata && (
            <div className="space-y-3">
              <p className="text-center text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl p-3">
                {hata}
              </p>

              {hataDetay?.izinRehberi && (
                <KameraIzniRehberi
                  httpsSorunu={Boolean(hataDetay.httpsSorunu)}
                  onTekrarDene={taramayiYenidenBaslat}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
