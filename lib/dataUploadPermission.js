import dbConnect from "@/lib/db";
import User from "@/models/User";
import { getAktifKurumSalon } from "@/lib/kurumConfig";

const UPLOAD_GRANT_MS = 72 * 60 * 60 * 1000; // 72 saat

export function getDataUploadGrantDurationMs() {
  return UPLOAD_GRANT_MS;
}

export async function hasActiveDataUploadPermission(salonId) {
  if (!salonId) {
    const salon = await getAktifKurumSalon();
    salonId = salon?._id;
  }
  if (!salonId) return false;

  await dbConnect();
  const now = new Date();
  const yetkili = await User.findOne({
    salonId,
    rol: { $ne: "developer" },
    durum: "aktif",
    dataUploadAccessGrantedUntil: { $gt: now },
  }).select("_id dataUploadAccessGrantedUntil");

  return Boolean(yetkili);
}

export async function grantDataUploadPermission(userId) {
  await dbConnect();
  const until = new Date(Date.now() + UPLOAD_GRANT_MS);
  const user = await User.findByIdAndUpdate(
    userId,
    { dataUploadAccessGrantedUntil: until },
    { new: true },
  );
  return { until, user };
}

export async function getDataUploadPermissionStatus(userId) {
  await dbConnect();
  const user = await User.findById(userId).select(
    "dataUploadAccessGrantedUntil salonId",
  );
  if (!user) return { aktif: false, bitis: null };

  const now = new Date();
  const aktif =
    user.dataUploadAccessGrantedUntil &&
    new Date(user.dataUploadAccessGrantedUntil) > now;

  return {
    aktif: Boolean(aktif),
    bitis: user.dataUploadAccessGrantedUntil,
  };
}
