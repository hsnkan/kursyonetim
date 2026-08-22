"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import PageHeader from "@/app/components/PageHeader";
import { IconStudents } from "@/app/components/NavIcons";
import { useBranding } from "@/app/components/BrandingProvider";

export default function OgrenciYonetimPage() {
  const branding = useBranding();
  const kurumTamAd =
    branding.isletmeTamAdi || branding.salonAdi || "Spor Akademisi";
  const kayitUst =
    branding.kayitFormUstBaslik ||
    branding.salonAdi?.split(" ")[0]?.toUpperCase() ||
    "KURUM";
  const kayitAlt = branding.kayitFormAltBaslik || "AKADEMİSİ";
  const kayitSlogan =
    branding.kayitFormSlogan ||
    "★ ELİT EĞİTİM • GÜÇLÜ GELECEK • SINIRSIZ POTANSİYEL ★";
  const DEFAULT_WHATSAPP_LINK = "https://chat.whatsapp.com/GrupDavetKodunuz";

  const [ogrenciler, setOgrenciler] = useState([]);
  const [gruplar, setGruplar] = useState([]);
  const [loading, setLoading] = useState(true);

  // Arama & Filtre State'leri
  const [aramaMetni, setAramaMetni] = useState("");
  const [filtreGrup, setFiltreGrup] = useState("Tüm Gruplar");

  // Panel & Modallar
  const [seciliOgrenci, setSeciliOgrenci] = useState(null);
  const [ogrenciGirisGecmisi, setOgrenciGirisGecmisi] = useState([]);

  // Güncelleme Modalı State'i
  const [duzenleModalAcik, setDuzenleModalAcik] = useState(false);
  const [duzenleForm, setDuzenleForm] = useState({});
  const [duzenleGeciciVeli, setDuzenleGeciciVeli] = useState({
    adSoyad: "",
    yakinlikDerecesi: "Anne",
    telefon: "",
  });

  const [fotoUrl, setFotoUrl] = useState(null);
  const [takvimTarih, setTakvimTarih] = useState(new Date());

  // Çoklu Veli State'i (Yeni Kayıt İçin)
  const [eklenenVeliler, setEklenenVeliler] = useState([]);
  const [geciciVeli, setGeciciVeli] = useState({
    adSoyad: "",
    yakinlikDerecesi: "Anne",
    telefon: "",
  });

  // 🧹 NFC KART ID TEMİZLEME YARDIMCISI (Frontend Süzgeci)
  const nfcIdTemizle = (val) => {
    if (!val) return "";
    const strVal = String(val).trim();
    const temiz = strVal.replace(/[^a-zA-Z0-9]/g, ""); // Özel karakterleri kaldır
    return temiz.replace(/^0+/, "") || temiz; // Baştaki '0'ları kaldır
  };

  // 📝 KAPSAMLI YENİ KAYIT FORMU STATE'İ
  const [form, setForm] = useState({
    adSoyad: "",
    dogumTarihi: "",
    yas: "",
    tcKimlikNo: "",
    kanGrubu: "Bilinmiyor",
    lisansliMi: false,
    grup: "",
    aylikUcret: 2000,
    odemeGunu: 1,
    nfcKartId: "",
    okulAnaokulu: "",
    sinifi: "",
    veliEposta: "",
    veliAdres: "",
    saglikProblemiVarMi: "Hayır",
    saglikAciklama: "",
    duzenliIlacVarMi: "Hayır",
    ilacAciklama: "",
    alerjiVarMi: "Hayır",
    alerjiAciklama: "",
    haftalikGunSayisi: "2 GÜN",
    tercihGunler: "Fark Etmez",
    hedefler: [],
    cimnastikHedefi: "Hobi Olarak",
    duydugunuzYer: "Tavsiye",
    fotografIznı: "İzin Veriyorum",
    ekBilgiler: "",
  });

  const HEDEF_SECENEKLERI = [
    "Genel Gelişim & Sosyalleşme",
    "Esneklik & Denge Kazanımı",
    "Kas & Postür Gelişimi",
    "Yarışmacı Düzeye Hazırlık",
    "Özgüven & Disiplin",
  ];

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

  const gruplariGetir = async () => {
    try {
      const res = await fetch("/api/gruplar");
      const data = await res.json();
      if (data.success && data.data.length > 0) {
        setGruplar(data.data);
        if (!form.grup) {
          setForm((prev) => ({
            ...prev,
            grup: data.data[0].ad || data.data[0],
          }));
        }
      } else {
        const varsayilan = [
          {
            ad: "Salı–Perşembe 17:00–18:00",
            dersGunleri: ["Salı", "Perşembe"],
            whatsappLink: "https://chat.whatsapp.com/SaliPersembe1718Davet",
          },
          {
            ad: "Salı–Perşembe 18:00–19:00",
            dersGunleri: ["Salı", "Perşembe"],
            whatsappLink: "https://chat.whatsapp.com/SaliPersembe1819Davet",
          },
          {
            ad: "Cumartesi–Pazar 11:00–12:00",
            dersGunleri: ["Cumartesi", "Pazar"],
            whatsappLink: "https://chat.whatsapp.com/CmtPazar1112Davet",
          },
          {
            ad: "Cumartesi–Pazar 12:00–13:00",
            dersGunleri: ["Cumartesi", "Pazar"],
            whatsappLink: "https://chat.whatsapp.com/CmtPazar1213Davet",
          },
          {
            ad: "Salı–Perşembe–Cumartesi–Pazar 13:30–16:00",
            dersGunleri: ["Salı", "Perşembe", "Cumartesi", "Pazar"],
            whatsappLink: "https://chat.whatsapp.com/PerformansGrupDavet",
          },
          {
            ad: "Pazar 10:00–11:00",
            dersGunleri: ["Pazar"],
            whatsappLink: "https://chat.whatsapp.com/Pazar1011Davet",
          },
        ];
        setGruplar(varsayilan);
        if (!form.grup)
          setForm((prev) => ({ ...prev, grup: varsayilan[0].ad }));
      }
    } catch (err) {
      console.error("Gruplar çekilemedi:", err);
    }
  };

  const ogrenciYoklamaGecmisiniGetir = async (ogrenciId) => {
    try {
      const res = await fetch(`/api/yoklama?ogrenciId=${ogrenciId}`);
      if (!res.ok) return setOgrenciGirisGecmisi([]);
      const text = await res.text();
      if (!text) return setOgrenciGirisGecmisi([]);
      const data = JSON.parse(text);
      if (data.success) setOgrenciGirisGecmisi(data.data || []);
      else setOgrenciGirisGecmisi([]);
    } catch (err) {
      setOgrenciGirisGecmisi([]);
    }
  };

  useEffect(() => {
    ogrencileriGetir();
    gruplariGetir();
  }, []);

  const ogrenciSecVePaneliAc = (ogrenci) => {
    setSeciliOgrenci(ogrenci);
    setDuzenleForm(JSON.parse(JSON.stringify(ogrenci)));
    setFotoUrl(ogrenci.fotoUrl || null);
    ogrenciYoklamaGecmisiniGetir(ogrenci._id);
  };

  const hedefToggle = (hedefItem, isModal = false) => {
    const hedefForm = isModal ? duzenleForm : form;
    const mevcut = hedefForm.hedefler || [];
    const yeniHedefler = mevcut.includes(hedefItem)
      ? mevcut.filter((h) => h !== hedefItem)
      : [...mevcut, hedefItem];

    if (isModal) {
      setDuzenleForm({ ...duzenleForm, hedefler: yeniHedefler });
    } else {
      setForm({ ...form, hedefler: yeniHedefler });
    }
  };

  const modalOgrenciSil = async () => {
    if (!duzenleForm._id) return;
    if (
      !confirm(
        `${duzenleForm.adSoyad} isimli öğrenciyi kalıcı olarak SİLMEK istediğinize emin misiniz?`,
      )
    )
      return;

    try {
      const res = await fetch(`/api/ogrenciler/${duzenleForm._id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        alert("🗑️ Öğrenci Başarıyla Silindi!");
        setDuzenleModalAcik(false);
        setSeciliOgrenci(null);
        ogrencileriGetir();
      } else {
        alert("Hata: " + (data.error || "Silinemedi"));
      }
    } catch (err) {
      alert("Silme işlemi sırasında sunucu hatası oluştu.");
    }
  };

  const modalOgrenciDondur = async () => {
    if (!duzenleForm._id) return;
    if (
      !confirm(
        `${duzenleForm.adSoyad} isimli öğrencinin kaydını dondurmak istediğinize emin misiniz?`,
      )
    )
      return;

    try {
      const res = await fetch(`/api/ogrenciler/${duzenleForm._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ durum: "pasif" }),
      });
      const data = await res.json();
      if (data.success) {
        alert("⏸️ Öğrenci Kaydı Donduruldu!");
        setDuzenleModalAcik(false);
        setSeciliOgrenci(null);
        ogrencileriGetir();
      } else {
        alert("Hata: " + (data.error || "İşlem başarısız"));
      }
    } catch (err) {
      alert("Dondurma işlemi sırasında hata oluştu.");
    }
  };

  // ✏️ TÜM ALANLARI DESTEKLEYEN ÖĞRENCİ GÜNCELLEME İŞLEVİ
  const ogrenciGuncelle = async (e) => {
    e.preventDefault();
    const eski = seciliOgrenci || {};
    const yeni = duzenleForm;

    const degisiklikler = [];
    if (eski.adSoyad !== yeni.adSoyad)
      degisiklikler.push(`Ad Soyad: '${eski.adSoyad}' ➔ '${yeni.adSoyad}'`);
    if (eski.grup !== yeni.grup)
      degisiklikler.push(`Cimnastik Grubu: '${eski.grup}' ➔ '${yeni.grup}'`);
    if (Number(eski.aylikUcret) !== Number(yeni.aylikUcret))
      degisiklikler.push(
        `Aylık Ücret: '${eski.aylikUcret} ₺' ➔ '${yeni.aylikUcret} ₺'`,
      );

    const detayMetni =
      degisiklikler.length > 0
        ? degisiklikler.join(" | ")
        : "Öğrenci genel bilgileri güncellendi.";

    const yeniIslemLogu = {
      islemTipi: degisiklikler.length > 0 ? "GÜNCELLEME" : "KONTROL",
      detay: detayMetni,
      tarih: new Date().toISOString(),
    };

    // Güncelleme yaparken de NFC Id'nin temizlenmiş halini ve aylık ücretin sayısal halini kaydediyoruz
    const guncelPayload = {
      ...duzenleForm,
      aylikUcret: Number(duzenleForm.aylikUcret) || 0,
      nfcKartId: duzenleForm.nfcKartId
        ? nfcIdTemizle(duzenleForm.nfcKartId)
        : undefined,
      fotoUrl: fotoUrl,
      islemGecmisi: [...(duzenleForm.islemGecmisi || []), yeniIslemLogu],
    };

    try {
      const res = await fetch(`/api/ogrenciler/${duzenleForm._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(guncelPayload),
      });
      const data = await res.json();
      if (data.success) {
        alert("✅ Öğrenci Bilgileri Başarıyla Güncellendi!");
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

  const resimYukle = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setFotoUrl(reader.result);
    reader.readAsDataURL(file);
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

  const yeniOgrenciKaydet = async (e) => {
    e.preventDefault();
    if (eklenenVeliler.length === 0)
      return alert("⚠️ Lütfen en az 1 veli ekleyin!");

    const payload = {
      ...form,
      aylikUcret: Number(form.aylikUcret) || 0,
      fotoUrl: fotoUrl,
      veliListesi: eklenenVeliler,
      nfcKartId: form.nfcKartId ? nfcIdTemizle(form.nfcKartId) : undefined,
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
        dogumTarihi: "",
        yas: "",
        tcKimlikNo: "",
        kanGrubu: "Bilinmiyor",
        lisansliMi: false,
        grup:
          (typeof gruplar[0] === "object" ? gruplar[0]?.ad : gruplar[0]) || "",
        aylikUcret: 2000,
        odemeGunu: 1,
        nfcKartId: "",
        okulAnaokulu: "",
        sinifi: "",
        veliEposta: "",
        veliAdres: "",
        saglikProblemiVarMi: "Hayır",
        saglikAciklama: "",
        duzenliIlacVarMi: "Hayır",
        ilacAciklama: "",
        alerjiVarMi: "Hayır",
        alerjiAciklama: "",
        haftalikGunSayisi: "2 GÜN",
        tercihGunler: "Fark Etmez",
        hedefler: [],
        cimnastikHedefi: "Hobi Olarak",
        duydugunuzYer: "Tavsiye",
        fotografIznı: "İzin Veriyorum",
        ekBilgiler: "",
      });
      setFotoUrl(null);
      setEklenenVeliler([]);
      ogrencileriGetir();
    } else {
      alert("❌ Hata: " + data.error);
    }
  };

  // 📄 WORD KAYIT FORMU İNDİRME (.DOC)
  const ciktiAlWord = (ogrenciData) => {
    const veliIlk = ogrenciData.veliListesi?.[0] || {};

    const fotoHtml = fotoUrl
      ? `<img src="${fotoUrl}" style="width: 110px; height: 110px; border-radius: 6px; object-fit: cover; border: 1.5px solid #0F172A;" />`
      : `<div style="width: 110px; height: 110px; border: 1.5px dashed #475569; border-radius: 6px; text-align: center; font-size: 8pt; color: #475569; line-height: 110px;">FOTOĞRAF ALANI</div>`;

    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${kurumTamAd} Sporcu Kayıt Formu - ${ogrenciData.adSoyad || ""}</title>
        <style>
          @page { size: A4 portrait; margin: 0.2cm 0.2cm 0.2cm 1.5cm; }
          body { font-family: 'Times New Roman', Times, serif; color: #0F172A; font-size: 10pt; line-height: 1.2; margin: 0; padding: 0; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 4px; }
          td { padding: 4px 6px; border: 1px solid #CBD5E1; vertical-align: top; }
          .header-title { text-align: center; font-size: 15pt; font-weight: bold; letter-spacing: 1.5px; }
          .header-sub { text-align: center; font-size: 10pt; font-weight: bold; color: #0F172A; }
          .slogan { text-align: center; font-size: 8pt; font-weight: bold; color: #B45309; letter-spacing: 0.5px; margin-bottom: 6px; }
          .sec-header { background-color: #0F172A; color: #FFFFFF; font-weight: bold; padding: 3px 6px; font-size: 9.5pt; border-radius: 2px; margin-top: 6px; margin-bottom: 3px; }
          .bg-label { background-color: #F8FAFC; font-weight: bold; color: #334155; width: 22%; }
          .val { font-weight: bold; color: #0F172A; width: 28%; }
          .page-break { page-break-before: always; }
          .rule-box { margin-bottom: 6px; }
          .rule-title { font-weight: bold; font-size: 8.5pt; color: #0F172A; border-bottom: 1px solid #0F172A; padding-bottom: 1px; margin-bottom: 2px; }
          .rule-desc { font-size: 8pt; color: #334155; margin-left: 6px; line-height: 1.15; }
        </style>
      </head>
      <body>
        <!-- SAYFA 1: SPORCU KAYIT FORMU -->
        <table>
          <tr>
            <td style="border:none; width:20%;"></td>
            <td style="border:none; text-align:center; width:60%;">
              <div class="header-title">${kayitUst}</div>
              <div class="header-sub">${kayitAlt}</div>
              <div style="font-size:12pt; font-weight:bold; margin-top:2px;">SPORCU KAYIT FORMU</div>
              <div class="slogan">${kayitSlogan}</div>
            </td>
            <td style="border:none; text-align:right; width:20%;">${fotoHtml}</td>
          </tr>
        </table>

        <table>
          <tr>
            <td style="width:50%; border:none; padding:0 3px 0 0;">
              <div class="sec-header">👤 1. SPORCU BİLGİLERİ</div>
              <table>
                <tr><td class="bg-label">Ad Soyad:</td><td class="val" colspan="3">${ogrenciData.adSoyad || ""}</td></tr>
                <tr><td class="bg-label">Doğum Tarihi:</td><td class="val">${ogrenciData.dogumTarihi || ""}</td><td class="bg-label">Yaş:</td><td class="val">${ogrenciData.yas || ""}</td></tr>
                <tr><td class="bg-label">T.C. Kimlik No:</td><td class="val" colspan="3">${ogrenciData.tcKimlikNo || ""}</td></tr>
                <tr><td class="bg-label">Kan Grubu:</td><td class="val">${ogrenciData.kanGrubu || "Bilinmiyor"}</td><td class="bg-label">Lisans:</td><td class="val">${ogrenciData.lisansliMi ? "✓ Var" : "Yok"}</td></tr>
              </table>
            </td>
            <td style="width:50%; border:none; padding:0 0 0 3px;">
              <div class="sec-header">🎓 2. EĞİTİM BİLGİLERİ</div>
              <table>
                <tr><td class="bg-label">Okul / Anaokulu:</td><td class="val" colspan="3">${ogrenciData.okulAnaokulu || ""}</td></tr>
                <tr><td class="bg-label">Sınıfı:</td><td class="val" colspan="3">${ogrenciData.sinifi || ""}</td></tr>
                <tr><td class="bg-label">Cimnastik Grubu:</td><td class="val" colspan="3">${ogrenciData.grup || ""}</td></tr>
                <tr><td class="bg-label">Aylık Aidat:</td><td class="val" colspan="3">${ogrenciData.aylikUcret || 2000} ₺ (Her ayın ${ogrenciData.odemeGunu || 1}. günü)</td></tr>
              </table>
            </td>
          </tr>
        </table>

        <table>
          <tr>
            <td style="width:50%; border:none; padding:0 3px 0 0;">
              <div class="sec-header">👨‍👩‍👧 3. VELİ BİLGİLERİ</div>
              <table>
                <tr><td class="bg-label">Veli Ad Soyad:</td><td class="val">${veliIlk.adSoyad || ""} (${veliIlk.yakinlikDerecesi || "Veli"})</td></tr>
                <tr><td class="bg-label">Telefon:</td><td class="val">${veliIlk.telefon || ""}</td></tr>
                <tr><td class="bg-label">E-posta:</td><td class="val">${ogrenciData.veliEposta || ""}</td></tr>
                <tr><td class="bg-label">Adres:</td><td class="val">${ogrenciData.veliAdres || ""}</td></tr>
              </table>
            </td>
            <td style="width:50%; border:none; padding:0 0 0 3px;">
              <div class="sec-header">🩺 4. SAĞLIK BİLGİLERİ</div>
              <table>
                <tr><td class="bg-label">Sağlık Problemi:</td><td class="val">${ogrenciData.saglikProblemiVarMi || "Hayır"} ${ogrenciData.saglikAciklama ? "(" + ogrenciData.saglikAciklama + ")" : ""}</td></tr>
                <tr><td class="bg-label">Düzenli İlaç:</td><td class="val">${ogrenciData.duzenliIlacVarMi || "Hayır"} ${ogrenciData.ilacAciklama ? "(" + ogrenciData.ilacAciklama + ")" : ""}</td></tr>
                <tr><td class="bg-label">Alerji Durumu:</td><td class="val">${ogrenciData.alerjiVarMi || "Hayır"} ${ogrenciData.alerjiAciklama ? "(" + ogrenciData.alerjiAciklama + ")" : ""}</td></tr>
              </table>
            </td>
          </tr>
        </table>

        <table>
          <tr>
            <td style="width:33%; border:none; padding-right:2px;">
              <div class="sec-header">📅 5. ANTRENMAN TERCİHLERİ</div>
              <div style="font-size:8pt; padding:2px;">
                <b>Haftalık Gün:</b> ${ogrenciData.haftalikGunSayisi || "2 GÜN"}<br/>
                <b>Tercih Günleri:</b> ${ogrenciData.tercihGunler || "Fark Etmez"}
              </div>
            </td>
            <td style="width:34%; border:none; padding:0 2px;">
              <div class="sec-header">🎯 6. HEDEFLER</div>
              <div style="font-size:8pt; padding:2px;">
                ${(ogrenciData.hedefler || ["Genel Gelişim"]).map((h) => "✓ " + h).join("<br/>")}
              </div>
            </td>
            <td style="width:33%; border:none; padding-left:2px;">
              <div class="sec-header">🏆 7. CİMNASTİK HEDEFİ</div>
              <div style="font-size:8pt; padding:2px;">
                <b>Hedef:</b> ${ogrenciData.cimnastikHedefi || "Hobi Olarak"}
              </div>
            </td>
          </tr>
        </table>

        <table>
          <tr>
            <td style="width:33%; border:none; padding-right:2px;">
              <div class="sec-header">📢 8. BİZİ NEREDEN DUYDUNUZ?</div>
              <div style="font-size:8pt; padding:2px;">
                <b>Kaynak:</b> ${ogrenciData.duydugunuzYer || "Tavsiye"}
              </div>
            </td>
            <td style="width:34%; border:none; padding:0 2px;">
              <div class="sec-header">📷 9. FOTOĞRAF / VİDEO İZNİ</div>
              <div style="font-size:8pt; padding:2px;">
                <b>Durum:</b> ${ogrenciData.fotografIznı || "İzin Veriyorum"}
              </div>
            </td>
            <td style="width:33%; border:none; padding-left:2px;">
              <div class="sec-header">📝 10. EK BİLGİLER</div>
              <div style="font-size:8pt; padding:2px;">
                ${ogrenciData.ekBilgiler || "Yok"}
              </div>
            </td>
          </tr>
        </table>

        <div class="sec-header">✔ 11. VELİ ONAYI</div>
        <div style="font-size:8pt; margin-bottom:8px; padding:2px;">
          Yukarıda verdiğim bilgilerin doğru olduğunu beyan eder, ${kurumTamAd} kurallarını kabul ettiğimi onaylarım.
        </div>

        <table style="border:none; margin-top:10px;">
          <tr>
            <td style="border:none; text-align:center; width:50%;">
              <b>Akademi Yetkilisi İmza</b><br/><br/>______________________
            </td>
            <td style="border:none; text-align:center; width:50%;">
              <b>Veli Ad Soyad / İmza</b><br/>
              <b>${veliIlk.adSoyad || "........................................"}</b><br/>
              Tarih: ____ / ____ / ________
            </td>
          </tr>
        </table>

        <!-- SAYFA 2: KURAL VE ŞARTLAR -->
        <div class="page-break"></div>

        <table style="border:none;">
          <tr>
            <td style="border:none; width:20%;"></td>
            <td style="border:none; text-align:center; width:60%;">
              <div class="header-title">${kayitUst}</div>
              <div class="header-sub">${kayitAlt}</div>
              <div style="font-size:13pt; font-weight:bold; margin-top:4px; letter-spacing:1px;">KURAL VE ŞARTLAR</div>
              <div style="color:#B45309; font-size:9pt;">★ ★ ★</div>
            </td>
            <td style="border:none; width:20%;"></td>
          </tr>
        </table>

        <div style="font-size:8.5pt; font-style:italic; margin-bottom:10px;">
          <b>Sevgili Veliler,</b><br/>
          ${kurumTamAd}'de amacımız çocuklarımıza güvenli, disiplinli ve verimli bir spor ortamı sunmaktır. Eğitim kalitesinin korunabilmesi ve sporcularımızın sağlıklı gelişim gösterebilmesi için aşağıdaki kuralların dikkatle okunmasını rica ederiz.
        </div>

        <table style="border:none;">
          <tr>
            <td style="width:50%; border:none; padding-right:5px;">
              <div class="rule-box">
                <div class="rule-title">📅 1. DEVAM ZORUNLULUĞU</div>
                <div class="rule-desc">
                  • Düzenli devam, öğrencinin gelişimi açısından büyük önem taşımaktadır.<br/>
                  • Devamsızlık durumunda ay içerisinde en fazla 1 (bir) telafi dersi hakkı bulunmaktadır.<br/>
                  • Kullanılmayan telafi hakları bir sonraki aya devredilemez.<br/>
                  • Telafi dersleri yalnızca uygun kontenjan bulunan gruplarda planlanabilir.<br/>
                  • Uzun süreli devamsızlıklar sporcunun gelişimini ve grup içindeki seviyesini olumsuz etkileyebilir.
                </div>
              </div>

              <div class="rule-box">
                <div class="rule-title">🏛 3. RESMİ TATİLLER</div>
                <div class="rule-desc">
                  • Resmi tatillerde ve devlet tarafından ilan edilen tatil günlerinde ders yapılmamaktadır.<br/>
                  • Bu günler için ayrıca telafi dersi uygulanmaz.
                </div>
              </div>

              <div class="rule-box">
                <div class="rule-title">💳 5. KAYIT İPTALİ VE ÜCRET İADESİ</div>
                <div class="rule-desc">
                  • Kayıt sonrası öğrenci toplamda 2 dersten daha az katılım sağlamışsa kayıt iptali ve ücret iadesi talep edilebilir.<br/>
                  • 2 ders ve üzeri katılım sağlanması durumunda ücret iadesi yapılmaz.<br/>
                  • Kayıt ücreti, sporcu adına ayrılan kontenjan ve planlama kapsamında tahsil edilmektedir.
                </div>
              </div>

              <div class="rule-box">
                <div class="rule-title">👨‍👩‍👧 7. VELİLER İÇİN BİLGİLENDİRME</div>
                <div class="rule-desc">
                  • Temel eğitim gruplarında veliler izleme alanından dersleri takip edebilirler.<br/>
                  • Performans, altyapı ve yarışma gruplarında sporcuların dikkatlerini koruyabilmeleri, bağımsızlık geliştirebilmeleri ve antrenman kalitesinin sürdürülebilmesi amacıyla veli izleme uygulaması bulunmamaktadır.<br/>
                  • Bu grupların antrenmanları yalnızca antrenörler ve sporcuların katılımıyla gerçekleştirilmektedir.<br/>
                  • Veliler sporcuların gelişimi hakkında antrenörlerden düzenli olarak bilgi alabilirler.
                </div>
              </div>

              <div class="rule-box">
                <div class="rule-title">🌟 9. AKADEMİ PRENSİBİ</div>
                <div class="rule-desc">
                  ${kurumTamAd}'de hedefimiz yalnızca başarılı sporcular yetiştirmek değildir. Çocuklarımızın disiplinli, mücadeleci, özgüvenli, sorumluluk sahibi ve güçlü karakterli bireyler olarak yetişmelerine katkı sağlamayı amaçlıyoruz. Sporcu gelişiminde süreklilik, sabır ve emek en önemli unsurlardır. Bu nedenle akademimizde süreç, sonuç kadar değerlidir.
                </div>
              </div>
            </td>

            <td style="width:50%; border:none; padding-left:5px;">
              <div class="rule-box">
                <div class="rule-title">🤸‍♀️ 2. PERFORMANS GRUBU</div>
                <div class="rule-desc">
                  • Performans grubunda yer alan sporcular için her ay en az 1 (bir) özel ders alınması zorunludur.<br/>
                  • Özel dersler sporcuların bireysel eksiklerini tamamlamak, teknik gelişimlerini hızlandırmak ve yarışma hazırlıklarını desteklemek amacıyla uygulanmaktadır.
                </div>
              </div>

              <div class="rule-box">
                <div class="rule-title">⏸ 4. KAYIT DONDURMA</div>
                <div class="rule-desc">
                  • Kayıt dondurma süresi en fazla 3 (üç) haftadır.<br/>
                  • Kayıt dondurma talepleri önceden yazılı olarak bildirilmelidir.<br/>
                  • Geriye dönük kayıt dondurma işlemi yapılamaz.
                </div>
              </div>

              <div class="rule-box">
                <div class="rule-title">👕 6. DERS KURALLARI</div>
                <div class="rule-desc">
                  • Derslere zamanında gelinmesi önemlidir.<br/>
                  • Sporcular derslere uygun spor kıyafeti ile katılmalıdır.<br/>
                  • Uzun saçlar toplu olmalıdır.<br/>
                  • Takı, saat, bileklik ve benzeri aksesuarlarla derse girilmemelidir.<br/>
                  • Ders sırasında cep telefonu kullanımı yasaktır.<br/>
                  • Cam şişe ile salona giriş yapılmamaktadır.<br/>
                  • Akademi kurallarına ve antrenör talimatlarına uyulması zorunludur.
                </div>
              </div>

              <div class="rule-box">
                <div class="rule-title">⛺ 8. KAMP VE GELİŞİM PROGRAMLARI</div>
                <div class="rule-desc">
                  • Altyapı, performans ve yarışma gruplarında yer alan sporcular için kamp programları ve akademi tarafından planlanan ek çalışmalar gelişim sürecinin önemli bir parçasıdır.<br/>
                  • Kamp katılımları sporcuların teknik gelişimi, fiziksel hazırlığı ve takım uyumu açısından değerlendirilmektedir.<br/>
                  • Kamp ve gelişim programlarına düzenli katılım, sporcunun yarışma kadrosunda yer alıp almayacağını etkileyen kriterlerden biridir.<br/>
                  • Yarışmalara katılım kararı yalnızca yaş veya kıdeme göre değil; devam durumu, antrenman performansı, kamp katılımı, disiplin ve teknik yeterlilik göz önünde bulundurularak antrenörler tarafından verilir.<br/>
                  • ${kurumTamAd}, sporcunun gelişimini ve hazır bulunuşluk seviyesini esas alarak yarışma katılımı konusunda karar verme hakkını saklı tutar.
                </div>
              </div>
            </td>
          </tr>
        </table>

        <table style="border:none; margin-top:15px;">
          <tr>
            <td style="border:none; text-align:center; width:100%;">
              <div style="font-size:9pt; font-weight:bold; margin-bottom:10px;">
                Yukarıda belirtilen kuralları okuduğumu ve kabul ettiğimi beyan ederim.
              </div>
              <div style="font-size:9pt;">
                <b>Veli Ad Soyad:</b> ${veliIlk.adSoyad || "..........................................."} <br/><br/>
                <b>İmza:</b> ___________________________ <br/><br/>
                <b>Tarih:</b> ____ / ____ / ________
              </div>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob(["\ufeff", htmlContent], {
      type: "application/msword",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${kurumTamAd.replace(/\s+/g, "_")}_Kayit_Formu_${(ogrenciData.adSoyad || "Ogrenci").replace(/\s+/g, "_")}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const whatsappDavetGonder = (telefon, ogrenciAdi, ogrenciGrubu) => {
    const temizTelefon = telefon.replace(/\D/g, "");
    const tel = temizTelefon.startsWith("90")
      ? temizTelefon
      : `90${temizTelefon}`;

    const ogrenciGrupNesnesi = gruplar.find(
      (g) => (typeof g === "object" ? g.ad : g) === ogrenciGrubu,
    );

    const dinamikWhatsappLink =
      ogrenciGrupNesnesi?.whatsappLink || DEFAULT_WHATSAPP_LINK;

    const mesaj = `Merhaba, ${kurumTamAd}'ye hoş geldiniz! ${ogrenciAdi} isimli öğrencimizin duyurularını takip edebileceğiniz ${ogrenciGrubu} WhatsApp grubumuzun katılım linki: ${dinamikWhatsappLink}`;

    window.open(
      `https://api.whatsapp.com/send?phone=${tel}&text=${encodeURIComponent(mesaj)}`,
      "_blank",
    );
  };

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

    const seciliGrupNesnesi = gruplar.find(
      (g) => (typeof g === "object" ? g.ad : g) === seciliOgrenci?.grup,
    );

    const grupDersGunleri = seciliGrupNesnesi?.dersGunleri || [];

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
      const d = new Date(y.tarih);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    });

    for (let g = 1; g <= toplamGun; g++) {
      const tarihObj = new Date(yil, ay, g);
      const haftaninGunuIndeksi = tarihObj.getDay();
      const gunAdi = gunIsimleri[haftaninGunuIndeksi];

      let dersGunuMu = false;
      if (grupDersGunleri.length > 0) {
        dersGunuMu = grupDersGunleri.includes(gunAdi);
      } else {
        const grupMetni = (seciliOgrenci?.grup || "").toLowerCase();
        dersGunuMu = new RegExp(`\\b${gunAdi.toLowerCase()}\\b`, "i").test(
          grupMetni,
        );
      }

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

  // ÖĞRENCİ BİREYSEL DETAY EKRANI
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
    const seciliGrupNesnesi = gruplar.find(
      (g) => (typeof g === "object" ? g.ad : g) === seciliOgrenci?.grup,
    );

    return (
      <div className="space-y-6 animate-fadeIn text-slate-900 pb-12 font-sans">
        <div className="bg-[#0F172A] text-white p-6 rounded-3xl shadow-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border border-slate-800">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSeciliOgrenci(null)}
              className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-black px-4 py-2.5 rounded-2xl text-xs flex items-center gap-2 shadow-lg transition-all cursor-pointer"
            >
              <span>←</span>
              <span>Öğrenci Listesine Dön</span>
            </button>

            <div>
              <h1 className="text-2xl font-black text-white tracking-wide">
                {seciliOgrenci.adSoyad}
              </h1>
              <p className="text-xs font-bold text-amber-400 tracking-wide mt-0.5">
                {seciliOgrenci.adSoyad} Bireysel Sayfasıdır.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setDuzenleForm(JSON.parse(JSON.stringify(seciliOgrenci)));
                setFotoUrl(seciliOgrenci.fotoUrl || null);
                setDuzenleModalAcik(true);
              }}
              className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-black px-4 py-3 rounded-2xl text-xs flex items-center gap-2 shadow-xl cursor-pointer"
            >
              <span>✏️</span>
              <span>Bilgileri Güncelle / Yönet</span>
            </button>

            <button
              onClick={() => ciktiAlWord(seciliOgrenci)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-black px-5 py-3 rounded-2xl text-xs flex items-center gap-2 shadow-xl border border-blue-400/30 cursor-pointer"
            >
              <span>📝</span>
              <span>Word Kayıt Formu İndir (.doc)</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-3xl border-2 border-slate-200 shadow-md">
            <span className="text-[10px] font-black uppercase text-slate-400">
              Lisans Durumu
            </span>
            <p
              className={`text-sm font-black mt-1 ${
                seciliOgrenci.lisansliMi ? "text-emerald-600" : "text-slate-600"
              }`}
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
            <p className="text-sm font-black text-slate-900 mt-1">
              {seciliOgrenci.kanGrubu || "Bilinmiyor"}
            </p>
          </div>

          <div className="bg-white p-5 rounded-3xl border-2 border-slate-200 shadow-md">
            <span className="text-[10px] font-black uppercase text-slate-400">
              NFC Kart ID
            </span>
            <p className="text-sm font-mono font-black text-amber-600 mt-1">
              {seciliOgrenci.nfcKartId || "Tanımlı Değil"}
            </p>
            {!seciliOgrenci.nfcKartId && (
              <p className="mt-2 text-[10px] font-bold text-slate-500">
                Düzenle → USB okuyucu ile kart okutarak tanımlayın
              </p>
            )}
          </div>

          <div className="bg-white p-5 rounded-3xl border-2 border-slate-200 shadow-md">
            <span className="text-[10px] font-black uppercase text-slate-400">
              Aylık Aidat
            </span>
            <p className="text-sm font-black text-emerald-700 mt-1">
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
                  Ders günleri turuncu renktedir. Katılım sağlandığında yeşil
                  tik (✓) görünür.
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
                  className="px-2.5 py-1 rounded-xl bg-white font-black text-xs shadow-sm hover:bg-slate-200 cursor-pointer"
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
                  className="px-2.5 py-1 rounded-xl bg-white font-black text-xs shadow-sm hover:bg-slate-200 cursor-pointer"
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
                      "bg-amber-100 border-amber-400 text-amber-950 font-black shadow-sm";
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
                        <span className="text-[9px] font-extrabold text-amber-700 bg-amber-200/60 px-1 rounded">
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
              <span className="font-black text-amber-700 bg-amber-100 border border-amber-300 px-3 py-1 rounded-xl text-[11px]">
                {seciliGrupNesnesi?.dersGunleri?.join(", ") ||
                  seciliOgrenci.grup}
              </span>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white p-6 rounded-3xl border-2 border-slate-200 shadow-xl space-y-2">
              <span className="text-xs font-black uppercase text-slate-400 flex items-center gap-1.5">
                <span>🏆</span> Cimnastik Grubu
              </span>
              <div className="p-3 bg-slate-900 text-white rounded-2xl">
                <p className="text-sm font-black text-amber-400">
                  📌 {seciliOgrenci.grup || "Grup Tanımlı Değil"}
                </p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border-2 border-slate-200 shadow-xl space-y-3">
              <h3 className="text-base font-black text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
                <span>👨‍组织‍👧</span> Veli İletişim Bilgileri
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
                        whatsappDavetGonder(
                          v.telefon,
                          seciliOgrenci.adSoyad,
                          seciliOgrenci.grup,
                        )
                      }
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-3 py-1.5 rounded-xl text-xs shadow-md cursor-pointer flex items-center gap-1"
                    >
                      <span>📲</span>
                      <span>Grup Daveti Gönder</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border-2 border-slate-200 shadow-xl mt-6 w-full">
          <h3 className="text-lg font-black text-slate-900 border-b border-slate-200 pb-3 flex items-center gap-2">
            <span>📜</span> Kronolojik İşlem & Değişiklik Geçmişi
          </h3>

          {!seciliOgrenci.islemGecmisi ||
          seciliOgrenci.islemGecmisi.length === 0 ? (
            <p className="text-sm font-bold text-slate-400 py-6 text-center">
              Sistemde kayıtlı bir güncelleme veya işlem geçmişi
              bulunmamaktadır.
            </p>
          ) : (
            <div className="space-y-3 mt-4 max-h-80 overflow-y-auto pr-2">
              {seciliOgrenci.islemGecmisi
                .slice()
                .reverse()
                .map((log, idx) => {
                  const d = new Date(log.tarih);
                  const tarihStr =
                    d.toLocaleDateString("tr-TR") +
                    " " +
                    d.toLocaleTimeString("tr-TR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    });

                  return (
                    <div
                      key={idx}
                      className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row justify-between sm:items-center gap-2 shadow-sm"
                    >
                      <div className="flex items-center gap-2">
                        <span className="bg-amber-100 text-amber-900 text-[10px] font-black px-2.5 py-1 rounded border border-amber-200 uppercase whitespace-nowrap">
                          {log.islemTipi || "GÜNCELLEME"}
                        </span>
                        <span className="font-bold text-xs text-slate-800 leading-relaxed">
                          {log.detay}
                        </span>
                      </div>
                      <span className="text-xs font-mono font-bold text-slate-400 whitespace-nowrap">
                        🕒 {tarihStr}
                      </span>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* ✏️ TÜM BİLGİLERİN GÜNCELLENEBİLECEĞİ DÜZENLEME MODALI */}
        {duzenleModalAcik && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl border-2 border-slate-900 max-w-3xl w-full p-6 shadow-2xl space-y-5 text-slate-900 relative max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => setDuzenleModalAcik(false)}
                className="absolute top-4 right-4 font-black text-xl text-slate-400 hover:text-slate-900 cursor-pointer"
              >
                ✕
              </button>
              <h3 className="text-lg font-black border-b border-slate-200 pb-2">
                ✏️ Öğrencinin Tüm Kayıt Bİlgilerini Güncelle
              </h3>

              <form onSubmit={ogrenciGuncelle} className="space-y-4">
                {/* FOTOĞRAF DEĞİŞTİRME */}
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-4">
                  {fotoUrl ? (
                    <img
                      src={fotoUrl}
                      alt="Profil Fotoğrafı"
                      className="w-14 h-14 rounded-2xl object-cover border-2 border-slate-900"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-slate-200 border-2 border-dashed border-slate-400 flex items-center justify-center text-[10px] text-slate-500 font-bold text-center">
                      Fotoğraf Yok
                    </div>
                  )}
                  <div>
                    <label className="cursor-pointer bg-slate-900 hover:bg-slate-800 text-white font-black px-3 py-1.5 rounded-xl text-xs inline-block shadow">
                      📷 Fotoğraf Değiştir
                      <input
                        type="file"
                        accept="image/*"
                        onChange={resimYukle}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* 1. SPORCU BİLGİLERİ */}
                <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <p className="text-xs font-black text-amber-700 uppercase border-b pb-1 border-amber-200">
                    👤 1. SPORCU BİLGİLERİ
                  </p>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-700 mb-1">
                      Ad Soyad *
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
                      className="w-full p-2.5 rounded-xl border border-slate-300 font-bold text-xs bg-white outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-700 mb-1">
                        Doğum Tarihi
                      </label>
                      <input
                        type="text"
                        value={duzenleForm.dogumTarihi || ""}
                        onChange={(e) =>
                          setDuzenleForm({
                            ...duzenleForm,
                            dogumTarihi: e.target.value,
                          })
                        }
                        className="w-full p-2 rounded-xl border border-slate-300 font-bold text-xs bg-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-700 mb-1">
                        Yaş
                      </label>
                      <input
                        type="text"
                        value={duzenleForm.yas || ""}
                        onChange={(e) =>
                          setDuzenleForm({
                            ...duzenleForm,
                            yas: e.target.value,
                          })
                        }
                        className="w-full p-2 rounded-xl border border-slate-300 font-bold text-xs bg-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-700 mb-1">
                        T.C. Kimlik No
                      </label>
                      <input
                        type="text"
                        value={duzenleForm.tcKimlikNo || ""}
                        onChange={(e) =>
                          setDuzenleForm({
                            ...duzenleForm,
                            tcKimlikNo: e.target.value,
                          })
                        }
                        className="w-full p-2 rounded-xl border border-slate-300 font-bold text-xs bg-white outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-700 mb-1">
                        Kan Grubu
                      </label>
                      <select
                        value={duzenleForm.kanGrubu || "Bilinmiyor"}
                        onChange={(e) =>
                          setDuzenleForm({
                            ...duzenleForm,
                            kanGrubu: e.target.value,
                          })
                        }
                        className="w-full p-2 rounded-xl border border-slate-300 font-bold text-xs bg-white outline-none cursor-pointer"
                      >
                        <option value="Bilinmiyor">Bilinmiyor</option>
                        <option value="0 Rh+">0 Rh+</option>
                        <option value="0 Rh-">0 Rh-</option>
                        <option value="A Rh+">A Rh+</option>
                        <option value="A Rh-">A Rh-</option>
                        <option value="B Rh+">B Rh+</option>
                        <option value="B Rh-">B Rh-</option>
                        <option value="AB Rh+">AB Rh+</option>
                        <option value="AB Rh-">AB Rh-</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-700 mb-1">
                        Lisans Durumu
                      </label>
                      <select
                        value={duzenleForm.lisansliMi ? "Evet" : "Hayır"}
                        onChange={(e) =>
                          setDuzenleForm({
                            ...duzenleForm,
                            lisansliMi: e.target.value === "Evet",
                          })
                        }
                        className="w-full p-2 rounded-xl border border-slate-300 font-bold text-xs bg-white outline-none cursor-pointer"
                      >
                        <option value="Hayır">Lisanssız Sporcu</option>
                        <option value="Evet">✓ Lisanslı Sporcu</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* 2. EĞİTİM & AİDAT BİLGİLERİ */}
                <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <p className="text-xs font-black text-blue-700 uppercase border-b pb-1 border-blue-200">
                    🎓 2. EĞİTİM & AİDAT BİLGİLERİ
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-700 mb-1">
                        Okul / Anaokulu
                      </label>
                      <input
                        type="text"
                        value={duzenleForm.okulAnaokulu || ""}
                        onChange={(e) =>
                          setDuzenleForm({
                            ...duzenleForm,
                            okulAnaokulu: e.target.value,
                          })
                        }
                        className="w-full p-2 rounded-xl border border-slate-300 font-bold text-xs bg-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-700 mb-1">
                        Sınıfı
                      </label>
                      <input
                        type="text"
                        value={duzenleForm.sinifi || ""}
                        onChange={(e) =>
                          setDuzenleForm({
                            ...duzenleForm,
                            sinifi: e.target.value,
                          })
                        }
                        className="w-full p-2 rounded-xl border border-slate-300 font-bold text-xs bg-white outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-700 mb-1">
                      Cimnastik Grubu
                    </label>
                    <select
                      value={
                        duzenleForm.grup ||
                        (typeof gruplar[0] === "object"
                          ? gruplar[0]?.ad
                          : gruplar[0]) ||
                        ""
                      }
                      onChange={(e) =>
                        setDuzenleForm({ ...duzenleForm, grup: e.target.value })
                      }
                      className="w-full p-2.5 rounded-xl border border-slate-300 font-bold text-xs bg-white outline-none cursor-pointer"
                    >
                      {gruplar.map((g, idx) => {
                        const grupAd = typeof g === "object" ? g.ad : g;
                        return (
                          <option key={idx} value={grupAd}>
                            {grupAd}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {/* ⚡ DÜZENLEME MODALI AİDAT İNPUT GÜNCELLEMESİ */}
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-700 mb-1">
                        Aylık Aidat Tutarı (₺) [100 TL Adım]
                      </label>
                      <input
                        type="number"
                        step="100"
                        value={
                          duzenleForm.aylikUcret === 0 ||
                          duzenleForm.aylikUcret === ""
                            ? ""
                            : (duzenleForm.aylikUcret ?? "")
                        }
                        onChange={(e) => {
                          const val = e.target.value;
                          setDuzenleForm({
                            ...duzenleForm,
                            aylikUcret: val === "" ? "" : Number(val),
                          });
                        }}
                        className="w-full p-2 rounded-xl border border-slate-300 font-bold text-xs bg-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-700 mb-1">
                        Aylık Ödeme Günü (1-31)
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
                        className="w-full p-2 rounded-xl border border-slate-300 font-bold text-xs bg-white outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. VELİ İLETİŞİM & ADRES */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <p className="text-xs font-black uppercase text-slate-800 border-b pb-1 border-slate-200">
                    👨‍👩‍👧 3. VELİ İLETİŞİM & ADRES BİLGİLERİ
                  </p>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-700 mb-1">
                        Veli E-posta
                      </label>
                      <input
                        type="email"
                        value={duzenleForm.veliEposta || ""}
                        onChange={(e) =>
                          setDuzenleForm({
                            ...duzenleForm,
                            veliEposta: e.target.value,
                          })
                        }
                        className="w-full p-2 rounded-xl border border-slate-300 font-bold text-xs bg-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-700 mb-1">
                        Ev / İş Adresi
                      </label>
                      <input
                        type="text"
                        value={duzenleForm.veliAdres || ""}
                        onChange={(e) =>
                          setDuzenleForm({
                            ...duzenleForm,
                            veliAdres: e.target.value,
                          })
                        }
                        className="w-full p-2 rounded-xl border border-slate-300 font-bold text-xs bg-white outline-none"
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-300 space-y-2">
                    <p className="text-[11px] font-black uppercase text-slate-700">
                      Mevcut Veliler & Yeni Veli Ekle:
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
                        className="col-span-2 p-1.5 rounded-lg border border-slate-300 text-xs font-bold bg-white"
                      />
                      <select
                        value={duzenleGeciciVeli.yakinlikDerecesi}
                        onChange={(e) =>
                          setDuzenleGeciciVeli({
                            ...duzenleGeciciVeli,
                            yakinlikDerecesi: e.target.value,
                          })
                        }
                        className="p-1.5 rounded-lg border border-slate-300 text-xs font-bold bg-white cursor-pointer"
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
                        className="flex-1 p-1.5 rounded-lg border border-slate-300 text-xs font-bold bg-white"
                      />
                      <button
                        type="button"
                        onClick={duzenleVeliEkle}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-3 py-1.5 rounded-lg text-xs cursor-pointer"
                      >
                        + Veli Ekle
                      </button>
                    </div>

                    {(duzenleForm.veliListesi || []).length > 0 && (
                      <div className="space-y-1.5 pt-2 border-t border-slate-200">
                        {duzenleForm.veliListesi.map((v, idx) => (
                          <div
                            key={idx}
                            className="p-1.5 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center text-xs"
                          >
                            <span>
                              <strong>{v.adSoyad}</strong> ({v.yakinlikDerecesi}
                              ) - {v.telefon}
                            </span>
                            <button
                              type="button"
                              onClick={() => duzenleVeliCikar(idx)}
                              className="text-rose-600 font-black text-sm px-1 cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* 4. SAĞLIK BİLGİLERİ */}
                <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <p className="text-xs font-black text-rose-700 uppercase border-b pb-1 border-rose-200">
                    🩺 4. SAĞLIK BİLGİLERİ
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-700 mb-1">
                        Sağlık Problemi?
                      </label>
                      <select
                        value={duzenleForm.saglikProblemiVarMi || "Hayır"}
                        onChange={(e) =>
                          setDuzenleForm({
                            ...duzenleForm,
                            saglikProblemiVarMi: e.target.value,
                          })
                        }
                        className="w-full p-2 rounded-xl border border-slate-300 font-bold text-xs bg-white outline-none cursor-pointer"
                      >
                        <option value="Hayır">Hayır</option>
                        <option value="Evet">Evet</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-700 mb-1">
                        Düzenli İlaç?
                      </label>
                      <select
                        value={duzenleForm.duzenliIlacVarMi || "Hayır"}
                        onChange={(e) =>
                          setDuzenleForm({
                            ...duzenleForm,
                            duzenliIlacVarMi: e.target.value,
                          })
                        }
                        className="w-full p-2 rounded-xl border border-slate-300 font-bold text-xs bg-white outline-none cursor-pointer"
                      >
                        <option value="Hayır">Hayır</option>
                        <option value="Evet">Evet</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-700 mb-1">
                        Alerji Durumu?
                      </label>
                      <select
                        value={duzenleForm.alerjiVarMi || "Hayır"}
                        onChange={(e) =>
                          setDuzenleForm({
                            ...duzenleForm,
                            alerjiVarMi: e.target.value,
                          })
                        }
                        className="w-full p-2 rounded-xl border border-slate-300 font-bold text-xs bg-white outline-none cursor-pointer"
                      >
                        <option value="Hayır">Hayır</option>
                        <option value="Evet">Evet</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2 pt-1">
                    {duzenleForm.saglikProblemiVarMi === "Evet" && (
                      <input
                        type="text"
                        placeholder="Sağlık Problemi Açıklaması..."
                        value={duzenleForm.saglikAciklama || ""}
                        onChange={(e) =>
                          setDuzenleForm({
                            ...duzenleForm,
                            saglikAciklama: e.target.value,
                          })
                        }
                        className="w-full p-2 rounded-xl border border-rose-300 text-xs font-bold bg-white"
                      />
                    )}
                    {duzenleForm.duzenliIlacVarMi === "Evet" && (
                      <input
                        type="text"
                        placeholder="Düzenli İlaç Açıklaması..."
                        value={duzenleForm.ilacAciklama || ""}
                        onChange={(e) =>
                          setDuzenleForm({
                            ...duzenleForm,
                            ilacAciklama: e.target.value,
                          })
                        }
                        className="w-full p-2 rounded-xl border border-rose-300 text-xs font-bold bg-white"
                      />
                    )}
                    {duzenleForm.alerjiVarMi === "Evet" && (
                      <input
                        type="text"
                        placeholder="Alerji Açıklaması..."
                        value={duzenleForm.alerjiAciklama || ""}
                        onChange={(e) =>
                          setDuzenleForm({
                            ...duzenleForm,
                            alerjiAciklama: e.target.value,
                          })
                        }
                        className="w-full p-2 rounded-xl border border-rose-300 text-xs font-bold bg-white"
                      />
                    )}
                  </div>
                </div>

                {/* 5, 6, 7. ANTRENMAN & HEDEFLER */}
                <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <p className="text-xs font-black text-emerald-800 uppercase border-b pb-1 border-emerald-200">
                    🎯 5, 6 & 7. ANTRENMAN & SPORCU HEDEFLERİ
                  </p>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-700 mb-1">
                        Haftalık Ders Gün Sayısı
                      </label>
                      <select
                        value={duzenleForm.haftalikGunSayisi || "2 GÜN"}
                        onChange={(e) =>
                          setDuzenleForm({
                            ...duzenleForm,
                            haftalikGunSayisi: e.target.value,
                          })
                        }
                        className="w-full p-2 rounded-xl border border-slate-300 font-bold text-xs bg-white outline-none cursor-pointer"
                      >
                        <option value="1 GÜN">1 GÜN</option>
                        <option value="2 GÜN">2 GÜN</option>
                        <option value="3 GÜN VE ÜZERİ">3 GÜN VE ÜZERİ</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-700 mb-1">
                        Cimnastik Hedefi
                      </label>
                      <select
                        value={duzenleForm.cimnastikHedefi || "Hobi Olarak"}
                        onChange={(e) =>
                          setDuzenleForm({
                            ...duzenleForm,
                            cimnastikHedefi: e.target.value,
                          })
                        }
                        className="w-full p-2 rounded-xl border border-slate-300 font-bold text-xs bg-white outline-none cursor-pointer"
                      >
                        <option value="Hobi Olarak">Hobi Olarak</option>
                        <option value="Performans & Altyapı">
                          Performans & Altyapı
                        </option>
                        <option value="Yarışmacı Düzey">Yarışmacı Düzey</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-700 mb-1">
                      Sporcunun Hedefleri (Çoklu Seçim):
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {HEDEF_SECENEKLERI.map((hedef, idx) => {
                        const secili = (duzenleForm.hedefler || []).includes(
                          hedef,
                        );
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => hedefToggle(hedef, true)}
                            className={`p-2 rounded-xl text-[11px] font-bold border transition-all text-left flex items-center justify-between cursor-pointer ${
                              secili
                                ? "bg-amber-400 text-slate-950 border-amber-500 font-black"
                                : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                            }`}
                          >
                            <span>{hedef}</span>
                            <span>{secili ? "✓" : "+"}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* 8, 9, 10. DİĞER DETAYLAR */}
                <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <p className="text-xs font-black text-indigo-800 uppercase border-b pb-1 border-indigo-200">
                    📢 8, 9 & 10. DİĞER DETAYLAR
                  </p>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-700 mb-1">
                        Bizi Nereden Duydunuz?
                      </label>
                      <select
                        value={duzenleForm.duydugunuzYer || "Tavsiye"}
                        onChange={(e) =>
                          setDuzenleForm({
                            ...duzenleForm,
                            duydugunuzYer: e.target.value,
                          })
                        }
                        className="w-full p-2 rounded-xl border border-slate-300 font-bold text-xs bg-white outline-none cursor-pointer"
                      >
                        <option value="Tavsiye">Tavsiye / Tanıdık</option>
                        <option value="Instagram / Sosyal Medya">
                          Instagram / Sosyal Medya
                        </option>
                        <option value="Google Arama">Google / İnternet</option>
                        <option value="Afiş / Bordo">Afiş / Tabela</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-700 mb-1">
                        Fotoğraf / Video İzni
                      </label>
                      <select
                        value={duzenleForm.fotografIznı || "İzin Veriyorum"}
                        onChange={(e) =>
                          setDuzenleForm({
                            ...duzenleForm,
                            fotografIznı: e.target.value,
                          })
                        }
                        className="w-full p-2 rounded-xl border border-slate-300 font-bold text-xs bg-white outline-none cursor-pointer"
                      >
                        <option value="İzin Veriyorum">İzin Veriyorum</option>
                        <option value="İzin Vermiyorum">İzin Vermiyorum</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-700 mb-1">
                      Ek Notlar & Özel Açıklamalar
                    </label>
                    <input
                      type="text"
                      value={duzenleForm.ekBilgiler || ""}
                      onChange={(e) =>
                        setDuzenleForm({
                          ...duzenleForm,
                          ekBilgiler: e.target.value,
                        })
                      }
                      className="w-full p-2 rounded-xl border border-slate-300 font-bold text-xs bg-white outline-none"
                    />
                  </div>

                  {/* ⚡ GÜNCELLEME MODALI NFC KART INPUT SÜZGEÇLİ */}
                  <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-300">
                    <label className="block text-[10px] font-black uppercase text-amber-900 mb-1">
                      📡 NFC Kart ID
                    </label>
                    <input
                      type="text"
                      value={duzenleForm.nfcKartId || ""}
                      onChange={(e) =>
                        setDuzenleForm({
                          ...duzenleForm,
                          nfcKartId: nfcIdTemizle(e.target.value),
                        })
                      }
                      className="w-full p-2 rounded-lg border border-amber-400 font-extrabold text-xs bg-white outline-none"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200 flex flex-wrap justify-between items-center gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={modalOgrenciDondur}
                      className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-black px-4 py-2.5 rounded-xl text-xs shadow-sm transition-all cursor-pointer"
                    >
                      ⏸ Kaydı Dondur
                    </button>

                    <button
                      type="button"
                      onClick={modalOgrenciSil}
                      className="bg-rose-100 hover:bg-rose-200 text-rose-700 border border-rose-300 font-black px-4 py-2.5 rounded-xl text-xs shadow-sm transition-all cursor-pointer"
                    >
                      🗑️ Kaydı Sil
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setDuzenleModalAcik(false)}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer"
                    >
                      İptal
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl text-xs font-black bg-amber-400 hover:bg-amber-500 text-slate-950 shadow-md cursor-pointer"
                    >
                      Değişiklikleri Kaydet
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 🟢 ÖĞRENCİ LİSTESİ VE EKSİKSİZ YENİ KAYIT EKRANI
  return (
    <div className="space-y-8 text-slate-900 font-sans">
      <PageHeader
        title="Öğrenci Yönetimi & Kayıt"
        subtitle="Öğrenci kaydı, inceleme ve kayıt yönetimi"
        icon={<IconStudents className="w-6 h-6" />}
      >
        <Link
          href="/dashboard/ogrenciler/arsiv"
          className="bg-slate-800 hover:bg-slate-900 text-amber-400 border border-slate-700 font-black px-4 py-2.5 rounded-2xl text-xs flex items-center gap-2 shadow-lg transition-all"
        >
          Dondurulanlar & Arşiv
        </Link>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* SOL: EKSİKSİZ KAYIT FORMU */}
        <div className="lg:col-span-6 bg-white p-6 rounded-3xl border-2 border-slate-200 shadow-xl text-slate-900 space-y-5">
          <h2 className="text-lg font-black border-b border-slate-200 pb-3 flex items-center justify-between">
            <span>📝 Yeni Öğrenci Kaydı</span>
            <span className="text-[10px] bg-amber-100 text-amber-900 px-2.5 py-1 rounded-lg font-bold">
              Tüm Alanlar Aktif
            </span>
          </h2>

          <form onSubmit={yeniOgrenciKaydet} className="space-y-5">
            {/* FOTOĞRAF YÜKLEME */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-4">
              {fotoUrl ? (
                <img
                  src={fotoUrl}
                  alt="Profil Fotoğrafı"
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-slate-900"
                />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-slate-200 border-2 border-dashed border-slate-400 flex items-center justify-center text-[10px] text-slate-500 font-bold text-center">
                  Fotoğraf Yok
                </div>
              )}
              <div>
                <label className="cursor-pointer bg-slate-900 hover:bg-slate-800 text-white font-black px-3 py-1.5 rounded-xl text-xs inline-block shadow">
                  📷 Fotoğraf Seç
                  <input
                    type="file"
                    accept="image/*"
                    onChange={resimYukle}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* 1. SPORCU BİLGİLERİ */}
            <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <p className="text-xs font-black text-amber-700 uppercase border-b pb-1 border-amber-200">
                👤 1. SPORCU BİLGİLERİ
              </p>
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-700 mb-1">
                  Ad Soyad *
                </label>
                <input
                  type="text"
                  required
                  value={form.adSoyad}
                  onChange={(e) =>
                    setForm({ ...form, adSoyad: e.target.value })
                  }
                  placeholder="Örn: Zeynep Asel KAN"
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-bold text-xs bg-white outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-700 mb-1">
                    Doğum Tarihi
                  </label>
                  <input
                    type="text"
                    placeholder="GG/AA/YYYY"
                    value={form.dogumTarihi}
                    onChange={(e) =>
                      setForm({ ...form, dogumTarihi: e.target.value })
                    }
                    className="w-full p-2 rounded-xl border border-slate-300 font-bold text-xs bg-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-700 mb-1">
                    Yaş
                  </label>
                  <input
                    type="text"
                    placeholder="Örn: 7"
                    value={form.yas}
                    onChange={(e) => setForm({ ...form, yas: e.target.value })}
                    className="w-full p-2 rounded-xl border border-slate-300 font-bold text-xs bg-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-700 mb-1">
                    T.C. Kimlik No
                  </label>
                  <input
                    type="text"
                    placeholder="11 haneli"
                    value={form.tcKimlikNo}
                    onChange={(e) =>
                      setForm({ ...form, tcKimlikNo: e.target.value })
                    }
                    className="w-full p-2 rounded-xl border border-slate-300 font-bold text-xs bg-white outline-none"
                  />
                </div>
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
                    className="w-full p-2 rounded-xl border border-slate-300 font-bold text-xs bg-white outline-none cursor-pointer"
                  >
                    <option value="Bilinmiyor">Bilinmiyor</option>
                    <option value="0 Rh+">0 Rh+</option>
                    <option value="0 Rh-">0 Rh-</option>
                    <option value="A Rh+">A Rh+</option>
                    <option value="A Rh-">A Rh-</option>
                    <option value="B Rh+">B Rh+</option>
                    <option value="B Rh-">B Rh-</option>
                    <option value="AB Rh+">AB Rh+</option>
                    <option value="AB Rh-">AB Rh-</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-700 mb-1">
                    Lisans Durumu
                  </label>
                  <select
                    value={form.lisansliMi ? "Evet" : "Hayır"}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        lisansliMi: e.target.value === "Evet",
                      })
                    }
                    className="w-full p-2 rounded-xl border border-slate-300 font-bold text-xs bg-white outline-none cursor-pointer"
                  >
                    <option value="Hayır">Lisanssız Sporcu</option>
                    <option value="Evet">✓ Lisanslı Sporcu</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 2. EĞİTİM & AİDAT BİLGİLERİ */}
            <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <p className="text-xs font-black text-blue-700 uppercase border-b pb-1 border-blue-200">
                🎓 2. EĞİTİM & AİDAT BİLGİLERİ
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-700 mb-1">
                    Okul / Anaokulu
                  </label>
                  <input
                    type="text"
                    placeholder="Örn: Atatürk İÖO"
                    value={form.okulAnaokulu}
                    onChange={(e) =>
                      setForm({ ...form, okulAnaokulu: e.target.value })
                    }
                    className="w-full p-2 rounded-xl border border-slate-300 font-bold text-xs bg-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-700 mb-1">
                    Sınıfı
                  </label>
                  <input
                    type="text"
                    placeholder="Örn: 2-B"
                    value={form.sinifi}
                    onChange={(e) =>
                      setForm({ ...form, sinifi: e.target.value })
                    }
                    className="w-full p-2 rounded-xl border border-slate-300 font-bold text-xs bg-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-700 mb-1">
                  Cimnastik Grubu *
                </label>
                <select
                  value={form.grup}
                  onChange={(e) => setForm({ ...form, grup: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-bold text-xs bg-white outline-none cursor-pointer"
                >
                  {gruplar.map((g, idx) => {
                    const grupAd = typeof g === "object" ? g.ad : g;
                    return (
                      <option key={idx} value={grupAd}>
                        {grupAd}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {/* ⚡ YENİ KAYIT FORMU AİDAT İNPUT GÜNCELLEMESİ */}
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-700 mb-1">
                    Aylık Aidat Tutarı (₺) [100 TL Adım]
                  </label>
                  <input
                    type="number"
                    step="100"
                    placeholder="Örn: 2000"
                    value={
                      form.aylikUcret === 0 || form.aylikUcret === ""
                        ? ""
                        : (form.aylikUcret ?? "")
                    }
                    onChange={(e) => {
                      const val = e.target.value;
                      setForm({
                        ...form,
                        aylikUcret: val === "" ? "" : Number(val),
                      });
                    }}
                    className="w-full p-2 rounded-xl border border-slate-300 font-bold text-xs bg-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-700 mb-1">
                    Aylık Ödeme Günü (1-31)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={form.odemeGunu}
                    onChange={(e) =>
                      setForm({ ...form, odemeGunu: Number(e.target.value) })
                    }
                    className="w-full p-2 rounded-xl border border-slate-300 font-bold text-xs bg-white outline-none"
                  />
                </div>
              </div>
            </div>

            {/* 3. VELİ BİLGİLERİ & ADRES */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <p className="text-xs font-black uppercase text-slate-800 border-b pb-1 border-slate-200">
                👨‍👩‍👧 3. VELİ İLETİŞİM & ADRES BİLGİLERİ
              </p>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-700 mb-1">
                    Veli E-posta
                  </label>
                  <input
                    type="email"
                    placeholder="ornek@gmail.com"
                    value={form.veliEposta}
                    onChange={(e) =>
                      setForm({ ...form, veliEposta: e.target.value })
                    }
                    className="w-full p-2 rounded-xl border border-slate-300 font-bold text-xs bg-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-700 mb-1">
                    Ev / İş Adresi
                  </label>
                  <input
                    type="text"
                    placeholder="Mahalle, Sokak No..."
                    value={form.veliAdres}
                    onChange={(e) =>
                      setForm({ ...form, veliAdres: e.target.value })
                    }
                    className="w-full p-2 rounded-xl border border-slate-300 font-bold text-xs bg-white outline-none"
                  />
                </div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-300 space-y-2">
                <p className="text-[11px] font-black uppercase text-slate-700">
                  Veli Ekle (+):
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Veli Adı"
                    value={geciciVeli.adSoyad}
                    onChange={(e) =>
                      setGeciciVeli({ ...geciciVeli, adSoyad: e.target.value })
                    }
                    className="col-span-2 p-1.5 rounded-lg border border-slate-300 text-xs font-bold bg-white"
                  />
                  <select
                    value={geciciVeli.yakinlikDerecesi}
                    onChange={(e) =>
                      setGeciciVeli({
                        ...geciciVeli,
                        yakinlikDerecesi: e.target.value,
                      })
                    }
                    className="p-1.5 rounded-lg border border-slate-300 text-xs font-bold bg-white cursor-pointer"
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
                    className="flex-1 p-1.5 rounded-lg border border-slate-300 text-xs font-bold bg-white"
                  />
                  <button
                    type="button"
                    onClick={veliEkle}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-3 py-1.5 rounded-lg text-xs cursor-pointer"
                  >
                    + Ekle
                  </button>
                </div>

                {eklenenVeliler.length > 0 && (
                  <div className="space-y-1.5 pt-2 border-t border-slate-200">
                    {eklenenVeliler.map((v, idx) => (
                      <div
                        key={idx}
                        className="p-1.5 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center text-xs"
                      >
                        <span>
                          <strong>{v.adSoyad}</strong> ({v.yakinlikDerecesi}) -{" "}
                          {v.telefon}
                        </span>
                        <button
                          type="button"
                          onClick={() => veliCikar(idx)}
                          className="text-rose-600 font-black text-sm px-1 cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 4. SAĞLIK BİLGİLERİ */}
            <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <p className="text-xs font-black text-rose-700 uppercase border-b pb-1 border-rose-200">
                🩺 4. SAĞLIK BİLGİLERİ
              </p>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-700 mb-1">
                    Sağlık Problemi?
                  </label>
                  <select
                    value={form.saglikProblemiVarMi}
                    onChange={(e) =>
                      setForm({ ...form, saglikProblemiVarMi: e.target.value })
                    }
                    className="w-full p-2 rounded-xl border border-slate-300 font-bold text-xs bg-white outline-none cursor-pointer"
                  >
                    <option value="Hayır">Hayır</option>
                    <option value="Evet">Evet</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-700 mb-1">
                    Düzenli İlaç?
                  </label>
                  <select
                    value={form.duzenliIlacVarMi}
                    onChange={(e) =>
                      setForm({ ...form, duzenliIlacVarMi: e.target.value })
                    }
                    className="w-full p-2 rounded-xl border border-slate-300 font-bold text-xs bg-white outline-none cursor-pointer"
                  >
                    <option value="Hayır">Hayır</option>
                    <option value="Evet">Evet</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-700 mb-1">
                    Alerji Durumu?
                  </label>
                  <select
                    value={form.alerjiVarMi}
                    onChange={(e) =>
                      setForm({ ...form, alerjiVarMi: e.target.value })
                    }
                    className="w-full p-2 rounded-xl border border-slate-300 font-bold text-xs bg-white outline-none cursor-pointer"
                  >
                    <option value="Hayır">Hayır</option>
                    <option value="Evet">Evet</option>
                  </select>
                </div>
              </div>

              {(form.saglikProblemiVarMi === "Evet" ||
                form.duzenliIlacVarMi === "Evet" ||
                form.alerjiVarMi === "Evet") && (
                <div className="space-y-2 pt-1">
                  {form.saglikProblemiVarMi === "Evet" && (
                    <input
                      type="text"
                      placeholder="Sağlık Problemi Açıklaması..."
                      value={form.saglikAciklama}
                      onChange={(e) =>
                        setForm({ ...form, saglikAciklama: e.target.value })
                      }
                      className="w-full p-2 rounded-xl border border-rose-300 text-xs font-bold bg-white"
                    />
                  )}
                  {form.duzenliIlacVarMi === "Evet" && (
                    <input
                      type="text"
                      placeholder="Düzenli İlaç Açıklaması..."
                      value={form.ilacAciklama}
                      onChange={(e) =>
                        setForm({ ...form, ilacAciklama: e.target.value })
                      }
                      className="w-full p-2 rounded-xl border border-rose-300 text-xs font-bold bg-white"
                    />
                  )}
                  {form.alerjiVarMi === "Evet" && (
                    <input
                      type="text"
                      placeholder="Alerji Açıklaması..."
                      value={form.alerjiAciklama}
                      onChange={(e) =>
                        setForm({ ...form, alerjiAciklama: e.target.value })
                      }
                      className="w-full p-2 rounded-xl border border-rose-300 text-xs font-bold bg-white"
                    />
                  )}
                </div>
              )}
            </div>

            {/* 5, 6, 7. ANTRENMAN & HEDEFLER */}
            <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <p className="text-xs font-black text-emerald-800 uppercase border-b pb-1 border-emerald-200">
                🎯 5, 6 & 7. ANTRENMAN & SPORCU HEDEFLERİ
              </p>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-700 mb-1">
                    Haftalık Ders Gün Sayısı
                  </label>
                  <select
                    value={form.haftalikGunSayisi}
                    onChange={(e) =>
                      setForm({ ...form, haftalikGunSayisi: e.target.value })
                    }
                    className="w-full p-2 rounded-xl border border-slate-300 font-bold text-xs bg-white outline-none cursor-pointer"
                  >
                    <option value="1 GÜN">1 GÜN</option>
                    <option value="2 GÜN">2 GÜN</option>
                    <option value="3 GÜN VE ÜZERİ">3 GÜN VE ÜZERİ</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-700 mb-1">
                    Cimnastik Hedefi
                  </label>
                  <select
                    value={form.cimnastikHedefi}
                    onChange={(e) =>
                      setForm({ ...form, cimnastikHedefi: e.target.value })
                    }
                    className="w-full p-2 rounded-xl border border-slate-300 font-bold text-xs bg-white outline-none cursor-pointer"
                  >
                    <option value="Hobi Olarak">Hobi Olarak</option>
                    <option value="Performans & Altyapı">
                      Performans & Altyapı
                    </option>
                    <option value="Yarışmacı Düzey">Yarışmacı Düzey</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-700 mb-1">
                  Sporcunun Hedefleri (Çoklu Seçim):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {HEDEF_SECENEKLERI.map((hedef, idx) => {
                    const secili = (form.hedefler || []).includes(hedef);
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => hedefToggle(hedef, false)}
                        className={`p-2 rounded-xl text-[11px] font-bold border transition-all text-left flex items-center justify-between cursor-pointer ${
                          secili
                            ? "bg-amber-400 text-slate-950 border-amber-500 font-black"
                            : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                        }`}
                      >
                        <span>{hedef}</span>
                        <span>{secili ? "✓" : "+"}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 8, 9, 10. BİZİ NEREDEN DUYDUNUZ, İZİN & EK BİLGİLER */}
            <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <p className="text-xs font-black text-indigo-800 uppercase border-b pb-1 border-indigo-200">
                📢 8, 9 & 10. DİĞER DETAYLAR
              </p>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-700 mb-1">
                    Bizi Nereden Duydunuz?
                  </label>
                  <select
                    value={form.duydugunuzYer}
                    onChange={(e) =>
                      setForm({ ...form, duydugunuzYer: e.target.value })
                    }
                    className="w-full p-2 rounded-xl border border-slate-300 font-bold text-xs bg-white outline-none cursor-pointer"
                  >
                    <option value="Tavsiye">Tavsiye / Tanıdık</option>
                    <option value="Instagram / Sosyal Medya">
                      Instagram / Sosyal Medya
                    </option>
                    <option value="Google Arama">Google / İnternet</option>
                    <option value="Afiş / Bordo">Afiş / Tabela</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-700 mb-1">
                    Fotoğraf / Video İzni
                  </label>
                  <select
                    value={form.fotografIznı}
                    onChange={(e) =>
                      setForm({ ...form, fotografIznı: e.target.value })
                    }
                    className="w-full p-2 rounded-xl border border-slate-300 font-bold text-xs bg-white outline-none cursor-pointer"
                  >
                    <option value="İzin Veriyorum">İzin Veriyorum</option>
                    <option value="İzin Vermiyorum">İzin Vermiyorum</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-700 mb-1">
                  Ek Notlar & Özel Açıklamalar
                </label>
                <input
                  type="text"
                  placeholder="Eklemek istediğiniz özel bir durum var mı?"
                  value={form.ekBilgiler}
                  onChange={(e) =>
                    setForm({ ...form, ekBilgiler: e.target.value })
                  }
                  className="w-full p-2 rounded-xl border border-slate-300 font-bold text-xs bg-white outline-none"
                />
              </div>

              {/* ⚡ YENİ KAYIT FORMU NFC KART INPUT SÜZGEÇLİ */}
              <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-300">
                <label className="block text-[10px] font-black uppercase text-amber-900 mb-1">
                  📡 NFC Kart ID
                </label>
                <input
                  type="text"
                  value={form.nfcKartId}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      nfcKartId: nfcIdTemizle(e.target.value),
                    })
                  }
                  placeholder="USB okuyucu ile 13,56 MHz kart okutun..."
                  className="w-full p-2 rounded-lg border border-amber-400 font-extrabold text-xs bg-white outline-none"
                />
              </div>
            </div>

            {/* BUTONLAR */}
            <div className="space-y-2 pt-2">
              <button
                type="submit"
                className="w-full bg-[#0F172A] hover:bg-slate-800 text-amber-400 font-black py-4 rounded-2xl text-xs uppercase tracking-wider shadow-lg cursor-pointer transition-all"
              >
                🚀 Öğrenciyi Sisteme Kaydet
              </button>

              <button
                type="button"
                onClick={() =>
                  ciktiAlWord({ ...form, veliListesi: eklenenVeliler })
                }
                className="w-full bg-blue-50 hover:bg-blue-100 text-blue-900 border-2 border-blue-300 font-black py-3 rounded-2xl text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                📝 Word Kayıt Formu İndir (.doc)
              </button>
            </div>
          </form>
        </div>

        {/* SAĞ: ÖĞRENCİ LİSTESİ */}
        <div className="lg:col-span-6 bg-white p-6 rounded-3xl border-2 border-slate-200 shadow-xl text-slate-900 space-y-4">
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
                className="w-full p-2 rounded-xl border border-slate-300 font-bold text-xs bg-white outline-none cursor-pointer"
              >
                <option value="Tüm Gruplar">Tüm Gruplar</option>
                {gruplar.map((g, idx) => {
                  const grupAd = typeof g === "object" ? g.ad : g;
                  return (
                    <option key={idx} value={grupAd}>
                      {grupAd}
                    </option>
                  );
                })}
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
                    <th className="p-3 text-right">İşlem</th>
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
                            className="font-black text-blue-600 hover:text-blue-800 underline text-left cursor-pointer"
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

                        <td className="p-3 text-right whitespace-nowrap">
                          <button
                            onClick={() => ogrenciSecVePaneliAc(o)}
                            className="bg-slate-800 hover:bg-slate-900 text-amber-400 font-black px-3 py-1.5 rounded-xl text-[11px] shadow-sm transition-all cursor-pointer"
                          >
                            🔍 İncele / Yönet
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
    </div>
  );
}
