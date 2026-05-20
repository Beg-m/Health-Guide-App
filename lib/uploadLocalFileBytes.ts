import {
  cacheDirectory,
  copyAsync,
  getInfoAsync,
  readAsStringAsync,
} from "expo-file-system/legacy";

function base64ToUint8Array(base64: string): Uint8Array {
  const normalized = base64.replace(/\s/g, "");
  const atobFn = globalThis.atob;
  if (typeof atobFn !== "function") {
    throw new Error("Base64 çözümleme desteklenmiyor");
  }
  const binary = atobFn(normalized);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/** iOS galeri URI'lerini güvenilir file:// yoluna kopyalar. */
export async function prepareLocalFileUri(localUri: string): Promise<string> {
  if (!localUri) throw new Error("Dosya yolu yok");

  try {
    const info = await getInfoAsync(localUri);
    if (info.exists && localUri.startsWith("file://")) {
      return localUri;
    }
  } catch {
    /* kopyalamaya devam */
  }

  if (!cacheDirectory) return localUri;

  const lower = localUri.split("?")[0].toLowerCase();
  const ext = lower.endsWith(".png")
    ? "png"
    : lower.endsWith(".heic") || lower.endsWith(".heif")
      ? "heic"
      : lower.endsWith(".mov")
        ? "mov"
        : lower.endsWith(".mp4")
          ? "mp4"
          : "jpg";
  const dest = `${cacheDirectory}upload-${Date.now()}.${ext}`;
  await copyAsync({ from: localUri, to: dest });
  return dest;
}

/**
 * React Native'de Blob / uploadString kullanmadan yerel dosyayı byte dizisine çevirir.
 */
export async function readLocalFileBytes(localUri: string): Promise<Uint8Array> {
  const uri = await prepareLocalFileUri(localUri);

  try {
    const response = await fetch(uri);
    if (response.ok) {
      const buffer = await response.arrayBuffer();
      if (buffer.byteLength > 0) {
        return new Uint8Array(buffer);
      }
    }
  } catch (fetchErr) {
    console.warn("[upload] fetch ile okuma başarısız:", fetchErr);
  }

  const base64 = await readAsStringAsync(uri, { encoding: "base64" });
  if (!base64?.length) {
    throw new Error("Dosya okunamadı veya boş");
  }
  return base64ToUint8Array(base64);
}
