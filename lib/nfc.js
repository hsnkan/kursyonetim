/** NFC kart ID normalizasyonu — tek canonical alan: nfcKartId */
export function normalizeNfcId(raw) {
  if (raw == null || String(raw).trim() === "") return null;
  const hamId = String(raw).trim();
  const temizId = hamId.replace(/[^a-zA-Z0-9]/g, "");
  return temizId.replace(/^0+/, "") || temizId;
}

function hexToDecimalVariants(hexClean) {
  if (!hexClean || !/^[0-9a-fA-F]+$/.test(hexClean)) return [];

  const variants = [];
  const toDecimal = (hex) => {
    try {
      return BigInt(`0x${hex}`).toString(10);
    } catch {
      return null;
    }
  };

  const direct = toDecimal(hexClean);
  if (direct) variants.push(direct);

  const pairs = hexClean.match(/.{1,2}/g);
  if (pairs && pairs.length > 1) {
    const reversed = pairs.reverse().join("");
    const revDecimal = toDecimal(reversed);
    if (revDecimal) variants.push(revDecimal);
  }

  return variants;
}

/** USB okuyucu (ondalık) ile telefon NFC (hex UID) farklı format üretebilir */
export function buildNfcSearchValues(raw) {
  const hamId = String(raw || "").trim();
  const temizId = normalizeNfcId(hamId);
  const hexOnly = hamId.replace(/[^0-9a-fA-F]/g, "");
  const hexVariants = hexToDecimalVariants(hexOnly);

  return Array.from(
    new Set(
      [
        hamId,
        temizId,
        hamId.toLowerCase(),
        temizId?.toLowerCase(),
        hexOnly,
        hexOnly.toLowerCase(),
        hexOnly.toUpperCase(),
        ...hexVariants,
      ].filter(Boolean),
    ),
  );
}

export function buildNfcLookupQuery(raw) {
  const values = buildNfcSearchValues(raw);
  return {
    $or: [
      { nfcKartId: { $in: values } },
      { cardId: { $in: values } },
      { nfcId: { $in: values } },
    ],
  };
}

/** Legacy cardId/nfcId → nfcKartId taşıma */
export async function migrateLegacyNfcField(ogrenciDoc) {
  if (!ogrenciDoc || ogrenciDoc.nfcKartId) return ogrenciDoc;

  const legacy = ogrenciDoc.cardId || ogrenciDoc.nfcId;
  if (!legacy) return ogrenciDoc;

  const normalized = normalizeNfcId(legacy);
  if (!normalized) return ogrenciDoc;

  ogrenciDoc.nfcKartId = normalized;
  await ogrenciDoc.save();
  return ogrenciDoc;
}

export async function findOgrenciByNfc(Ogrenci, rawCardId) {
  const ogrenci = await Ogrenci.findOne(buildNfcLookupQuery(rawCardId));
  if (!ogrenci) return null;
  return migrateLegacyNfcField(ogrenci);
}

/** Web NFC serialNumber → arama için ham değer */
export function formatWebNfcSerial(serialNumber) {
  if (!serialNumber) return "";
  return String(serialNumber).trim();
}
