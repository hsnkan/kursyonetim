/**
 * Legacy NFC alanlarını nfcKartId'ye taşır.
 * Kullanım: node scripts/migrate-nfc-fields.js
 */
import dbConnect from "../lib/db.js";
import Ogrenci from "../models/Ogrenci.js";
import { normalizeNfcId } from "../lib/nfc.js";

async function main() {
  await dbConnect();

  const tumOgrenciler = await Ogrenci.find({});
  let guncellenen = 0;

  for (const o of tumOgrenciler) {
    if (o.nfcKartId) continue;
    const legacy = o.cardId || o.nfcId;
    if (!legacy) continue;

    const normalized = normalizeNfcId(legacy);
    if (!normalized) continue;

    o.nfcKartId = normalized;
    await o.save();
    guncellenen++;
    console.log(`✓ ${o.adSoyad}: ${legacy} → ${normalized}`);
  }

  console.log(`\nToplam ${guncellenen} öğrenci migrate edildi.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
