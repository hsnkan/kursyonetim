"use client";
import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import Link from "next/link";

export default function OgrenciYonetimPage() {
  const WHATSAPP_GRUP_LINKI = "https://chat.whatsapp.com/GrupDavetKodunuz";

  const [ogrenciler, setOgrenciler] = useState([]);
  const [gruplar, setGruplar] = useState([
    "Minikler Cimnastik (Cumartesi-Pazar)",
    "Yıldızlar Cimnastik (Salı-Perşembe)",
    "İleri Seviye (Pazartesi-Çarşamba-Cuma)",
  ]);
  const [loading, setLoading] = useState(true);

  // Arama & Filtre State'leri
  const [aramaMetni, setAramaMetni] = useState("");
  const [filtreGrup, setFiltreGrup] = useState("Tüm Gruplar");

  // Panel & Modallar
  const [seciliOgrenci, setSeciliOgrenci] = useState(null);
  const [ogrenciGirisGecmisi, setOgrenciGirisGecmisi] = useState([]);
  const [transferOgrenci, setTransferOgrenci] = useState(null);
  const [yeniGrupAdi, setYeniGrupAdi] = useState("");
  const [hedefGrup, setHedefGrup] = useState("");

  // Excel ve Güncelleme Modalları
  const [excelModalAcik, setExcelModalAcik] = useState(false);
  const [duzenleModalAcik, setDuzenleModalAcik] = useState(false);
  const [duzenleForm, setDuzenleForm] = useState({});
  const [duzenleGeciciVeli, setDuzenleGeciciVeli] = useState({
    adSoyad: "",
    yakinlikDerecesi: "Anne",
    telefon: "",
  });

  // Takvim Ay/Yıl State'i
  const [takvimTarih, setTakvimTarih] = useState(new Date());

  // Çoklu Veli State'i
  const [eklenenVeliler, setEklenenVeliler] = useState([]);
  const [geciciVeli, setGeciciVeli] = useState({
    adSoyad: "",
    yakinlikDerecesi: "Anne",
    telefon: "",
  });

  // Form State
  const [form, setForm] = useState({
    adSoyad: "",
    kanGrubu: "0 Rh+",
    lisansliMi: false,
    grup: "Minikler Cimnastik (Cumartesi-Pazar)",
    aylikUcret: 2000,
    odemeGunu: 1,
    nfcKartId: "",
  });

  const ogrencileriGetir = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/ogrenciler?durum=aktif");
      const data = await res.json();
      if (data.success) setOgrenciler(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 🛡️ DÜZELTİLEN VE KORUMAYA ALINAN YOKLAMA GEÇMİŞİ FONKSİYONU
  const ogrenciYoklamaGecmisiniGetir = async (ogrenciId) => {
    try {
      const res = await fetch(`/api/yoklama?ogrenciId=${ogrenciId}`);
      if (!res.ok) {
        setOgrenciGirisGecmisi([]);
        return;
      }
      const text = await res.text();
      if (!text) {
        setOgrenciGirisGecmisi([]);
        return;
      }
      const data = JSON.parse(text);
      if (data.success) {
        setOgrenciGirisGecmisi(data.data || []);
      } else {
        setOgrenciGirisGecmisi([]);
      }
    } catch (err) {
      console.error("Yoklama verisi okuma hatası engellendi:", err);
      setOgrenciGirisGecmisi([]);
    }
  };

  useEffect(() => {
    ogrencileriGetir();
  }, []);

  const ogrenciSecVePaneliAc = (ogrenci) => {
    setSeciliOgrenci(ogrenci);
    setDuzenleForm(JSON.parse(JSON.stringify(ogrenci)));
    ogrenciYoklamaGecmisiniGetir(ogrenci._id);
  };

  // 📥 ÖRNEK ŞABLON EXCEL DOSYASI İNDİR
  const ornekExcelIndir = () => {
    const ornekVeri = [
      {
        "Öğrenci Adı Soyadı": "Zeynep Kaya",
        Grup: "Minikler Cimnastik (Cumartesi-Pazar)",
        "Veli Adı": "Ayşe Kaya",
        Yakınlık: "Anne",
        "Veli Telefon": "05321112233",
        "Kan Grubu": "0 Rh+",
        "Lisanslı mı": "Evet",
        "Aylık Ücret": 2000,
        "Ödeme Günü": 1,
        "NFC Kart ID": "12345678",
      },
    ];

    const ws = XLSX.utils.json_to_sheet(ornekVeri);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Öğrenci Kayıt Şablonu");
    XLSX.writeFile(wb, "Balans_Cimnastik_Ornek_Ogrenci_Yukleme_Sablonu.xlsx");
  };

  // 🗑️ ÖĞRENCİ SİL
  const ogrenciSil = async (id, adSoyad) => {
    if (
      !confirm(
        `${adSoyad} isimli öğrenciyi kalıcı olarak silmek istediğinize emin misiniz?`,
      )
    )
      return;
    try {
      const res = await fetch(`/api/ogrenciler/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        alert("🗑️ Öğrenci Başarıyla Silindi!");
        ogrencileriGetir();
      } else {
        alert("Hata: " + (data.error || "Silinemedi"));
      }
    } catch (err) {
      alert("Silme işlemi sırasında sunucu hatası oluştu.");
    }
  };

  // ⏸️ ÖĞRENCİ DONDUR
  const ogrenciDondur = async (id, adSoyad) => {
    if (
      !confirm(
        `${adSoyad} isimli öğrencinin kaydını dondurmak istediğinize emin misiniz?`,
      )
    )
      return;
    try {
      const res = await fetch(`/api/ogrenciler/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ durum: "pasif" }),
      });
      const data = await res.json();
      if (data.success) {
        alert("⏸️ Öğrenci Donduruldu!");
        ogrencileriGetir();
      }
    } catch (err) {
      alert("Hata oluştu.");
    }
  };

  // ✏️ ÖĞRENCİ BİLGİLERİNİ GÜNCELLE
  const ogrenciGuncelle = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/ogrenciler/${seciliOgrenci._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(duzenleForm),
      });
      const data = await res.json();
      if (data.success) {
        alert("✅ Öğrenci ve Veli Bilgileri Başarıyla Güncellendi!");
        setSeciliOgrenci(data.data);
        setDuzenleModalAcik(false);
        ogrencileriGetir();
      } else {
        alert("Güncelleme Hatası: " + data.error);
      }
    } catch (err) {
      alert("Güncelleme sırasında hata oluştu.");
    }
  };

  const duzenleVeliEkle = (e) => {
    e.preventDefault();
    if (
      !duzenleGeciciVeli.adSoyad.trim() ||
      !duzenleGeciciVeli.telefon.trim()
    ) {
      return alert("Lütfen Veli Ad Soyad ve Telefon girin!");
    }
    const mevcut = duzenleForm.veliListesi || [];
    setDuzenleForm({
      ...duzenleForm,
      veliListesi: [...mevcut, { ...duzenleGeciciVeli }],
    });
    setDuzenleGeciciVeli({
      adSoyad: "",
      yakinlikDerecesi: "Anne",
      telefon: "",
    });
  };

  const duzenleVeliCikar = (index) => {
    const mevcut = duzenleForm.veliListesi || [];
    setDuzenleForm({
      ...duzenleForm,
      veliListesi: mevcut.filter((_, i) => i !== index),
    });
  };

  // 📊 EXCEL YÜKLE
  const excelYukle = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        if (data.length === 0)
          return alert("Excel dosyası boş veya format hatalı!");

        const yuklenecekler = data.map((item) => ({
          adSoyad: item["Öğrenci Adı Soyadı"] || item["adSoyad"] || "",
          grup: item["Grup"] || item["grup"] || gruplar[0],
          kanGrubu: item["Kan Grubu"] || "0 Rh+",
          lisansliMi: String(item["Lisanslı mı"]).toLowerCase() === "evet",
          aylikUcret: Number(item["Aylık Ücret"]) || 2000,
          odemeGunu: Number(item["Ödeme Günü"]) || 1,
          nfcKartId: item["NFC Kart ID"]
            ? String(item["NFC Kart ID"])
            : undefined,
          veliListesi: [
            {
              adSoyad: item["Veli Adı"] || "Veli",
              yakinlikDerecesi: item["Yakınlık"] || "Anne",
              telefon: String(item["Veli Telefon"] || "05000000000"),
            },
          ],
        }));

        let basarili = 0;
        for (const ogrenci of yuklenecekler) {
          if (ogrenci.adSoyad) {
            await fetch("/api/ogrenciler", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(ogrenci),
            });
            basarili++;
          }
        }

        alert(`🚀 Toplam ${basarili} öğrenci Excel'den başarıyla yüklendi!`);
        setExcelModalAcik(false);
        ogrencileriGetir();
      } catch (err) {
        alert("Excel dosyası okunurken hata oluştu!");
      }
    };
    reader.readAsBinaryString(file);
  };

  // 📄 PDF ÇIKTI
  const ciktiAlPdf = (ogrenciData) => {
    const veliler =
      ogrenciData.veliListesi && ogrenciData.veliListesi.length > 0
        ? ogrenciData.veliListesi
            .map(
              (v) => `
          <tr>
            <td class="label">Veli Ad Soyad / Yakınlık:</td>
            <td class="val">${v.adSoyad} (${v.yakinlikDerecesi})</td>
            <td class="label">İletişim Telefonu:</td>
            <td class="val">${v.telefon}</td>
          </tr>
        `,
            )
            .join("")
        : '<tr><td colspan="4" class="empty-text">Kayıtlı Veli Bilgisi Bulunmamaktadır</td></tr>';

    const printWindow = window.open("", "_blank");

    const htmlIcerik = `
      <!DOCTYPE html>
      <html lang="tr">
      <head>
        <meta charset="utf-8">
        <title>Öğrenci Kayıt Formu - ${ogrenciData.adSoyad || "Öğrenci"}</title>
        <style>
          @page { size: A4 portrait; margin: 12mm 15mm; }
          * { box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; color: #0F172A; margin: 0; padding: 0; background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .header-container { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0F172A; padding-bottom: 12px; margin-bottom: 18px; }
          .brand-info { flex: 1; }
          .brand-title { font-size: 19pt; font-weight: 800; color: #0F172A; letter-spacing: 0.5px; text-transform: uppercase; }
          .brand-sub { font-size: 10.5pt; font-weight: 700; color: #D97706; letter-spacing: 1.5px; text-transform: uppercase; margin-top: 3px; }
          .photo-box { width: 4.5cm; height: 4.5cm; min-width: 4.5cm; min-height: 4.5cm; max-width: 4.5cm; max-height: 4.5cm; border: 2px dashed #475569; border-radius: 6px; background-color: #F8FAFC; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; font-size: 8pt; font-weight: 700; color: #475569; margin-left: 15px; }
          .photo-box span { font-size: 7pt; font-weight: 400; color: #94A3B8; margin-top: 2px; }
          .section-header { background-color: #0F172A; color: #FFFFFF; font-size: 9.5pt; font-weight: 800; padding: 5px 10px; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 14px; border-radius: 4px; }
          .data-table { width: 100%; border-collapse: collapse; margin-top: 5px; margin-bottom: 10px; }
          .data-table td { border: 1px solid #CBD5E1; padding: 7px 10px; font-size: 9pt; }
          .label { background-color: #F1F5F9; font-weight: 700; color: #334155; width: 25%; }
          .val { font-weight: 600; color: #0F172A; width: 25%; }
          .empty-text { text-align: center; color: #94A3B8; font-style: italic; padding: 10px; }
          .footer-signatures { display: flex; justify-content: space-between; margin-top: 40px; padding: 0 30px; }
          .sig-box { text-align: center; font-size: 9pt; font-weight: 700; color: #334155; width: 40%; }
          .sig-line { margin-top: 45px; border-bottom: 1.5px solid #0F172A; }
        </style>
      </head>
      <body>
        <div class="header-container">
          <div class="brand-info">
            <div class="brand-title">BALANS CİMNASTİK AKADEMİSİ</div>
            <div class="brand-sub">RESMİ ÖĞRENCİ KAYIT VE SÖZLEŞME FORMU</div>
          </div>
          <div class="photo-box">
            FOTOĞRAF ALANI
            <span>( 4.5 cm x 4.5 cm )</span>
          </div>
        </div>

        <div class="section-header">1. SPORCU KİŞİSEL BİLGİLERİ</div>
        <table class="data-table">
          <tr>
            <td class="label">Sporcu Ad Soyad:</td>
            <td class="val" style="color: #1E3A8A; font-size: 10pt; font-weight: 800;">${ogrenciData.adSoyad || "..........................................."}</td>
            <td class="label">Kan Grubu:</td>
            <td class="val">${ogrenciData.kanGrubu || "Belirtilmedi"}</td>
          </tr>
          <tr>
            <td class="label">Cimnastik Grubu:</td>
            <td class="val">${ogrenciData.grup || "..........................................."}</td>
            <td class="label">Sporcu Lisansı:</td>
            <td class="val">${ogrenciData.lisansliMi ? "✓ Var (Lisanslı)" : "Yok"}</td>
          </tr>
          <tr>
            <td class="label">NFC Kart / Bileklik ID:</td>
            <td class="val">${ogrenciData.nfcKartId || "Tanımlanmadı"}</td>
            <td class="label">Kayıt Tarihi:</td>
            <td class="val">${new Date(ogrenciData.kayitTarihi || Date.now()).toLocaleDateString("tr-TR")}</td>
          </tr>
        </table>

        <div class="section-header">2. VELİ VE İLETİŞİM BİLGİLERİ</div>
        <table class="data-table">
          ${veliler}
        </table>

        <div class="section-header">3. DERS VE AİDAT TAKVİMİ</div>
        <table class="data-table">
          <tr>
            <td class="label">Anlaşılan Aylık Ücret:</td>
            <td class="val" style="color: #047857; font-weight: 800;">${ogrenciData.aylikUcret || 2000} ₺</td>
            <td class="label">Aylık Ödeme Günü:</td>
            <td class="val">Her ayın ${ogrenciData.odemeGunu || 1}. günü</td>
          </tr>
        </table>

        <div class="footer-signatures">
          <div class="sig-box">
            Akademi Yetkilisi İmza
            <div class="sig-line"></div>
          </div>
          <div class="sig-box">
            Veli Ad Soyad / İmza
            <div class="sig-line"></div>
          </div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() { window.print(); }, 300);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlIcerik);
    printWindow.document.close();
  };

  const veliEkle = (e) => {
    e.preventDefault();
    if (!geciciVeli.adSoyad.trim() || !geciciVeli.telefon.trim()) {
      return alert("Lütfen Veli Ad Soyad ve Telefon numarasını girin!");
    }
    setEklenenVeliler([...eklenenVeliler, { ...geciciVeli }]);
    setGeciciVeli({ adSoyad: "", yakinlikDerecesi: "Anne", telefon: "" });
  };

  const veliCikar = (index) => {
    setEklenenVeliler(eklenenVeliler.filter((_, i) => i !== index));
  };

  const yeniOgrenciKaydet = async (e) => {
    e.preventDefault();
    if (eklenenVeliler.length === 0)
      return alert("⚠️ Lütfen en az 1 veli ekleyin!");

    const payload = {
      ...form,
      veliListesi: eklenenVeliler,
      nfcKartId: form.nfcKartId || undefined,
    };

    const res = await fetch("/api/ogrenciler", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();

    if (data.success) {
      alert("🚀 Öğrenci Kaydedildi!");
      setForm({
        adSoyad: "",
        kanGrubu: "0 Rh+",
        lisansliMi: false,
        grup: gruplar[0],
        aylikUcret: 2000,
        odemeGunu: 1,
        nfcKartId: "",
      });
      setEklenenVeliler([]);
      ogrencileriGetir();
    } else {
      alert("❌ Hata: " + data.error);
    }
  };

  const whatsappDavetGonder = (telefon, ogrenciAdi) => {
    const temizTelefon = telefon.replace(/\D/g, "");
    const mesaj = `Merhaba, Balans Cimnastik Akademi'ye hoş geldiniz! ${ogrenciAdi} isimli öğrencimizin duyurularını takip edebileceğiniz WhatsApp grubumuzun katılım linki: ${WHATSAPP_GRUP_LINKI}`;
    window.open(
      `https://api.whatsapp.com/send?phone=90${temizTelefon}&text=${encodeURIComponent(mesaj)}`,
      "_blank",
    );
  };

  const yeniGrupEkle = () => {
    if (!yeniGrupAdi.trim()) return;
    if (gruplar.includes(yeniGrupAdi.trim()))
      return alert("Bu grup zaten mevcut!");
    setGruplar([...gruplar, yeniGrupAdi.trim()]);
    setYeniGrupAdi("");
  };

  const grupTransferiYap = async () => {
    if (!hedefGrup) return alert("Hedef grubu seçin!");
    const res = await fetch(`/api/ogrenciler/${transferOgrenci._id}/transfer`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ yeniGrup: hedefGrup }),
    });
    const data = await res.json();
    if (data.success) {
      alert("🔄 Transfer Edildi!");
      setTransferOgrenci(null);
      ogrencileriGetir();
    }
  };

  // 🎯 DÜZELTİLMİŞ KESİN GÜN TESPİT TAKVİMİ
  const takvimGunleriniGetir = () => {
    const yil = takvimTarih.getFullYear();
    const ay = takvimTarih.getMonth();

    const ilkGun = new Date(yil, ay, 1).getDay();
    const toplamGun = new Date(yil, ay + 1, 0).getDate();

    const baslangicOfset = ilkGun === 0 ? 6 : ilkGun - 1;
    const gunler = [];

    for (let i = 0; i < baslangicOfset; i++) {
      gunler.push({ bos: true });
    }

    const grupAdi = (seciliOgrenci?.grup || "").toLowerCase();
    const gunIsimleri = [
      "Pazar",
      "Pazartesi",
      "Salı",
      "Çarşamba",
      "Perşembe",
      "Cuma",
      "Cumartesi",
    ];

    const nfcGirisTarihleri = ogrenciGirisGecmisi.map((y) => {
      return new Date(y.tarih).toISOString().split("T")[0];
    });

    for (let g = 1; g <= toplamGun; g++) {
      const tarihObj = new Date(yil, ay, g);
      const haftaninGunuIndeksi = tarihObj.getDay();
      const gunAdi = gunIsimleri[haftaninGunuIndeksi];

      // Kelime sınırı regex araması ile Cuma-Cumartesi karışıklığı engellendi
      const dersGunuMu = new RegExp(`\\b${gunAdi.toLowerCase()}\\b`, "i").test(
        grupAdi,
      );

      const tFormatli = `${yil}-${String(ay + 1).padStart(2, "0")}-${String(g).padStart(2, "0")}`;
      const nfcGirisYapildiMu = nfcGirisTarihleri.includes(tFormatli);

      gunler.push({
        gun: g,
        dersGunuMu,
        nfcGirisYapildiMu,
        gunAdi,
      });
    }

    return gunler;
  };

  const filtrelenmisOgrenciler = ogrenciler.filter((o) => {
    const aramaUyumlu =
      o.adSoyad.toLowerCase().includes(aramaMetni.toLowerCase()) ||
      (o.veliListesi &&
        o.veliListesi.some(
          (v) =>
            v.adSoyad.toLowerCase().includes(aramaMetni.toLowerCase()) ||
            v.telefon.includes(aramaMetni),
        ));

    const grupUyumlu = filtreGrup === "Tüm Gruplar" || o.grup === filtreGrup;

    return aramaUyumlu && grupUyumlu;
  });

  // 🔴 ÖĞRENCİ ÖZEL PANELİ
  if (seciliOgrenci) {
    const ayIsimleri = [
      "Ocak",
      "Şubat",
      "Mart",
      "Nisan",
      "Mayıs",
      "Haziran",
      "Temmuz",
      "Ağustos",
      "Eylul",
      "Ekim",
      "Kasım",
      "Aralık",
    ];

    const takvimGunleri = takvimGunleriniGetir();

    return (
      <div className="space-y-6 animate-fadeIn text-slate-900 pb-12">
        <div className="bg-[#0F172A] text-white p-6 rounded-3xl shadow-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border border-slate-800">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSeciliOgrenci(null)}
              className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-black px-4 py-2.5 rounded-2xl text-xs flex items-center gap-2 shadow-lg transition-all"
            >
              <span>←</span>
              <span>Öğrenci Listesine Dön</span>
            </button>

            <div>
              <h1 className="text-2xl font-black text-white tracking-wide">
                {seciliOgrenci.adSoyad}
              </h1>
              <p className="text-xs font-bold text-amber-400 uppercase tracking-widest mt-0.5">
                {seciliOgrenci.grup} • Özel Öğrenci Paneli
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setDuzenleModalAcik(true)}
              className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-black px-4 py-3 rounded-2xl text-xs flex items-center gap-2 shadow-xl"
            >
              <span>✏️</span>
              <span>Bilgileri Güncelle</span>
            </button>

            <button
              onClick={() => ciktiAlPdf(seciliOgrenci)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-black px-5 py-3 rounded-2xl text-xs flex items-center gap-2 shadow-xl border border-blue-400/30"
            >
              <span>📄</span>
              <span>Resmi PDF Kayıt Formu İndir</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-3xl border-2 border-slate-200 shadow-md">
            <span className="text-[10px] font-black uppercase text-slate-400">
              Lisans Durumu
            </span>
            <p
              className={`text-base font-black mt-1 ${seciliOgrenci.lisansliMi ? "text-emerald-600" : "text-slate-600"}`}
            >
              {seciliOgrenci.lisansliMi
                ? "✓ Lisanslı Sporcu"
                : "Lisans Bulunmuyor"}
            </p>
          </div>

          <div className="bg-white p-5 rounded-3xl border-2 border-slate-200 shadow-md">
            <span className="text-[10px] font-black uppercase text-slate-400">
              Kan Grubu
            </span>
            <p className="text-base font-black text-slate-900 mt-1">
              {seciliOgrenci.kanGrubu || "Belirtilmedi"}
            </p>
          </div>

          <div className="bg-white p-5 rounded-3xl border-2 border-slate-200 shadow-md">
            <span className="text-[10px] font-black uppercase text-slate-400">
              NFC Kart ID
            </span>
            <p className="text-base font-mono font-black text-amber-600 mt-1">
              {seciliOgrenci.nfcKartId || "Tanımlı Değil"}
            </p>
          </div>

          <div className="bg-white p-5 rounded-3xl border-2 border-slate-200 shadow-md">
            <span className="text-[10px] font-black uppercase text-slate-400">
              Aylık Aidat
            </span>
            <p className="text-base font-black text-emerald-700 mt-1">
              ₺{seciliOgrenci.aylikUcret || 2000} / Ayın{" "}
              {seciliOgrenci.odemeGunu || 1}. günü
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 bg-white p-6 rounded-3xl border-2 border-slate-200 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-center border-b border-slate-200 pb-4 gap-2">
              <div>
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <span>📅</span> NFC Katılım Takvimi
                </h2>
                <p className="text-xs font-bold text-slate-500">
                  Kart okutarak derse giriş yapılan günler yeşil tik (✓) ile
                  gösterilir.
                </p>
              </div>

              <div className="flex items-center space-x-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-300">
                <button
                  onClick={() =>
                    setTakvimTarih(
                      new Date(
                        takvimTarih.getFullYear(),
                        takvimTarih.getMonth() - 1,
                        1,
                      ),
                    )
                  }
                  className="px-2.5 py-1 rounded-xl bg-white font-black text-xs shadow-sm hover:bg-slate-200"
                >
                  ◄
                </button>
                <span className="text-xs font-black px-2 uppercase text-slate-800">
                  {ayIsimleri[takvimTarih.getMonth()]}{" "}
                  {takvimTarih.getFullYear()}
                </span>
                <button
                  onClick={() =>
                    setTakvimTarih(
                      new Date(
                        takvimTarih.getFullYear(),
                        takvimTarih.getMonth() + 1,
                        1,
                      ),
                    )
                  }
                  className="px-2.5 py-1 rounded-xl bg-white font-black text-xs shadow-sm hover:bg-slate-200"
                >
                  ►
                </button>
              </div>
            </div>

            <div>
              <div className="grid grid-cols-7 text-center font-black text-[11px] text-slate-400 uppercase py-2">
                <div>Pzt</div>
                <div>Sal</div>
                <div>Çar</div>
                <div>Per</div>
                <div>Cum</div>
                <div className="text-amber-600">Cmt</div>
                <div className="text-amber-600">Paz</div>
              </div>

              <div className="grid grid-cols-7 gap-2 pt-1">
                {takvimGunleri.map((item, idx) => {
                  if (item.bos) {
                    return (
                      <div
                        key={idx}
                        className="h-14 rounded-2xl bg-slate-50/50"
                      ></div>
                    );
                  }

                  let hucreStil =
                    "bg-slate-50 border-slate-200 text-slate-400 opacity-60";
                  if (item.nfcGirisYapildiMu) {
                    hucreStil =
                      "bg-emerald-100 border-emerald-500 text-emerald-950 shadow-md font-black";
                  } else if (item.dersGunuMu) {
                    hucreStil =
                      "bg-amber-50/50 border-amber-300 text-amber-900 font-bold";
                  }

                  return (
                    <div
                      key={idx}
                      className={`h-14 rounded-2xl p-2 flex flex-col justify-between items-center relative transition-all border-2 ${hucreStil}`}
                    >
                      <span className="text-xs">{item.gun}</span>

                      {item.nfcGirisYapildiMu ? (
                        <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-black shadow-sm">
                          ✓
                        </span>
                      ) : item.dersGunuMu ? (
                        <span className="text-[9px] font-bold text-amber-600">
                          DERS
                        </span>
                      ) : (
                        <span className="text-[9px] text-slate-300">-</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-slate-700 text-xs font-bold flex justify-between items-center">
              <span>Grup Tanımlı Ders Günleri:</span>
              <span className="font-black text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1 rounded-xl text-[11px]">
                {seciliOgrenci.grup}
              </span>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white p-6 rounded-3xl border-2 border-slate-200 shadow-xl space-y-3">
              <h3 className="text-base font-black text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
                <span>👨‍👩‍👧</span> Veli İletişim Bilgileri
              </h3>

              <div className="space-y-2">
                {seciliOgrenci.veliListesi?.map((v, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex justify-between items-center text-xs"
                  >
                    <div>
                      <p className="font-black text-slate-900">
                        {v.adSoyad} ({v.yakinlikDerecesi})
                      </p>
                      <p className="text-[11px] font-bold text-slate-500 mt-0.5">
                        {v.telefon}
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        whatsappDavetGonder(v.telefon, seciliOgrenci.adSoyad)
                      }
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-3 py-1.5 rounded-xl text-xs shadow-md"
                    >
                      📲 WhatsApp
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* 📜 ŞİMDİKİ BULUNDUĞU GRUP ADI EKLEMENMİŞ GRUP TRANSFER GEÇMİŞİ KARTI */}
            <div className="bg-white p-6 rounded-3xl border-2 border-slate-200 shadow-xl space-y-4">
              <div className="border-b border-slate-200 pb-3 flex justify-between items-center">
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <span>📜</span> Grup Transfer Geçmişi
                </h3>
              </div>

              {/* 📍 ŞİMDİKİ BULUNDUĞU GRUP ADI (VURGULU BİLGİ KARTI) */}
              <div className="p-3 bg-slate-900 text-white rounded-2xl space-y-1">
                <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                  Şimdiki Bulunduğu Grup:
                </p>
                <p className="text-xs font-black text-white">
                  📌 {seciliOgrenci.grup}
                </p>
              </div>

              {!seciliOgrenci.grupTransferGecmisi ||
              seciliOgrenci.grupTransferGecmisi.length === 0 ? (
                <p className="text-xs font-bold text-slate-400 py-1">
                  Henüz grup transferi yapılmadı.
                </p>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto pt-1">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                    Geçmiş Transferler:
                  </p>
                  {seciliOgrenci.grupTransferGecmisi.map((t, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-amber-50 rounded-xl text-xs font-bold border border-amber-200 flex justify-between items-center"
                    >
                      <span>
                        {t.eskiGrup} ➔{" "}
                        <strong className="text-blue-700">{t.yeniGrup}</strong>
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        {new Date(t.tarih).toLocaleDateString("tr-TR")}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ✏️ ÖĞRENCİ VE VELİ BİLGİLERİNİ EKSİKSİZ GÜNCELLEME MODALI */}
        {duzenleModalAcik && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl border-2 border-slate-900 max-w-xl w-full p-6 shadow-2xl space-y-4 text-slate-900 relative max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => setDuzenleModalAcik(false)}
                className="absolute top-4 right-4 font-black text-xl text-slate-400 hover:text-slate-900"
              >
                ✕
              </button>
              <h3 className="text-lg font-black border-b border-slate-200 pb-2">
                ✏️ Öğrenci ve Veli Bilgilerini Güncelle
              </h3>

              <form onSubmit={ogrenciGuncelle} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-700 mb-1">
                    Öğrenci Ad Soyad *
                  </label>
                  <input
                    type="text"
                    required
                    value={duzenleForm.adSoyad || ""}
                    onChange={(e) =>
                      setDuzenleForm({
                        ...duzenleForm,
                        adSoyad: e.target.value,
                      })
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-bold text-xs bg-slate-50 outline-none"
                  />
                </div>

                {/* VELİ GÜNCELLEME ALANI */}
                <div className="p-4 bg-slate-50 rounded-2xl border-2 border-slate-200 space-y-3">
                  <p className="text-xs font-black uppercase text-slate-800">
                    👨‍👩‍👧 Veli Bilgileri
                  </p>

                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder="Veli Adı"
                      value={duzenleGeciciVeli.adSoyad}
                      onChange={(e) =>
                        setDuzenleGeciciVeli({
                          ...duzenleGeciciVeli,
                          adSoyad: e.target.value,
                        })
                      }
                      className="col-span-2 p-2 rounded-xl border border-slate-300 text-xs font-bold bg-white"
                    />
                    <select
                      value={duzenleGeciciVeli.yakinlikDerecesi}
                      onChange={(e) =>
                        setDuzenleGeciciVeli({
                          ...duzenleGeciciVeli,
                          yakinlikDerecesi: e.target.value,
                        })
                      }
                      className="p-2 rounded-xl border border-slate-300 text-xs font-bold bg-white"
                    >
                      <option value="Anne">Anne</option>
                      <option value="Baba">Baba</option>
                      <option value="Vasi">Vasi</option>
                    </select>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Telefon (05xxxxxxxxx)"
                      value={duzenleGeciciVeli.telefon}
                      onChange={(e) =>
                        setDuzenleGeciciVeli({
                          ...duzenleGeciciVeli,
                          telefon: e.target.value,
                        })
                      }
                      className="flex-1 p-2 rounded-xl border border-slate-300 text-xs font-bold bg-white"
                    />
                    <button
                      type="button"
                      onClick={duzenleVeliEkle}
                      className="bg-emerald-600 text-white font-black px-3 py-2 rounded-xl text-xs"
                    >
                      + Ekle
                    </button>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-200">
                    <p className="text-[10px] font-black text-slate-500 uppercase">
                      Kayıtlı Veliler:
                    </p>
                    {duzenleForm.veliListesi &&
                      duzenleForm.veliListesi.map((v, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 bg-white rounded-xl border border-slate-200 flex justify-between items-center text-xs"
                        >
                          <div className="space-y-1 flex-1 mr-2">
                            <input
                              type="text"
                              value={v.adSoyad}
                              onChange={(e) => {
                                const yeniList = [...duzenleForm.veliListesi];
                                yeniList[idx].adSoyad = e.target.value;
                                setDuzenleForm({
                                  ...duzenleForm,
                                  veliListesi: yeniList,
                                });
                              }}
                              className="w-full p-1 border rounded text-xs font-bold"
                            />
                            <div className="flex gap-1">
                              <select
                                value={v.yakinlikDerecesi}
                                onChange={(e) => {
                                  const yeniList = [...duzenleForm.veliListesi];
                                  yeniList[idx].yakinlikDerecesi =
                                    e.target.value;
                                  setDuzenleForm({
                                    ...duzenleForm,
                                    veliListesi: yeniList,
                                  });
                                }}
                                className="p-1 border rounded text-[10px] font-bold"
                              >
                                <option value="Anne">Anne</option>
                                <option value="Baba">Baba</option>
                                <option value="Vasi">Vasi</option>
                              </select>

                              <input
                                type="text"
                                value={v.telefon}
                                onChange={(e) => {
                                  const yeniList = [...duzenleForm.veliListesi];
                                  yeniList[idx].telefon = e.target.value;
                                  setDuzenleForm({
                                    ...duzenleForm,
                                    veliListesi: yeniList,
                                  });
                                }}
                                className="flex-1 p-1 border rounded text-xs font-bold"
                              />
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => duzenleVeliCikar(idx)}
                            className="text-rose-600 font-black text-sm px-2"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-700 mb-1">
                      Kan Grubu
                    </label>
                    <select
                      value={duzenleForm.kanGrubu || "0 Rh+"}
                      onChange={(e) =>
                        setDuzenleForm({
                          ...duzenleForm,
                          kanGrubu: e.target.value,
                        })
                      }
                      className="w-full p-2.5 rounded-xl border border-slate-300 font-bold text-xs bg-slate-50 outline-none"
                    >
                      <option value="0 Rh+">0 Rh+</option>
                      <option value="0 Rh-">0 Rh-</option>
                      <option value="A Rh+">A Rh+</option>
                      <option value="A Rh-">A Rh-</option>
                      <option value="B Rh+">B Rh+</option>
                      <option value="AB Rh+">AB Rh+</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-700 mb-1">
                      Lisans Durumu
                    </label>
                    <select
                      value={duzenleForm.lisansliMi ? "true" : "false"}
                      onChange={(e) =>
                        setDuzenleForm({
                          ...duzenleForm,
                          lisansliMi: e.target.value === "true",
                        })
                      }
                      className="w-full p-2.5 rounded-xl border border-slate-300 font-bold text-xs bg-slate-50 outline-none"
                    >
                      <option value="false">Yok</option>
                      <option value="true">Lisanslı</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-700 mb-1">
                    Cimnastik Grubu
                  </label>
                  <select
                    value={duzenleForm.grup || gruplar[0]}
                    onChange={(e) =>
                      setDuzenleForm({ ...duzenleForm, grup: e.target.value })
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-bold text-xs bg-slate-50 outline-none"
                  >
                    {gruplar.map((g, idx) => (
                      <option key={idx} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-700 mb-1">
                      Aylık Ücret (₺)
                    </label>
                    <input
                      type="number"
                      value={duzenleForm.aylikUcret || 2000}
                      onChange={(e) =>
                        setDuzenleForm({
                          ...duzenleForm,
                          aylikUcret: Number(e.target.value),
                        })
                      }
                      className="w-full p-2.5 rounded-xl border border-slate-300 font-bold text-xs bg-slate-50 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-700 mb-1">
                      Ödeme Günü
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={duzenleForm.odemeGunu || 1}
                      onChange={(e) =>
                        setDuzenleForm({
                          ...duzenleForm,
                          odemeGunu: Number(e.target.value),
                        })
                      }
                      className="w-full p-2.5 rounded-xl border border-slate-300 font-bold text-xs bg-slate-50 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-700 mb-1">
                    NFC Kart ID
                  </label>
                  <input
                    type="text"
                    value={duzenleForm.nfcKartId || ""}
                    onChange={(e) =>
                      setDuzenleForm({
                        ...duzenleForm,
                        nfcKartId: e.target.value,
                      })
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-bold text-xs bg-slate-50 outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setDuzenleModalAcik(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-200"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-xs font-black bg-amber-400 hover:bg-amber-500 shadow-md"
                  >
                    Tüm Değişiklikleri Kaydet
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 🟢 ÖĞRENCİ LİSTESİ VE YENİ KAYIT EKRANI
  return (
    <div className="space-y-8 text-slate-900">
      {/* BAŞLIK & EXCEL BUTONU */}
      <div className="bg-white p-6 rounded-3xl border-2 border-slate-200 shadow-xl text-slate-900 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-wide">
            Öğrenci Yönetimi & Kayıt Paneli
          </h1>
          <p className="text-xs font-bold text-slate-500 mt-0.5">
            Öğrenci Kaydı, Toplu Excel İçe Aktarma ve Arama Paneli
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* 📁 DONDURULANLAR & ARŞİV YÖNLENDİRME BUTONU */}
          <Link
            href="/dashboard/ogrenciler/arsiv"
            className="bg-slate-800 hover:bg-slate-900 text-amber-400 border border-slate-700 font-black px-4 py-2.5 rounded-2xl text-xs flex items-center gap-2 shadow-lg transition-all"
          >
            <span>📁</span>
            <span>Dondurulanlar & Arşiv</span>
          </Link>

          <button
            onClick={() => setExcelModalAcik(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-4 py-2.5 rounded-2xl text-xs flex items-center gap-2 shadow-lg transition-all"
          >
            <span>📊</span>
            <span>Excel'den Toplu Öğrenci Yükle</span>
          </button>

          <div className="flex items-center gap-2 bg-slate-100 p-2 rounded-2xl border border-slate-300">
            <input
              type="text"
              placeholder="+ Yeni Grup..."
              value={yeniGrupAdi}
              onChange={(e) => setYeniGrupAdi(e.target.value)}
              className="p-2 text-xs font-bold bg-white rounded-xl border border-slate-300 outline-none text-slate-900"
            />
            <button
              onClick={yeniGrupEkle}
              className="bg-[#0F172A] text-amber-400 font-black px-3 py-2 rounded-xl text-xs"
            >
              Grup Oluştur
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* SOL: FORMLAR */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl border-2 border-slate-200 shadow-xl text-slate-900 space-y-4">
          <h2 className="text-lg font-black border-b border-slate-200 pb-3">
            📝 Yeni Öğrenci Kaydı
          </h2>

          <form onSubmit={yeniOgrenciKaydet} className="space-y-4">
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-700 mb-1">
                Öğrenci Ad Soyad *
              </label>
              <input
                type="text"
                required
                value={form.adSoyad}
                onChange={(e) => setForm({ ...form, adSoyad: e.target.value })}
                placeholder="Örn: Ela Yılmaz"
                className="w-full p-2.5 rounded-xl border-2 border-slate-200 font-bold text-xs bg-slate-50 outline-none"
              />
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border-2 border-slate-200 space-y-3">
              <p className="text-xs font-black uppercase text-slate-800">
                👨‍👩‍👧 Veli Bilgisi Ekle
              </p>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="Veli Adı"
                  value={geciciVeli.adSoyad}
                  onChange={(e) =>
                    setGeciciVeli({ ...geciciVeli, adSoyad: e.target.value })
                  }
                  className="col-span-2 p-2 rounded-xl border border-slate-300 text-xs font-bold bg-white"
                />
                <select
                  value={geciciVeli.yakinlikDerecesi}
                  onChange={(e) =>
                    setGeciciVeli({
                      ...geciciVeli,
                      yakinlikDerecesi: e.target.value,
                    })
                  }
                  className="p-2 rounded-xl border border-slate-300 text-xs font-bold bg-white"
                >
                  <option value="Anne">Anne</option>
                  <option value="Baba">Baba</option>
                  <option value="Vasi">Vasi</option>
                </select>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Telefon (05xxxxxxxxx)"
                  value={geciciVeli.telefon}
                  onChange={(e) =>
                    setGeciciVeli({ ...geciciVeli, telefon: e.target.value })
                  }
                  className="flex-1 p-2 rounded-xl border border-slate-300 text-xs font-bold bg-white"
                />
                <button
                  type="button"
                  onClick={veliEkle}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-3 py-2 rounded-xl text-xs"
                >
                  + Veli Ekle
                </button>
              </div>

              {eklenenVeliler.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-slate-200">
                  {eklenenVeliler.map((v, idx) => (
                    <div
                      key={idx}
                      className="p-2 bg-white rounded-xl border border-slate-200 flex justify-between items-center text-xs"
                    >
                      <span>
                        <strong>{v.adSoyad}</strong> ({v.yakinlikDerecesi}) -{" "}
                        {v.telefon}
                      </span>
                      <button
                        type="button"
                        onClick={() => veliCikar(idx)}
                        className="text-rose-600 font-black text-sm px-1"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-700 mb-1">
                  Kan Grubu
                </label>
                <select
                  value={form.kanGrubu}
                  onChange={(e) =>
                    setForm({ ...form, kanGrubu: e.target.value })
                  }
                  className="w-full p-2.5 rounded-xl border-2 border-slate-200 font-bold text-xs bg-slate-50 outline-none"
                >
                  <option value="0 Rh+">0 Rh+</option>
                  <option value="0 Rh-">0 Rh-</option>
                  <option value="A Rh+">A Rh+</option>
                  <option value="A Rh-">A Rh-</option>
                  <option value="B Rh+">B Rh+</option>
                  <option value="AB Rh+">AB Rh+</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-700 mb-1">
                  Lisans
                </label>
                <select
                  value={form.lisansliMi}
                  onChange={(e) =>
                    setForm({ ...form, lisansliMi: e.target.value === "true" })
                  }
                  className="w-full p-2.5 rounded-xl border-2 border-slate-200 font-bold text-xs bg-slate-50 outline-none"
                >
                  <option value="false">Yok</option>
                  <option value="true">Lisanslı</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-slate-700 mb-1">
                Cimnastik Grubu *
              </label>
              <select
                value={form.grup}
                onChange={(e) => setForm({ ...form, grup: e.target.value })}
                className="w-full p-2.5 rounded-xl border-2 border-slate-200 font-bold text-xs bg-slate-50 outline-none"
              >
                {gruplar.map((g, idx) => (
                  <option key={idx} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            <div className="p-3 bg-amber-50 rounded-2xl border-2 border-amber-300">
              <label className="block text-[10px] font-black uppercase text-amber-900 mb-1">
                📡 NFC Kart ID
              </label>
              <input
                type="text"
                value={form.nfcKartId}
                onChange={(e) =>
                  setForm({ ...form, nfcKartId: e.target.value })
                }
                placeholder="Kartı Okutun..."
                className="w-full p-2 rounded-xl border-2 border-amber-400 font-extrabold text-xs bg-white text-slate-900 outline-none"
              />
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="submit"
                className="w-full bg-[#0F172A] hover:bg-slate-800 text-amber-400 font-black py-3.5 rounded-xl text-xs uppercase tracking-wider shadow-md"
              >
                🚀 Öğrenciyi Sisteme Kaydet
              </button>

              <button
                type="button"
                onClick={() =>
                  ciktiAlPdf({ ...form, veliListesi: eklenenVeliler })
                }
                className="w-full bg-blue-50 hover:bg-blue-100 text-blue-900 border-2 border-blue-300 font-black py-3 rounded-xl text-xs uppercase tracking-wider transition-colors"
              >
                📄 PDF Kayıt Formu İndir / Yazdır
              </button>
            </div>
          </form>
        </div>

        {/* SAĞ: ÖĞRENCİ LİSTESİ */}
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl border-2 border-slate-200 shadow-xl text-slate-900 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200 pb-3 gap-2">
            <h2 className="text-lg font-black">
              🎓 Kayıtlı Öğrenciler ({filtrelenmisOgrenciler.length})
            </h2>
            <span className="text-xs font-bold text-slate-400">
              Detay için isme tıklayın
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200">
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                🔍 İsim veya Veli Ara
              </label>
              <input
                type="text"
                placeholder="Öğrenci veya Veli Adı/Tel..."
                value={aramaMetni}
                onChange={(e) => setAramaMetni(e.target.value)}
                className="w-full p-2 rounded-xl border border-slate-300 font-bold text-xs bg-white outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                🏆 Gruba Göre Filtrele
              </label>
              <select
                value={filtreGrup}
                onChange={(e) => setFiltreGrup(e.target.value)}
                className="w-full p-2 rounded-xl border border-slate-300 font-bold text-xs bg-white outline-none"
              >
                <option value="Tüm Gruplar">Tüm Gruplar</option>
                {gruplar.map((g, idx) => (
                  <option key={idx} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center font-bold text-slate-400">
              Yükleniyor...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-900 text-white uppercase text-[10px] font-black tracking-wider">
                  <tr>
                    <th className="p-3">Öğrenci</th>
                    <th className="p-3">Grup</th>
                    <th className="p-3">Veliler</th>
                    <th className="p-3 text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-bold">
                  {filtrelenmisOgrenciler.length === 0 ? (
                    <tr>
                      <td
                        colSpan="4"
                        className="p-6 text-center text-slate-400 font-bold"
                      >
                        Aramanızla eşleşen öğrenci bulunamadı.
                      </td>
                    </tr>
                  ) : (
                    filtrelenmisOgrenciler.map((o) => (
                      <tr
                        key={o._id}
                        className="hover:bg-amber-50/50 transition-colors"
                      >
                        <td className="p-3">
                          <button
                            onClick={() => ogrenciSecVePaneliAc(o)}
                            className="font-black text-blue-600 hover:text-blue-800 underline text-left"
                          >
                            {o.adSoyad}
                          </button>
                        </td>
                        <td className="p-3 text-slate-700">{o.grup}</td>
                        <td className="p-3 text-slate-700">
                          {o.veliListesi && o.veliListesi.length > 0
                            ? `${o.veliListesi[0].adSoyad} (${o.veliListesi[0].yakinlikDerecesi})`
                            : "Veli Yok"}
                        </td>

                        <td className="p-3 text-right space-x-1 whitespace-nowrap">
                          <button
                            onClick={() => {
                              setTransferOgrenci(o);
                              setHedefGrup(o.grup);
                            }}
                            className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-black px-2 py-1 rounded-lg text-[10px]"
                            title="Grup Transferi"
                          >
                            🔄 Transfer
                          </button>

                          <button
                            onClick={() => ogrenciDondur(o._id, o.adSoyad)}
                            className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-black px-2 py-1 rounded-lg text-[10px]"
                            title="Kaydı Dondur"
                          >
                            ⏸ Dondur
                          </button>

                          <button
                            onClick={() => ogrenciSil(o._id, o.adSoyad)}
                            className="bg-rose-100 hover:bg-rose-200 text-rose-700 border border-rose-300 font-black px-2 py-1 rounded-lg text-[10px]"
                            title="Öğrenciyi Sil"
                          >
                            🗑️ Sil
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* 📊 EXCEL MODALI */}
      {excelModalAcik && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border-2 border-slate-900 max-w-2xl w-full p-6 shadow-2xl space-y-5 text-slate-900 relative">
            <button
              onClick={() => setExcelModalAcik(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 font-black text-xl"
            >
              ✕
            </button>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200 pb-3 gap-2">
              <h3 className="text-lg font-black flex items-center gap-2">
                <span>📊</span> Excel'den Toplu Öğrenci Yükle
              </h3>

              <button
                onClick={ornekExcelIndir}
                className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-black px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-all"
              >
                <span>📥</span>
                <span>Hazır Excel Şablonunu İndir (.xlsx)</span>
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-black text-slate-700 uppercase">
                📋 Excel Sütun Düzeni Ön İzlemesi:
              </p>

              <div className="overflow-x-auto border-2 border-slate-300 rounded-xl bg-slate-100 p-2 shadow-inner">
                <table className="w-full border-collapse bg-white text-[10px] text-center font-mono">
                  <thead>
                    <tr className="bg-slate-200 text-slate-600 border-b border-slate-300 font-bold">
                      <th className="p-1 border-r border-slate-300 bg-slate-300 w-6"></th>
                      <th className="p-1 border-r border-slate-300">A</th>
                      <th className="p-1 border-r border-slate-300">B</th>
                      <th className="p-1 border-r border-slate-300">C</th>
                      <th className="p-1 border-r border-slate-300">D</th>
                      <th className="p-1 border-r border-slate-300">E</th>
                      <th className="p-1 border-r border-slate-300">F</th>
                      <th className="p-1 border-r border-slate-300">G</th>
                      <th className="p-1 border-r border-slate-300">H</th>
                      <th className="p-1 border-r border-slate-300">I</th>
                      <th className="p-1">J</th>
                    </tr>
                    <tr className="bg-emerald-100 text-emerald-950 font-black border-b border-slate-300">
                      <td className="p-1.5 border-r border-slate-300 bg-slate-200 text-slate-600 font-bold">
                        1
                      </td>
                      <td className="p-1.5 border-r border-slate-300">
                        Öğrenci Adı Soyadı
                      </td>
                      <td className="p-1.5 border-r border-slate-300">Grup</td>
                      <td className="p-1.5 border-r border-slate-300">
                        Veli Adı
                      </td>
                      <td className="p-1.5 border-r border-slate-300">
                        Yakınlık
                      </td>
                      <td className="p-1.5 border-r border-slate-300">
                        Veli Telefon
                      </td>
                      <td className="p-1.5 border-r border-slate-300">
                        Kan Grubu
                      </td>
                      <td className="p-1.5 border-r border-slate-300">
                        Lisanslı mı
                      </td>
                      <td className="p-1.5 border-r border-slate-300">
                        Aylık Ücret
                      </td>
                      <td className="p-1.5 border-r border-slate-300">
                        Ödeme Günü
                      </td>
                      <td className="p-1.5">NFC Kart ID</td>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="text-slate-700">
                      <td className="p-1.5 border-r border-slate-300 bg-slate-200 font-bold text-slate-600">
                        2
                      </td>
                      <td className="p-1.5 border-r border-slate-300 font-bold text-blue-900">
                        Zeynep Kaya
                      </td>
                      <td className="p-1.5 border-r border-slate-300">
                        Minikler Cimnastik
                      </td>
                      <td className="p-1.5 border-r border-slate-300">
                        Ayşe Kaya
                      </td>
                      <td className="p-1.5 border-r border-slate-300">Anne</td>
                      <td className="p-1.5 border-r border-slate-300">
                        05321112233
                      </td>
                      <td className="p-1.5 border-r border-slate-300">0 Rh+</td>
                      <td className="p-1.5 border-r border-slate-300">Evet</td>
                      <td className="p-1.5 border-r border-slate-300">2000</td>
                      <td className="p-1.5 border-r border-slate-300">1</td>
                      <td className="p-1.5 text-amber-600">12345678</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="border-2 border-dashed border-slate-300 p-5 rounded-2xl text-center space-y-2 bg-slate-50">
              <label className="cursor-pointer bg-[#0F172A] hover:bg-slate-800 text-amber-400 font-black px-6 py-3 rounded-xl text-xs inline-block shadow-md">
                <span>📁 Hazırladığınız Excel Dosyasını Yükleyin (.xlsx)</span>
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={excelYukle}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* 🔄 ÖĞRENCİ MEVCUT GRUBU VURGULANMIŞ TRANSFER MODALI */}
      {transferOgrenci && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border-2 border-slate-900 max-w-md w-full p-6 shadow-2xl space-y-4 text-slate-900 relative">
            <button
              onClick={() => setTransferOgrenci(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 font-black text-xl"
            >
              ✕
            </button>

            <h3 className="text-lg font-black border-b border-slate-200 pb-2 flex items-center gap-2">
              <span>🔄</span> Grup Transferi
            </h3>

            <div className="p-3 bg-slate-900 text-white rounded-2xl space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Öğrenci Adı ve Mevcut Grubu:
              </p>
              <p className="text-sm font-black text-white">
                {transferOgrenci.adSoyad}
              </p>
              <div className="pt-1">
                <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2.5 py-1 rounded-lg inline-block">
                  📌 {transferOgrenci.grup}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-slate-600 mb-1">
                Transfer Edilecek Yeni Grubu Seçin:
              </label>
              <select
                value={hedefGrup}
                onChange={(e) => setHedefGrup(e.target.value)}
                className="w-full p-3 rounded-xl border-2 border-slate-300 font-bold text-xs bg-slate-50 outline-none"
              >
                {gruplar.map((g, idx) => (
                  <option key={idx} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setTransferOgrenci(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-200 hover:bg-slate-300"
              >
                İptal
              </button>
              <button
                onClick={grupTransferiYap}
                className="px-5 py-2 rounded-xl text-xs font-black bg-amber-400 hover:bg-amber-500 text-slate-950 shadow-md"
              >
                Transferi Onayla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
