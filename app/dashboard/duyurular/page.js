"use client";

import { useState, useEffect } from "react";

export default function DuyurularPage() {
  const [gruplar, setGruplar] = useState([]);
  const [ogrenciler, setOgrenciler] = useState([]);
  const [loading, setLoading] = useState(true);

  // Seçili Grup & Duyuru İçerik State'leri
  const [seciliGrup, setSeciliGrup] = useState(null);
  const [duyuruMetni, setDuyuruMetni] = useState("");
  const [seciliSablon, setSeciliSablon] = useState("");
  const [secilenVeliKeyleri, setSecilenVeliKeyleri] = useState([]);
  const [gonderilenVeliler, setGonderilenVeliler] = useState({});
  const [gonderimDurum, setGonderimDurum] = useState(null);

  // HAZIR MESAJ ŞABLONLARI
  const sablonlar = {
    GENEL:
      "Balans Cimnastik Akademi ailesi olarak tüm sporcularımıza ve velilerimize sağlıklı, başarılı günler dileriz. Güncel antrenman takvimimiz ve duyurularımız hakkında bilgilendirmelerimiz devam edecektir.",
    ODEME:
      "Balans Cimnastik Akademi bünyesinde eğitim alan sporcularımızın aylık kurs aidat ödeme zamanı gelmiştir. Ödemesini gerçekleştiren velilerimiz bu mesajı dikkate almayabilirler. İyi günler dileriz.",
    ARA_TATIL:
      "Değerli Velilerimiz, okulların ara tatil dönemine girmesi nedeniyle antrenman saatlerimizde düzenlemeye gidilmiştir. Detaylı antrenman programı gruplarınızda paylaşılacaktır. Tüm sporcularımıza iyi tatiller dileriz.",
    RESMI_TATIL:
      "Değerli Velilerimiz, yaklaşan resmi tatil nedeniyle akademimiz belirtilen tarihlerde kapalı olacaktır. Tatil sonrası antrenmanlarımız normal seyriyle devam edecektir. Bilgilerinize sunarız.",
    KAR_TATILI:
      "Değerli Velilerimiz, bölgemizdeki olumsuz hava şartları ve kar yağışı nedeniyle sporcularımızın güvenliği açısından bugün yapılacak tüm antrenmanlarımız iptal edilmiştir. Telafi dersleri hakkında bilgilendirme yapılacaktır.",
    YARISMA:
      "Değerli Velilerimiz, önümüzdeki yarışma ve turnuva dönemi hazırlıkları kapsamında antrenman tempomuz artırılmıştır. Sporcularımızın antrenman saatlerine ve beslenme düzenlerine hassasiyet göstermenizi rica ederiz.",
  };

  useEffect(() => {
    veriGetir();
    setDuyuruMetni(sablonlar.GENEL);
    setSeciliSablon("GENEL");
  }, []);

  const veriGetir = async () => {
    setLoading(true);
    try {
      const [grupRes, ogrenciRes] = await Promise.all([
        fetch("/api/gruplar", { cache: "no-store" }),
        fetch("/api/ogrenciler", { cache: "no-store" }),
      ]);

      const grupData = await grupRes.json();
      const ogrenciData = await ogrenciRes.json();

      if (grupData.success && Array.isArray(grupData.data)) {
        setGruplar(grupData.data);
        if (grupData.data.length > 0) {
          setSeciliGrup(grupData.data[0]);
        }
      }

      if (ogrenciData.success && Array.isArray(ogrenciData.data)) {
        const aktifler = ogrenciData.data.filter(
          (o) => !o.durum || String(o.durum).toLowerCase() === "aktif",
        );
        setOgrenciler(aktifler);
      }
    } catch (err) {
      console.error("Veriler çekilemedi:", err);
    } finally {
      setLoading(false);
    }
  };

  const sablonSecildi = (key) => {
    setSeciliSablon(key);
    if (sablonlar[key]) {
      setDuyuruMetni(sablonlar[key]);
    }
  };

  const seciliGrupAdi = seciliGrup
    ? typeof seciliGrup === "object"
      ? seciliGrup.ad
      : seciliGrup
    : "";

  // Seçili Gruptaki Velileri Oluştur
  const seciliGrupVelileriniOlustur = () => {
    if (!seciliGrupAdi) return [];

    const gruptakiOgrenciler = ogrenciler.filter(
      (o) => o.grup === seciliGrupAdi,
    );
    const veliListesi = [];

    gruptakiOgrenciler.forEach((o) => {
      if (
        o.veliListesi &&
        Array.isArray(o.veliListesi) &&
        o.veliListesi.length > 0
      ) {
        o.veliListesi.forEach((v, idx) => {
          if (v.telefon || v.veliTelefon) {
            veliListesi.push({
              uniqueKey: `${o._id}_v_${idx}`,
              ogrenciId: o._id,
              ogrenciAdSoyad: o.adSoyad,
              veliAdSoyad: v.adSoyad || v.veliAdSoyad || "Veli",
              yakinlik: v.yakinlikDerecesi || v.yakinlik || "Veli",
              veliTelefon: v.telefon || v.veliTelefon || "",
            });
          }
        });
      } else if (o.veliTelefon || o.telefon) {
        veliListesi.push({
          uniqueKey: `${o._id}_v_0`,
          ogrenciId: o._id,
          ogrenciAdSoyad: o.adSoyad,
          veliAdSoyad: o.veliAdSoyad || "Veli",
          yakinlik: "Veli",
          veliTelefon: o.veliTelefon || o.telefon || "",
        });
      }
    });

    return veliListesi;
  };

  const seciliGrupVelileri = seciliGrupVelileriniOlustur();

  // 📲 DİREKT WHATSAPP GRUP SOHBETİNE MESAJ ATMA
  const grupWhatsappSohbetiAc = () => {
    if (!seciliGrup) return alert("Lütfen önce bir grup seçiniz!");

    const grupLink =
      typeof seciliGrup === "object" ? seciliGrup.whatsappLink : "";

    if (!grupLink) {
      return alert(
        "Bu grubun WhatsApp katılım linki tanımlanmamış. Lütfen Geliştirici Paneli'nden bu grubun WhatsApp davet linkini giriniz.",
      );
    }

    if (duyuruMetni.trim()) {
      navigator.clipboard.writeText(duyuruMetni);
      alert(
        `'${seciliGrupAdi}' için hazırlanan duyuru metni panoya kopyalandı!\n\nSohbet penceresi açıldığında mesaja yapıştırıp (Ctrl+V) gönderebilirsiniz.`,
      );
    }

    window.open(grupLink, "_blank");
  };

  // TEKİL VEYA KUTUCUKLA SEÇİLEN VELİLERE WHATSAPP MESAJI GÖNDER
  const whatsappMesajGonder = (veli) => {
    if (!duyuruMetni.trim()) return alert("Lütfen duyuru metnini giriniz!");
    const telefon = veli.veliTelefon;
    if (!telefon) return alert("Bu veliye ait telefon numarası bulunamadı!");

    const temizTel = telefon.replace(/\D/g, "");
    const tel = temizTel.startsWith("90") ? temizTel : `90${temizTel}`;
    const mesaj = `Sayın ${veli.veliAdSoyad} (${veli.yakinlik}),\n\n*${veli.ogrenciAdSoyad}* sporcumuzun kayıtlı olduğu *${seciliGrupAdi}* grubu duyurusudur:\n\n${duyuruMetni}\n\nBalans Cimnastik Akademi 🤸‍♀️`;

    window.open(
      `https://wa.me/${tel}?text=${encodeURIComponent(mesaj)}`,
      "_blank",
    );

    setGonderilenVeliler((prev) => ({
      ...prev,
      [veli.uniqueKey]: true,
    }));
  };

  const veliSecimiDegistir = (key) => {
    if (secilenVeliKeyleri.includes(key)) {
      setSecilenVeliKeyleri(secilenVeliKeyleri.filter((item) => item !== key));
    } else {
      setSecilenVeliKeyleri([...secilenVeliKeyleri, key]);
    }
  };

  // KUTUCUKLA SEÇİLEN VELİLERE TOPLU GÖNDERİM
  const secilenVelilereTopluGonder = () => {
    if (!duyuruMetni.trim()) return alert("Lütfen duyuru metnini giriniz!");

    const hedefVeliler =
      secilenVeliKeyleri.length > 0
        ? seciliGrupVelileri.filter((v) =>
            secilenVeliKeyleri.includes(v.uniqueKey),
          )
        : seciliGrupVelileri;

    if (hedefVeliler.length === 0) {
      return alert("Mesaj gönderilecek veli bulunamadı!");
    }

    if (
      confirm(
        `'${seciliGrupAdi}' grubunda seçilen ${hedefVeliler.length} veli için WhatsApp pencereleri sırayla açılacaktır. Devam edilsin mi?`,
      )
    ) {
      setGonderimDurum("Gönderiliyor...");
      hedefVeliler.forEach((v, idx) => {
        setTimeout(() => {
          whatsappMesajGonder(v);
        }, idx * 1200);
      });
      setTimeout(
        () => setGonderimDurum("✅ Tamamlandı"),
        hedefVeliler.length * 1200,
      );
    }
  };

  return (
    <div className="space-y-8 text-slate-900 pb-12 font-sans max-w-6xl mx-auto">
      {/* 🌟 ANA PANEL BAŞLIĞI */}
      <div className="bg-[#0F172A] text-white p-6 md:p-8 rounded-3xl shadow-2xl border-2 border-amber-400/40 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-wide text-amber-400 flex items-center gap-3 uppercase">
            <span>📢</span> Grup Duyuru Paneli
          </h1>
          <p className="text-xs md:text-sm font-semibold text-slate-300 mt-1">
            Cimnastik grubunuzu seçin, mesajınızı oluşturun ve velilere özel
            duyuru iletin.
          </p>
        </div>
        <div className="bg-slate-900 border border-amber-400/50 px-4 py-2 rounded-2xl text-amber-400 text-xs font-black shadow-inner whitespace-nowrap">
          Grup Duyuru Portalı
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* SOL PANEL: MESAJ İÇERİĞİ + SEÇİLİ HEDEF GRUP & VELİ LİSTESİ (7 KOLON) */}
        <div className="lg:col-span-7 space-y-6">
          {/* DUYURU METNİ HAZIRLAMA KARTI */}
          <div className="bg-white p-6 md:p-8 rounded-3xl shadow-xl border-2 border-slate-300 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-slate-200 pb-3 gap-2">
              <h2 className="text-sm font-black text-slate-950 uppercase flex items-center gap-2">
                <span>✍️</span> 1. Duyuru Metnini Hazırlayın
              </h2>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black text-slate-500 uppercase">
                  Şablon:
                </span>
                <select
                  value={seciliSablon}
                  onChange={(e) => sablonSecildi(e.target.value)}
                  className="bg-amber-100 border-2 border-amber-400 text-slate-950 font-black text-xs px-3 py-1.5 rounded-xl outline-none cursor-pointer"
                >
                  <option value="GENEL">📢 Genel Bilgilendirme</option>
                  <option value="ODEME">💳 Aidat / Ödeme Duyurusu</option>
                  <option value="ARA_TATIL">🏝️ Ara Tatil Duyurusu</option>
                  <option value="RESMI_TATIL">🇹🇷 Resmi Tatil Duyurusu</option>
                  <option value="KAR_TATILI">❄️ Kar / Hava Şartı Tatili</option>
                  <option value="YARISMA">🏆 Yarışma / Turnuva Dönemi</option>
                </select>
              </div>
            </div>

            <textarea
              rows="6"
              placeholder="Gruba iletmek istediğiniz duyuru metnini buraya yazın veya yukarıdan bir şablon seçin..."
              value={duyuruMetni}
              onChange={(e) => setDuyuruMetni(e.target.value)}
              className="w-full border-2 border-slate-300 p-4 rounded-2xl text-sm font-semibold text-slate-950 outline-none focus:border-amber-500 bg-slate-50 placeholder:text-slate-400"
            ></textarea>
          </div>

          {/* SEÇİLİ HEDEF GRUP VE ALTINDAKİ VELİ TELEFONLARINA İLET ALANI */}
          {seciliGrup && (
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-xl border-2 border-slate-300 space-y-5">
              <div className="p-4 bg-amber-50 rounded-2xl border-2 border-amber-300 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <span className="text-[10px] font-black uppercase text-amber-800">
                    Seçili Hedef Grup
                  </span>
                  <h3 className="text-lg font-black text-slate-950">
                    🏆 {seciliGrupAdi}
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={grupWhatsappSohbetiAc}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-black py-2.5 px-4 rounded-xl text-xs transition shadow flex items-center gap-2 cursor-pointer whitespace-nowrap"
                >
                  <span>💬</span>
                  <span>WhatsApp Grubunda Yayınla</span>
                </button>
              </div>

              {/* 📲 VELİ TELEFONLARINA İLET BÖLÜMÜ */}
              <div className="space-y-4 pt-2">
                <div className="border-b border-slate-200 pb-2">
                  <h4 className="text-xs font-black uppercase text-slate-900 flex items-center gap-2">
                    <span>📲</span> Veli Telefonlarına İlet (
                    {seciliGrupVelileri.length} Veli)
                  </h4>
                </div>

                {seciliGrupVelileri.length === 0 ? (
                  <p className="text-xs font-bold text-slate-400 text-center py-6">
                    Bu grupta henüz kayıtlı veli bulunamadı.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                    {seciliGrupVelileri.map((v) => {
                      const seciliMi = secilenVeliKeyleri.includes(v.uniqueKey);
                      const gonderildiMi = gonderilenVeliler[v.uniqueKey];

                      return (
                        <div
                          key={v.uniqueKey}
                          onClick={() => veliSecimiDegistir(v.uniqueKey)}
                          className={`p-3 rounded-2xl border-2 transition cursor-pointer flex items-center justify-between gap-3 ${
                            gonderildiMi
                              ? "bg-emerald-50 border-emerald-400"
                              : seciliMi
                                ? "bg-amber-100 border-amber-500"
                                : "bg-slate-50 border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          {/* ÖĞRENCİ VE VELİ ADI */}
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={seciliMi}
                              onChange={() => veliSecimiDegistir(v.uniqueKey)}
                              className="w-4 h-4 accent-amber-600 rounded cursor-pointer shrink-0"
                            />

                            <div>
                              <p className="text-xs font-black text-slate-950">
                                🎓 {v.ogrenciAdSoyad}
                              </p>
                              <p className="text-[11px] font-bold text-slate-600 mt-0.5">
                                👤 Veli: <strong>{v.veliAdSoyad}</strong> (
                                {v.yakinlik})
                              </p>
                            </div>
                          </div>

                          {/* BİREYSEL TEKLİ MESAJ BUTONU */}
                          <div>
                            {gonderildiMi ? (
                              <span className="bg-emerald-600 text-white font-black text-[10px] px-2.5 py-1 rounded-full">
                                ✓ Gönderildi
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  whatsappMesajGonder(v);
                                }}
                                className="text-[10px] bg-slate-200 hover:bg-slate-300 font-black px-3 py-1.5 rounded-xl text-slate-800 cursor-pointer whitespace-nowrap"
                              >
                                Tekli At
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="pt-2 flex justify-between items-center border-t border-slate-100">
                  <span className="text-xs font-bold text-slate-600">
                    Seçili Alıcı:{" "}
                    <strong className="text-emerald-700 font-black">
                      {secilenVeliKeyleri.length > 0
                        ? `${secilenVeliKeyleri.length} Veli`
                        : `Tüm Grubun Velileri (${seciliGrupVelileri.length})`}
                    </strong>
                  </span>

                  <button
                    type="button"
                    onClick={secilenVelilereTopluGonder}
                    className="bg-slate-900 hover:bg-slate-800 text-amber-400 font-black py-3 px-6 rounded-xl text-xs shadow cursor-pointer transition-all flex items-center gap-2"
                  >
                    <span>🚀</span>
                    <span>Seçilen Velilere Gönder</span>
                  </button>
                </div>

                {gonderimDurum && (
                  <p className="text-center text-xs font-black text-emerald-700 animate-pulse">
                    {gonderimDurum}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* SAĞ PANEL: GRUP SEÇİM LİSTESİ (5 KOLON) */}
        <div className="lg:col-span-5 bg-white p-6 md:p-8 rounded-3xl shadow-xl border-2 border-slate-300 space-y-4">
          <div className="border-b border-slate-200 pb-3 flex justify-between items-center">
            <h2 className="text-sm font-black text-slate-950 uppercase flex items-center gap-2">
              <span>🏆</span> 2. Duyuru Yapılacak Grubu Seçin
            </h2>
            <span className="text-[10px] font-black bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg">
              {gruplar.length} Grup
            </span>
          </div>

          {loading ? (
            <p className="text-xs font-bold text-slate-400 py-8 text-center">
              Gruplar yükleniyor...
            </p>
          ) : gruplar.length === 0 ? (
            <p className="text-xs font-bold text-slate-400 py-8 text-center">
              Sistemde tanımlı grup bulunamadı. Geliştirici Paneli'nden grup
              ekleyebilirsiniz.
            </p>
          ) : (
            <div className="space-y-3">
              {gruplar.map((g) => {
                const grupAdi = typeof g === "object" ? g.ad : g;
                const seciliMi = seciliGrupAdi === grupAdi;

                const gruptakiOgrenciSayisi = ogrenciler.filter(
                  (o) => o.grup === grupAdi,
                ).length;

                return (
                  <div
                    key={g._id || grupAdi}
                    onClick={() => setSeciliGrup(g)}
                    className={`p-4 rounded-2xl border-2 transition cursor-pointer flex items-center justify-between ${
                      seciliMi
                        ? "bg-amber-100 border-amber-500 shadow-md scale-[1.01]"
                        : "bg-slate-50 border-slate-200 hover:border-slate-400"
                    }`}
                  >
                    <div className="space-y-1">
                      <h3 className="font-black text-xs text-slate-950 flex items-center gap-2">
                        <span>🏆</span>
                        <span>{grupAdi}</span>
                      </h3>
                      <p className="text-[10px] font-bold text-slate-500">
                        👥 Kayıtlı Sporcu:{" "}
                        <strong>{gruptakiOgrenciSayisi} Öğrenci</strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {g.whatsappLink ? (
                        <span className="text-[10px] bg-emerald-100 text-emerald-900 font-black px-2 py-1 rounded-lg border border-emerald-300">
                          ✓ Link Var
                        </span>
                      ) : (
                        <span className="text-[10px] bg-slate-200 text-slate-600 font-bold px-2 py-1 rounded-lg">
                          Link Yok
                        </span>
                      )}

                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-black ${
                          seciliMi
                            ? "bg-amber-500 text-slate-950"
                            : "bg-slate-200 text-slate-400"
                        }`}
                      >
                        {seciliMi ? "✓" : "+"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
