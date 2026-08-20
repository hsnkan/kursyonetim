import Link from "next/link";
import { getSiteConfig } from "@/lib/siteConfig";

export const metadata = {
  title: "KVKK Aydınlatma Metni",
  description: "Kişisel verilerin korunması hakkında bilgilendirme",
};

export default function GizlilikPage() {
  const site = getSiteConfig();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 px-4 py-10">
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <Link
            href="/auth/login"
            className="text-amber-400 text-sm font-bold hover:underline"
          >
            ← Giriş sayfasına dön
          </Link>
          <h1 className="text-3xl font-black text-white mt-4">
            KVKK Aydınlatma Metni
          </h1>
          <p className="text-slate-400 text-sm mt-2">
            6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında
            bilgilendirme
          </p>
        </div>

        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 text-sm leading-relaxed">
          <h2 className="text-lg font-black text-amber-400">Veri Sorumlusu</h2>
          <p>
            Bu yazılım üzerinde işlenen öğrenci, veli ve personel verilerinin
            veri sorumlusu ilgili spor salonu / kurs işletmesidir (
            {site.isletmeTamAdi}). Yazılım sağlayıcısı (
            {site.teknikDestekAdi}) yalnızca teknik hizmet sağlayıcısı (
            veri işleyen) sıfatıyla hareket eder.
          </p>

          <h2 className="text-lg font-black text-amber-400">
            İşlenen Kişisel Veriler
          </h2>
          <ul className="list-disc pl-5 space-y-1 text-slate-300">
            <li>Öğrenci adı, doğum tarihi, grup bilgisi</li>
            <li>Veli adı, telefon numarası, e-posta (varsa)</li>
            <li>Yoklama kayıtları ve aidat/tahsilat bilgileri</li>
            <li>Kullanıcı hesap bilgileri (ad, e-posta, giriş logları)</li>
          </ul>

          <h2 className="text-lg font-black text-amber-400">
            İşleme Amaçları
          </h2>
          <ul className="list-disc pl-5 space-y-1 text-slate-300">
            <li>Kurs kayıt ve yoklama yönetimi</li>
            <li>Veli iletişimi (duyuru, aidat hatırlatması)</li>
            <li>Muhasebe / tahsilat takibi</li>
            <li>Sistem güvenliği, denetim kaydı ve teknik destek</li>
          </ul>

          <h2 className="text-lg font-black text-amber-400">Hukuki Sebep</h2>
          <p>
            Veriler; sözleşmenin ifası, meşru menfaat ve açık rıza (teknik
            destek izni gibi isteğe bağlı işlemler) kapsamında işlenir.
          </p>

          <h2 className="text-lg font-black text-amber-400">Saklama Süresi</h2>
          <p>
            Veriler, kurs hizmetinin süresi boyunca ve yasal yükümlülükler
            gereği gerekli süre kadar saklanır. Arşivlenen kayıtlar erişime
            kapatılabilir.
          </p>

          <h2 className="text-lg font-black text-amber-400">Aktarım</h2>
          <p>
            Veriler MongoDB Atlas (bulut) ve Vercel (uygulama barındırma)
            altyapısında, şifreli bağlantılar üzerinden saklanır. Üçüncü
            taraflara pazarlama amacıyla aktarım yapılmaz.
          </p>

          <h2 className="text-lg font-black text-amber-400">
            Teknik Destek Erişimi
          </h2>
          <p>
            Yazılım sağlayıcısı, yalnızca salon yöneticisinin Profil sayfasından
            verdiği <strong>3 saatlik açık rıza</strong> ile sisteme erişebilir.
            Bu süre boyunca ekranda uyarı bandı gösterilir.
          </p>

          <h2 className="text-lg font-black text-amber-400">Haklarınız</h2>
          <p>
            KVKK md. 11 kapsamında; verilerinize erişme, düzeltme, silme,
            işlemeyi kısıtlama ve itiraz etme haklarına sahipsiniz. Taleplerinizi
            salon yönetiminize iletebilirsiniz.
          </p>

          <h2 className="text-lg font-black text-amber-400">İletişim</h2>
          <p>
            KVKK talepleri için öncelikle kurs / salon yönetiminizle iletişime
            geçin. Teknik altyapı sorularında {site.teknikDestekAdi} devreye
            girer.
          </p>
        </section>

        <p className="text-[11px] text-slate-500 text-center">
          Son güncelleme: {new Date().toLocaleDateString("tr-TR")}
        </p>
      </div>
    </div>
  );
}
