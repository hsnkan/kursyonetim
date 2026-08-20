import { Resend } from "resend";
import { getMailFromHeader } from "@/lib/siteConfig";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export function getMailFromForSalon(salonBranding) {
  if (salonBranding?.mailFromName && salonBranding?.mailFromAddress) {
    return `${salonBranding.mailFromName} <${salonBranding.mailFromAddress}>`;
  }
  return getMailFromHeader();
}

export async function sendEmail({ to, subject, html, from }) {
  if (!resend || !to) return { sent: false, reason: "no_resend_or_recipient" };

  await resend.emails.send({
    from: from || getMailFromHeader(),
    to: Array.isArray(to) ? to : [to],
    subject,
    html,
  });

  return { sent: true };
}

export async function sendSecurityEmail(toEmail, baslik, icerikHtml, from) {
  try {
    return await sendEmail({
      to: toEmail,
      subject: baslik,
      html: icerikHtml,
      from,
    });
  } catch (err) {
    console.error("Mail gönderim hatası:", err);
    return { sent: false, reason: err.message };
  }
}

export async function sendLicenseReminderEmails({
  salonBranding,
  user,
  kalanGun,
  bitisTarihi,
}) {
  if (!resend) return { developer: false, customer: false };

  const from = getMailFromForSalon(salonBranding);
  const developerTo =
    salonBranding?.gelistiriciEmail || process.env.DEVELOPER_EMAIL;
  const customerTo =
    salonBranding?.musteriEmail || user.email;

  const sonuc = { developer: false, customer: false };

  if (developerTo) {
    await sendEmail({
      to: developerTo,
      from,
      subject: `⚠️ LİSANS UYARISI: ${user.salonAdi || user.email} — ${kalanGun} gün kaldı`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #d97706;">Lisans Yenileme Hatırlatması (Teknik)</h2>
          <p>Müşterinizin yıllık lisans süresi dolmak üzeredir.</p>
          <p><strong>Salon:</strong> ${user.salonAdi || "Belirtilmedi"}</p>
          <p><strong>Kalan:</strong> ${kalanGun} gün</p>
          <p><strong>Bitiş:</strong> ${bitisTarihi.toLocaleDateString("tr-TR")}</p>
          <p>Geliştirici panelinden lisans süresini uzatınız.</p>
        </div>
      `,
    });
    sonuc.developer = true;
  }

  if (customerTo) {
    await sendEmail({
      to: customerTo,
      from,
      subject: `⏳ ${user.salonAdi || "Kurs Yönetim"} — Lisans yenileme hatırlatması`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #2563eb;">Yazılım Lisans Hatırlatması</h2>
          <p>Sayın ${user.adSoyad || "Yetkili"},</p>
          <p>
            <strong>${user.salonAdi || "Kurs yönetim sisteminiz"}</strong> için
            yazılım lisansınızın bitişine <strong>${kalanGun} gün</strong> kalmıştır.
          </p>
          <p><strong>Bitiş tarihi:</strong> ${bitisTarihi.toLocaleDateString("tr-TR")}</p>
          <p>
            Kesintisiz kullanım için lisans yenileme işleminizi lütfen
            yazılım sağlayıcınızla görüşün.
          </p>
          <p style="font-size: 12px; color: #64748b;">
            Bu e-posta otomatik bilgilendirme amaçlıdır. Kişisel verileriniz
            KVKK kapsamında korunmaktadır.
          </p>
        </div>
      `,
    });
    sonuc.customer = true;
  }

  return sonuc;
}
