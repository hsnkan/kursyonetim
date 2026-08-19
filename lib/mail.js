import { Resend } from "resend";
import { getMailFromHeader } from "@/lib/siteConfig";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendSecurityEmail(toEmail, baslik, icerikHtml) {
  try {
    if (!process.env.RESEND_API_KEY) return;

    await resend.emails.send({
      from: getMailFromHeader(),
      to: [toEmail],
      subject: baslik,
      html: icerikHtml,
    });
  } catch (err) {
    console.error("Mail gönderim hatası:", err);
  }
}
