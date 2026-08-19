import PptxGenJS from "pptxgenjs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputPath = path.resolve(
  __dirname,
  "../docs/Kurs-Yonetim-Musteri-Sunumu.pptx",
);

const DARK = "0F172A";
const AMBER = "F59E0B";
const WHITE = "FFFFFF";
const SLATE = "CBD5E1";

const SALON = "Balans Cimnastik Akademi";

const pptx = new PptxGenJS();
pptx.layout = "LAYOUT_16x9";
pptx.author = "Balans Cimnastik Akademi";
pptx.company = SALON;
pptx.title = `${SALON} — Yönetim Paneli Kullanım Rehberi`;
pptx.subject = "Salon yönetim paneli kullanıcı sunumu";

function slideBase(title) {
  const slide = pptx.addSlide();
  slide.background = { color: DARK };
  slide.addText(title, {
    x: 0.5,
    y: 0.35,
    w: 9,
    h: 0.7,
    fontSize: 28,
    bold: true,
    color: AMBER,
    fontFace: "Arial",
  });
  return slide;
}

function addBullets(slide, items, y = 1.2, fontSize = 16) {
  slide.addText(
    items.map((t) => ({
      text: t,
      options: { bullet: { code: "2022" }, breakLine: true },
    })),
    {
      x: 0.6,
      y,
      w: 8.8,
      h: 5.5,
      fontSize,
      color: WHITE,
      fontFace: "Arial",
      valign: "top",
      lineSpacingMultiple: 1.15,
    },
  );
}

function addNote(slide, text) {
  if (text) slide.addNotes(text);
}

// SLAYT 1 — Kapak
{
  const slide = pptx.addSlide();
  slide.background = { color: DARK };
  slide.addText(SALON.toUpperCase(), {
    x: 0.5,
    y: 1.5,
    w: 9,
    h: 0.9,
    fontSize: 38,
    bold: true,
    color: AMBER,
    align: "center",
    fontFace: "Arial",
  });
  slide.addText("Yönetim Paneli Kullanım Rehberi", {
    x: 0.5,
    y: 2.4,
    w: 9,
    h: 0.6,
    fontSize: 22,
    color: WHITE,
    align: "center",
    fontFace: "Arial",
  });
  slide.addText("Yoklama · Öğrenci · Aidat · Duyuru · Rapor", {
    x: 0.5,
    y: 3.2,
    w: 9,
    h: 0.5,
    fontSize: 16,
    color: SLATE,
    align: "center",
    fontFace: "Arial",
  });
  slide.addText("Balans Cimnastik Akademi  ·  [Sunum Tarihi]", {
    x: 0.5,
    y: 4.6,
    w: 9,
    h: 0.5,
    fontSize: 14,
    color: SLATE,
    align: "center",
    fontFace: "Arial",
  });
  addNote(
    slide,
    "Bu sunum Balans Cimnastik Akademi’nin günlük salon işlerini panelden nasıl yöneteceğinizi anlatır. Teknik altyapı veya yönetici paneli detaylarına girilmez.",
  );
}

// SLAYT 2 — Günlük ihtiyaçlar
{
  const slide = slideBase("Salon yönetiminde yaşanan zorluklar");
  addBullets(slide, [
    "Kağıt yoklama ve Excel listeleri",
    "Veli bilgilerinin farklı yerlerde tutulması",
    "Aidat takibinde gecikmeler",
    "Duyuruların gruplara geç ulaşması",
    "Geçmişe dönük kayıt bulmakta zorlanma",
  ]);
  addNote(
    slide,
    "Bu panel bu işleri tek yerde toplar. Kurulum ve hesap açılışı sizin adınıza yapılmıştır; siz doğrudan kullanmaya başlarsınız.",
  );
}

// SLAYT 3 — Panel özeti
{
  const slide = slideBase(`${SALON} — Tek panel, tüm işlemler`);
  addBullets(slide, [
    "NFC ile anlık yoklama",
    "Öğrenci ve veli kayıtları",
    "Aidat muhasebesi",
    "WhatsApp duyuruları",
    "Raporlar ve işlem kayıtları",
    "Profil ve güvenlik ayarları",
  ]);
  addNote(
    slide,
    "Bilgisayar, tablet veya telefondan tarayıcı ile kullanılır. Ekstra program kurmanız gerekmez.",
  );
}

