"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { extractCardIdFromScan, metindenKartIdCikar } from "@/lib/mobileYoklama";
import { kameraHataDetay } from "@/lib/kameraIzniYardim";
import KameraIzniRehberi from "@/app/components/KameraIzniRehberi";

const OCR_INTERVAL_MS = 850;
const MIN_KART_UZUNLUK = 5;

const BARKOD_FORMATLARI = [
  "qr_code",
  "code_128",
  "code_39",
  "code_93",
  "ean_13",
  "ean_8",
  "upc_a",
  "upc_e",
  "itf",
  "codabar",
];

export default function KartKameraTarayici({ acik, onKapat, onKodOkundu }) {
  const [hata, setHata] = useState("");
  const [hataDetay, setHataDetay] = useState(null);
  const [taraniyor, setTaraniyor] = useState(false);
  const [mod, setMod] = useState("");
  const [taramaKey, setTaramaKey] = useState(0);

  const scannerRef = useRef(null);
  const islemRef = useRef(false);
  const ocrWorkerRef = useRef(null);
  const ocrTimerRef = useRef(null);
  const barkodTimerRef = useRef(null);
  const ocrTekrarRef = useRef(new Map());
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
    if (barkodTimerRef.current) {
      clearInterval(barkodTimerRef.current);
      barkodTimerRef.current = null;
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

  const kareYakala = useCallback((videoEl) => {
    if (!videoEl?.videoWidth || !videoEl?.videoHeight) return null;
    const canvas = document.createElement("canvas");
    canvas.width = videoEl.videoWidth;
    canvas.height = videoEl.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(videoEl, 0, 0);
    return canvas;
  }, []);

  const ocrTekrarKaydet = useCallback(
    (kartId) => {
      const onceki = ocrTekrarRef.current.get(kartId) || 0;
      const yeni = onceki + 1;
      ocrTekrarRef.current.set(kartId, yeni);
      if (yeni >= 2) {
        basariliOku(kartId);
      }
    },
    [basariliOku],
  );

  const barkodDedektorBaslat = useCallback(async () => {
    if (typeof window === "undefined" || !("BarcodeDetector" in window)) return;

    try {
      const detector = new window.BarcodeDetector({
        formats: BARKOD_FORMATLARI,
      });

      barkodTimerRef.current = setInterval(async () => {
        if (islemRef.current) return;
        const video = videoAl();
        const canvas = kareYakala(video);
        if (!canvas) return;

        try {
          const sonuclar = await detector.detect(canvas);
          for (const sonuc of sonuclar) {
            const kartId = extractCardIdFromScan(sonuc.rawValue);
            if (kartId && kartId.length >= MIN_KART_UZUNLUK) {
              await basariliOku(kartId);
              return;
            }
          }
        } catch {
          // kare okunamadı — sonraki tur
        }
      }, 450);
    } catch {
      // BarcodeDetector desteklenmiyor
    }
  }, [basariliOku, kareYakala, videoAl]);

  const ocrBaslat = useCallback(async () => {
    try {
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker("eng", 1, {
        logger: () => {},
      });
      await worker.setParameters({
        tessedit_char_whitelist: "0123456789",
      });
      ocrWorkerRef.current = worker;
      setMod("numara");

      ocrTimerRef.current = setInterval(async () => {
        if (islemRef.current || !ocrWorkerRef.current) return;
        const video = videoAl();
        const canvas = kareYakala(video);
        if (!canvas) return;

        try {
          const {
            data: { text },
          } = await ocrWorkerRef.current.recognize(canvas);
          const kartId = metindenKartIdCikar(text);
          if (kartId) {
            ocrTekrarKaydet(kartId);
          }
        } catch {
          // OCR turu atlandı
        }
      }, OCR_INTERVAL_MS);
    } catch (err) {
      console.error("OCR başlatılamadı:", err);
    }
  }, [kareYakala, ocrTekrarKaydet, videoAl]);

  useEffect(() => {
    if (!acik) return;

    islemRef.current = false;
    ocrTekrarRef.current = new Map();
    setHata("");
    setHataDetay(null);
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

        await scanner.start(
          { facingMode: { ideal: "environment" } },
          {
            fps: 15,
            qrbox: (viewfinderWidth, viewfinderHeight) => {
              const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
              const kutu = Math.floor(minEdge * 0.82);
              return { width: kutu, height: kutu };
            },
            aspectRatio: 1.333333,
            disableFlip: false,
          },
          (decodedText) => {
            if (islemRef.current) return;
            const kartId = extractCardIdFromScan(decodedText);
            if (!kartId) {
              setHata("Okunan kod geçersiz. Kart numarasını net gösterin.");
              return;
            }
            basariliOku(kartId);
          },
          () => {},
        );

        setTaraniyor(false);
        setMod("kod");
        await barkodDedektorBaslat();
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
  }, [acik, taramaKey, basariliOku, barkodDedektorBaslat, hataGoster, ocrBaslat, temizleKaynaklar]);

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
              📷 Kart Kodu Tara
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              QR, barkod veya basılı kart numarası
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
            id="kart-kamera-view"
            className="w-full min-h-[260px] rounded-2xl overflow-hidden bg-slate-950"
          />

          {taraniyor && (
            <p className="text-center text-xs font-bold text-slate-500">
              Kamera açılıyor...
            </p>
          )}

          {!taraniyor && !hata && (
            <p className="text-center text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl p-2.5">
              {mod === "numara"
                ? "Kart numarasını kare ortasına hizalayın — okununca yoklama otomatik alınır."
                : "Kodu kameraya gösterin..."}
            </p>
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
