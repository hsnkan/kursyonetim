"use client";

import { useCallback, useRef, useState } from "react";
import { formatWebNfcSerial } from "@/lib/nfc";
import {
  isAndroidDevice,
  isDesktopUserAgent,
  isIosDevice,
  isMobileUserAgent,
  isWebNfcSupported,
  normalizeMobileCardId,
} from "@/lib/mobileYoklama";

export default function NfcKartYoklamaPanel({ onKartOkundu, yukleniyor }) {
  const [nfcDurum, setNfcDurum] = useState("");
  const [nfcAktif, setNfcAktif] = useState(false);
  const sonOkumaRef = useRef({ id: "", zaman: 0 });
  const nfcReaderRef = useRef(null);

  const mobilMi = isMobileUserAgent();
  const masaustuMu = isDesktopUserAgent();
  const iosMu = isIosDevice();
  const androidMi = isAndroidDevice();
  const webNfcVar = isWebNfcSupported();

  const kartIsle = useCallback(
    (hamId) => {
      const kartId = normalizeMobileCardId(hamId);
      if (!kartId || yukleniyor) return;

      const simdi = Date.now();
      if (
        sonOkumaRef.current.id === kartId &&
        simdi - sonOkumaRef.current.zaman < 2500
      ) {
        return;
      }
      sonOkumaRef.current = { id: kartId, zaman: simdi };
      onKartOkundu(kartId);
    },
    [onKartOkundu, yukleniyor],
  );

  const androidNfcBaslat = async () => {
    if (!webNfcVar) {
      setNfcDurum(
        "Bu telefonda tarayıcı NFC desteklemiyor. Bilgisayar + USB okuyucu kullanın.",
      );
      return;
    }

    setNfcDurum("13,56 MHz kartı telefonun arkasına yaklaştırın...");
    setNfcAktif(true);

    try {
      const ndef = new window.NDEFReader();
      nfcReaderRef.current = ndef;
      await ndef.scan();

      ndef.addEventListener("reading", (event) => {
        const serial = formatWebNfcSerial(event.serialNumber);
        if (serial) {
          kartIsle(serial);
          setNfcDurum(`Kart okundu (${serial}). Yoklama işleniyor...`);
        } else {
          setNfcDurum(
            "Kart algılandı fakat numara alınamadı. Bilgisayarda USB okuyucu deneyin.",
          );
        }
      });
    } catch (err) {
      setNfcAktif(false);
      setNfcDurum(
        err?.message ||
          "NFC başlatılamadı. Chrome kullanın, NFC açık olsun, HTTPS gerekebilir.",
      );
    }
  };

  const androidNfcDurdur = () => {
    nfcReaderRef.current = null;
    setNfcAktif(false);
    setNfcDurum("");
  };

  if (masaustuMu) {
    return (
      <div className="p-5 rounded-3xl bg-emerald-50 border-2 border-emerald-300 text-emerald-950 space-y-3 shadow-sm">
        <p className="text-sm font-black text-emerald-900 flex items-center gap-2">
          <span>🔌</span> Ana yöntem: USB NFC Okuyucu (13,56 MHz)
        </p>
        <ol className="text-xs font-bold space-y-1.5 list-decimal list-inside text-emerald-900">
          <li>USB okuyucuyu bilgisayara takın (klavye gibi çalışır)</li>
          <li>Bu yoklama sayfasını açık tutun — imleç aşağıdaki alanda olsun</li>
          <li>13,56 MHz NFC kartı okuyucuya yaklaştırın</li>
          <li>Kart numarası otomatik yazılır ve yoklama kaydedilir</li>
        </ol>
        <p className="text-[11px] font-semibold text-emerald-800 bg-white/70 p-3 rounded-xl border border-emerald-200">
          Öğrenci kaydı sırasında da aynı USB okuyucu ile kart okutun; sistem
          okunan numarayı o sporcuya tanımlar. QR kod gerekmez.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border-2 border-amber-300 shadow-xl overflow-hidden">
      <div className="bg-amber-900 text-white p-4">
        <h2 className="text-sm font-black uppercase tracking-wider text-amber-200">
          📱 Telefon ile yoklama
        </h2>
        <p className="text-[11px] text-amber-100 font-semibold mt-1">
          13,56 MHz NFC kart — QR kod kullanılmaz
        </p>
      </div>

      <div className="p-4 space-y-4">
        {iosMu && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
            <p className="text-xs font-black text-amber-900">iPhone</p>
            <p className="text-xs font-semibold text-amber-950">
              iPhone tarayıcısı NFC kart okuyamaz. Salon yoklaması için{" "}
              <strong>bilgisayar + USB okuyucu</strong> kullanın. Acil durumda
              aşağıdaki alana USB okuyucunun yazdığı kart numarasını elle
              girebilirsiniz (numara öğrenci kaydında görünür).
            </p>
          </div>
        )}

        {androidMi && (
          <div className="space-y-3">
            <p className="text-xs font-bold text-slate-700">
              Android telefonda Chrome ile 13,56 MHz kartı telefona
              dokundurabilirsiniz. USB okuyucu gerekmez; ancak bilgisayar +
              USB yöntemi daha hızlı ve tutarlıdır.
            </p>
            {!nfcAktif ? (
              <button
                type="button"
                onClick={androidNfcBaslat}
                disabled={yukleniyor || !webNfcVar}
                className="w-full py-3 bg-emerald-600 text-white font-black rounded-xl text-sm disabled:opacity-50"
              >
                {webNfcVar
                  ? "NFC Kart Okumayı Başlat"
                  : "Bu tarayıcı NFC desteklemiyor"}
              </button>
            ) : (
              <button
                type="button"
                onClick={androidNfcDurdur}
                className="w-full py-3 bg-slate-700 text-white font-black rounded-xl text-sm"
              >
                NFC Okumayı Durdur
              </button>
            )}
          </div>
        )}

        {!androidMi && !iosMu && mobilMi && (
          <p className="text-xs font-bold text-slate-600">
            Bu cihazda NFC okuma sınırlı olabilir. Tercih: bilgisayar + USB
            okuyucu.
          </p>
        )}

        {nfcDurum && (
          <p
            className={`text-xs font-bold p-3 rounded-xl border ${
              nfcAktif
                ? "text-emerald-800 bg-emerald-50 border-emerald-200"
                : "text-amber-900 bg-amber-50 border-amber-200"
            }`}
          >
            {nfcDurum}
          </p>
        )}

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-[11px] font-semibold text-slate-700 space-y-1">
          <p className="font-black text-slate-900">Önerilen salon kurulumu</p>
          <p>✓ Yoklama masasında: laptop + USB NFC okuyucu (13,56 MHz)</p>
          <p>✓ Öğrenci kaydında kart aynı okuyucu ile tanımlanır</p>
          <p>✓ Telefon yalnızca yedek / sahada kullanım içindir</p>
        </div>
      </div>
    </div>
  );
}