// SLAYT 4 — Kim kullanır
{
  const slide = slideBase("Paneli kimler kullanır?");
  addBullets(slide, [
    "Salon yöneticisi → aidat, rapor, genel takip",
    "Sekreter / idari personel → kayıt, duyuru, muhasebe",
    "Antrenör → NFC yoklama, grup bilgisi, devamsızlık",
  ]);
  addNote(
    slide,
    "Herkes kendi ihtiyacı olan menüleri kullanır. Giriş bilgileriniz size özeldir; başkalarıyla paylaşmayın.",
  );
}

// SLAYT 5 — Güvenlik (müşteri seviyesi)
{
  const slide = slideBase("Güvenlik ve gizlilik");
  addBullets(slide, [
    "Kişisel giriş şifreniz ve isteğe bağlı iki aşamalı doğrulama (2FA)",
    "İşlemleriniz sistemde kayıt altında tutulur",
    "Destek talebinde: Profil sayfasından geçici erişim izni verebilirsiniz",
    "Destek oturumu açıkken ekranda uyarı bandı görünür",
    "İzin süresi dolunca erişim otomatik kapanır",
  ]);
  addNote(
    slide,
    "Destek konusunu sadece şöyle anlatın: Sorun olduğunda bizi arayın; gerekirse Profil’den kısa süreli izin verirsiniz. PIN, geliştirici paneli veya arka plan işlemlerinden bahsetmeyin.",
  );
}

// SLAYT 6 — NFC
{
  const slide = slideBase("NFC Yoklama");
  addBullets(slide, [
    "Sporcu kartını okutun veya kart numarasını girin",
    "Yoklama anında kaydedilir",
    "Aynı gün tekrar okutulursa uyarı verir",
    "Bugünkü yoklamalar gruplara göre listelenir",
    "Telefon kısayolu ile de hızlı yoklama alınabilir",
  ]);
  addNote(slide, "CANLI DEMO: Yoklama ekranı — kart okut, listede gör.");
}

// SLAYT 7 — Öğrenci
{
  const slide = slideBase("Öğrenci Yönetimi");
  addBullets(slide, [
    "Yeni sporcu kaydı, düzenleme ve arama",
    "Grup, aylık aidat, ödeme günü, NFC kart no",
    "Veli telefonları ve iletişim bilgileri",
    "Sağlık, alerji ve not alanları",
    "Kayıt formu çıktısı (Word)",
    "Ayrılan veya dondurulan sporcular arşivde saklanır",
  ]);
  addNote(slide, "CANLI DEMO: Öğrenci listesi, yeni kayıt veya arama.");
}

// SLAYT 8 — Duyurular
{
  const slide = slideBase("Duyurular ve WhatsApp");
  addBullets(slide, [
    "Hazır şablonlar: genel, aidat, tatil, kar tatili, yarışma",
    "Grup WhatsApp linki ile toplu duyuru",
    "Veli veli kişisel mesaj gönderimi",
    "Mesajlar Balans Cimnastik Akademi imzasıyla gider",
  ]);
  addNote(
    slide,
    "WhatsApp mesajları sizin onayınızla açılır; sistem otomatik toplu mesaj atmaz.",
  );
}

// SLAYT 9 — Muhasebe
{
  const slide = slideBase("Muhasebe ve Aidat Takibi");
  addBullets(slide, [
    "Beklenen, tahsil edilen ve kalan aidat özeti",
    "Bugün ödemesi gelen sporcular listesi",
    "“Ödeme Al” ile tahsilat kaydı",
    "Veliye WhatsApp aidat hatırlatması",
    "Aylık tahsilat grafiği ve dönem karşılaştırma",
  ]);
  addNote(slide, "CANLI DEMO: Muhasebe ekranı — özet kartlar ve ödeme al.");
}

// SLAYT 10 — Raporlar
{
  const slide = slideBase("Raporlar");
  addBullets(slide, [
    "Aylık kayıt istatistikleri (aktif, yeni, ayrılan)",
    "Tarih ve gruba göre yoklama raporu",
    "Yazdır veya PDF olarak kaydet",
    "Antrenör listesi (rapor imzaları için)",
  ]);
  addNote(slide, "CANLI DEMO: Raporlar ekranı.");
}

// SLAYT 11 — İşlem geçmişi (müşteri dili)
{
  const slide = slideBase("İşlem Kayıtları");
  addBullets(slide, [
    "Kim, ne zaman, hangi işlemi yaptı?",
    "Öğrenci kayıtları, yoklama, ödeme işlemleri",
    "Salon içi kontrol ve hesap verebilirlik için",
  ]);
  addNote(
    slide,
    "“Audit log” veya teknik terim kullanmayın. Personel değişse bile geçmiş işlemler burada kalır.",
  );
}

