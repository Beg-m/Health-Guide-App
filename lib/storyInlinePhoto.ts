import * as ImageManipulator from "expo-image-manipulator";
import { prepareLocalFileUri } from "@/lib/uploadLocalFileBytes";

/** Firestore belge limiti (~1 MiB); caption + alanlar için pay bırakılır */
const MAX_DATA_URL_LENGTH = 850_000;

export function isStorageUploadFailure(err: unknown): boolean {
  const code =
    err && typeof err === "object" && "code" in err
      ? String((err as { code: string }).code)
      : "";
  const message =
    err && typeof err === "object" && "message" in err
      ? String((err as { message: string }).message)
      : "";
  return (
    code.includes("storage") ||
    message.includes("Storage") ||
    message.includes("storage")
  );
}

/** Firebase Storage yokken JPEG data URL (Firestore'da mediaURL) */
export async function compressPhotoToDataUrl(localUri: string): Promise<string> {
  const uri = await prepareLocalFileUri(localUri);
  let width = 720;
  let quality = 0.72;

  for (let attempt = 0; attempt < 6; attempt++) {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width } }],
      {
        compress: quality,
        format: ImageManipulator.SaveFormat.JPEG,
        base64: true,
      }
    );

    if (!result.base64) {
      throw new Error("Fotoğraf sıkıştırılamadı");
    }

    const dataUrl = `data:image/jpeg;base64,${result.base64}`;
    if (dataUrl.length <= MAX_DATA_URL_LENGTH) {
      return dataUrl;
    }

    width = Math.round(width * 0.8);
    quality = Math.max(0.35, quality - 0.12);
  }

  throw new Error(
    "Fotoğraf çok büyük. Daha küçük bir görsel seçin veya Firebase Console'da Storage'ı açın."
  );
}
