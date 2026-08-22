"use client";

import { useEffect, useRef, useState } from "react";
import { extractCardIdFromScan } from "@/lib/mobileYoklama";

export default function KartKameraTarayici({ acik, onKapat, onKodOkundu }) {
  const [hata, setHata] = useState("");
  const [taraniyor, setTaraniyor] = useState(false);
  const scannerRef = useRef(null);
  const islemRef = useRef(false);

  useEffect(() => {
    if (!acik) return;

    islemRef.current = false;
    setHata("");
    setTaraniyor(true);

    let iptal = false;

    const baslat = async () => {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (iptal) return;

        const scanner = new Html5Qrcode("kart-kamera-view", {
          verbose: false,
        });
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 12,
            qrbox: (viewfinderWidth, viewfinderHeight) => {
              const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
              const kutu = Math.floor(minEdge * 0.72);
              return { width: kutu, height: Math.floor(kutu * 0.55) };
            },
            aspectRatio: 1.777,
          },
          (decodedText) => {
            if (islemRef.current) return;
            islemRef.current = true;

            const kartId = extractCardIdFromScan(decodedText);
            if (!kartId) {
              setHata("Okunan kod geçersiz. Kart üzerindeki numarayı net okutun.");
              islemRef.current = false;
              return;
            }

            scanner
              .stop()
              .catch(() => {})
              .finally(() => {
                scannerRef.current = null;
                onKodOkundu(kartId);
                onKapat();
              });
          },
          () => {},
        );

        setTaraniyor(false);
      } catch (err) {
        console.error("Kamera tarayıcı hatası:", err);
        setTaraniyor(false);
        setHata(
          "Kamera açılamadı. Tarayıcı kamera iznini kontrol edin.",
        );
      }
    };

    baslat();

    return () => {
      iptal = true;
      const scanner = scannerRef.current;
      scannerRef.current = null;
      if (scanner) {
        scanner.stop().catch(() => {});
      }
    };
  }, [acik, onKapat, onKodOkundu]);

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
              İsteğe bağlı — QR, barkod veya kart numarası
            </p>
          </div>
          <button
            type="button"
            onClick={onKapat}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 font-black text-lg cursor-pointer"
            aria-label="Kamerayı kapat"
          >
            ×
          </button>
        </div>

        <div className="p-4 space-y-3">
          <div
            id="kart-kamera-view"
            className="w-full min-h-[240px] rounded-2xl overflow-hidden bg-slate-950"
          />

          {taraniyor && (
            <p className="text-center text-xs font-bold text-slate-500">
              Kamera açılıyor...
            </p>
          )}

          {hata && (
            <p className="text-center text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl p-3">
              {hata}
            </p>
          )}

          <p className="text-[11px] text-center text-slate-500 font-medium">
            Kod otomatik okununca yoklama alınır ve kamera kapanır.
          </p>
        </div>
      </div>
    </div>
  );
}