// SLAYT 12 — Profil
{
  const slide = slideBase("Profil Sayfanız");
  addBullets(slide, [
    "Kalan kullanım sürenizi ve bitiş tarihini görürsünüz",
    "Google Authenticator ile 2FA kurulumu",
    "Destek gerektiğinde geçici erişim izni verme",
    "Şifre değiştirme (ilk girişte zorunlu olabilir)",
  ]);
  addNote(
    slide,
    "Lisans yenileme detaylarını anlatmayın; sadece süreyi profilden takip edebileceklerini ve yenileme için sizinle iletişime geçmeleri gerektiğini söyleyin.",
  );
}

// SLAYT 13 — Demo akışı
{
  const slide = slideBase("Canlı Demo Sırası (5 dakika)");
  addBullets(slide, [
    "1. Panele giriş",
    "2. NFC yoklama",
    "3. Öğrenci arama",
    "4. Duyuru şablonu",
    "5. Aidat — ödeme al",
    "6. Kısa rapor bakışı",
  ]);
  addNote(slide, "Demo sırasında admin paneli, lisans uzatma veya geliştirici menüsünü göstermeyin.");
}

// SLAYT 14 — Avantajlar
{
  const slide = slideBase("Balans Cimnastik için faydalar");
  addBullets(slide, [
    "Daha az evrak, daha hızlı yoklama",
    "Veli bilgileri tek yerde",
    "Aidat takibi net ve düzenli",
    "Duyurular hızlı ulaşır",
    "Raporlarla salon performansını görürsünüz",
  ]);
  addNote(slide, "Günlük iş yükünü azaltır; veli memnuniyetini artırır.");
}

// SLAYT 15 — Destek (müşteri seviyesi)
{
  const slide = slideBase("Destek ve iletişim");
  addBullets(slide, [
    "İlk kurulum ve eğitim tarafımızdan yapıldı",
    "Sorun yaşarsanız bizi arayın veya yazın",
    "Gerekirse Profil’den kısa süreli destek izni verin",
    "Grup ve öğrenci verilerinde yardım — biz hallederiz",
    "İletişim: [Telefon] · [WhatsApp] · [E-posta]",
  ]);
  addNote(
    slide,
    "Excel toplu yükleme, lisans ayarı, hesap oluşturma gibi işlemler sizin yapmanız gereken işler değil; destek talebi olarak tarif edin.",
  );
}

// SLAYT 16 — SSS
{
  const slide = slideBase("Sık Sorulan Sorular");
  addBullets(
    slide,
    [
      "Program kurmam gerekir mi? → Hayır, tarayıcı yeterli.",
      "Telefondan kullanılabilir mi? → Evet.",
      "WhatsApp otomatik mesaj atar mı? → Hayır, siz onaylayarak gönderirsiniz.",
      "Şifremi unuttum ne yapmalıyım? → “Şifremi unuttum” veya bizi arayın.",
      "Kullanım sürem bittiğinde? → Bizimle iletişime geçin, yenileme yapılır.",
    ],
    1.1,
    15,
  );
}

// SLAYT 17 — Kapanış
{
  const slide = pptx.addSlide();
  slide.background = { color: DARK };
  slide.addText("Teşekkürler", {
    x: 0.5,
    y: 1.8,
    w: 9,
    h: 0.8,
    fontSize: 36,
    bold: true,
    color: AMBER,
    align: "center",
    fontFace: "Arial",
  });
  slide.addText(`${SALON}\nYönetim Paneli`, {
    x: 0.5,
    y: 2.7,
    w: 9,
    h: 1,
    fontSize: 20,
    color: WHITE,
    align: "center",
    fontFace: "Arial",
  });
  slide.addText(
    "Sorularınız için her zaman ulaşabilirsiniz\n[Telefon] · [WhatsApp]",
    {
      x: 0.5,
      y: 4.1,
      w: 9,
      h: 0.8,
      fontSize: 14,
      color: SLATE,
      align: "center",
      fontFace: "Arial",
    },
  );
  addNote(
    slide,
    "Sunum sonunda kısa demo veya birlikte ilk yoklama almayı teklif edin.",
  );
}

await pptx.writeFile({ fileName: outputPath });
console.log("✅ PowerPoint oluşturuldu:", outputPath);
