import dbConnect from "@/lib/db";
import AuditLog from "@/models/AuditLog";
import Ogrenci from "@/models/Ogrenci";

export function getActorFromSession(session) {
  if (!session) {
    return {
      actorId: null,
      actorAdSoyad: "Bilinmeyen Kullanıcı",
      actorRol: "bilinmiyor",
    };
  }

  return {
    actorId: session.userId ? String(session.userId) : null,
    actorAdSoyad: session.adSoyad || session.email || "Kullanıcı",
    actorRol: session.rol || "salon_yoneticisi",
  };
}

/** Sistem geneli audit log kaydı */
export async function logAudit(session, payload) {
  await dbConnect();
  const actor = getActorFromSession(session);

  return AuditLog.create({
    actorId: actor.actorId,
    actorAdSoyad: actor.actorAdSoyad,
    actorRol: actor.actorRol,
    action: payload.action,
    entityType: payload.entityType,
    entityId: payload.entityId ? String(payload.entityId) : null,
    entityLabel: payload.entityLabel || "",
    detay: payload.detay,
    metadata: payload.metadata || {},
  });
}

/** Öğrenci embedded log + global audit birlikte */
export async function logOgrenciIslem(session, ogrenciId, { islemTipi, detay, entityLabel, metadata }) {
  await dbConnect();

  const yeniLog = {
    islemTipi,
    detay,
    tarih: new Date(),
  };

  await Ogrenci.findByIdAndUpdate(ogrenciId, {
    $push: { islemGecmisi: yeniLog },
  });

  return logAudit(session, {
    action: islemTipi,
    entityType: "Ogrenci",
    entityId: ogrenciId,
    entityLabel: entityLabel || "",
    detay,
    metadata,
  });
}

/** Alan değişikliklerini okunabilir diff'e çevirir */
export function buildDiffDetay(eski, yeni, alanlar) {
  const degisiklikler = [];

  for (const alan of alanlar) {
    const eskiVal = eski?.[alan];
    const yeniVal = yeni?.[alan];
    if (JSON.stringify(eskiVal) !== JSON.stringify(yeniVal)) {
      degisiklikler.push(`${alan}: '${eskiVal ?? "-"}' → '${yeniVal ?? "-"}'`);
    }
  }

  return degisiklikler.length > 0
    ? degisiklikler.join("; ")
    : "Değişiklik yapılmadı";
}
