import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { Resend } from "resend";
import { getMailFromHeader } from "@/lib/siteConfig";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export async function GET(request) {
  try {
    // 🛡️ Cron Job Güvenliği (Sadece yetkili zamanlayıcılar çağırabilsin)
    const authHeader = request.headers.get("authorization");
    if (
      process.env.CRON_SECRET &&
      authHeader !== `Bearer ${process.env.CRON_SECRET}`
    ) {
      return NextResponse.json(
        { success: false, error: "Yetkisiz Cron İsteği!" },
        { status: 401 },
      );
    }

    await dbConnect();

    const bugun = new Date();
    // Rolü 'developer' olmayan tüm aktif müşterileri çek
    const users = await User.find({
      rol: { $ne: "developer" },
      durum: "aktif",
    });

    let uyarilanMusteriSayisi = 0;

    for (const user of users) {
      if (!user.licenseEndDate) continue;

      const bitisTarihi = new Date(user.licenseEndDate);
      const kalanMilisaniye = bitisTarihi - bugun;
      const kalanGun = Math.ceil(kalanMilisaniye / (1000 * 60 * 60 * 24));

      // 🚨 Lisans süresine 30 gün veya daha az kalmışsa VE daha önce mail atılmadıysa
      if (kalanGun <= 30 && kalanGun > 0 && !user.licenseWarningSent) {
        if (resend && process.env.DEVELOPER_EMAIL) {
          await resend.emails.send({
            from: getMailFromHeader(),
            to: process.env.DEVELOPER_EMAIL,
            subject: `⚠️ LİSANS UYARISI: ${user.salonAdi || user.email} için ${kalanGun} Gün Kaldı!`,
            html: `
              <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; background-color: #f9fafb;">
                <h2 style="color: #d97706;">⚠️ Lisans Yenileme Hatırlatması</h2>
                <p>Müşterinizin yıllık lisans kullanım süresi dolmak üzeredir.</p>
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 15px 0;" />
                <p><strong>Müşteri / Salon:</strong> ${user.salonAdi || "Belirtilmedi"}</p>
                <p><strong>E-Posta:</strong> ${user.email}</p>
                <p><strong>Kalan Kullanım Süresi:</strong> <span style="color: #dc2626; font-weight: bold;">${kalanGun} Gün</span></p>
                <p><strong>Lisans Bitiş Tarihi:</strong> ${bitisTarihi.toLocaleDateString("tr-TR")}</p>
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 15px 0;" />
                <p>Lütfen müşteri ile iletişime geçerek yıllık lisans yenileme ücretini tahsil ediniz ve Geliştirici Panelinden lisans süresini uzatınız.</p>
              </div>
            `,
          });

          // Mail atıldığını işaretle ki her gece tekrar tekrar mail atmasın
          user.licenseWarningSent = true;
          await user.save();
          uyarilanMusteriSayisi++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Cron işlemi tamamlandı. ${uyarilanMusteriSayisi} müşteri için uyarı maili gönderildi.`,
    });
  } catch (error) {
    console.error("Cron Job Hata:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
