import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { getBrandingBySalonId } from "@/lib/branding";
import { sendLicenseReminderEmails } from "@/lib/mail";
import { calculateRemainingLicenseDays } from "@/lib/license";

export async function GET(request) {
  try {
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
    const users = await User.find({
      rol: { $ne: "developer" },
      durum: "aktif",
    });

    let uyarilanMusteriSayisi = 0;
    let musteriMailSayisi = 0;

    for (const user of users) {
      if (!user.licenseEndDate) continue;

      const bitisTarihi = new Date(user.licenseEndDate);
      const kalanGun = calculateRemainingLicenseDays(user.licenseEndDate, bugun);

      if (kalanGun <= 30 && kalanGun > 0) {
        const salonBranding = user.salonId
          ? await getBrandingBySalonId(user.salonId)
          : null;

        const mailGerekli =
          !user.licenseWarningSent || !user.licenseCustomerReminderSent;

        if (mailGerekli) {
          const mailSonuc = await sendLicenseReminderEmails({
            salonBranding,
            user,
            kalanGun,
            bitisTarihi,
          });

          if (mailSonuc.developer && !user.licenseWarningSent) {
            user.licenseWarningSent = true;
          }
          if (mailSonuc.customer && !user.licenseCustomerReminderSent) {
            user.licenseCustomerReminderSent = true;
            musteriMailSayisi++;
          }

          if (mailSonuc.developer || mailSonuc.customer) {
            await user.save();
            uyarilanMusteriSayisi++;
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Cron tamamlandı. ${uyarilanMusteriSayisi} hesap işlendi, ${musteriMailSayisi} müşteri hatırlatması gönderildi.`,
    });
  } catch (error) {
    console.error("Cron Job Hata:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
