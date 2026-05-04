/**
 * Normalize a gallery / filesystem URI so React Native Image can load it.
 */
export function displayImageUri(uri: string | undefined | null): string | undefined {
  if (uri == null) return undefined;
  const u = String(uri).trim();
  if (!u) return undefined;
  if (
    u.startsWith("file://") ||
    u.startsWith("content://") ||
    u.startsWith("http://") ||
    u.startsWith("https://") ||
    u.startsWith("data:") ||
    u.startsWith("asset:/") ||
    u.startsWith("ph://")
  ) {
    return u;
  }
  if (u.startsWith("/")) {
    return `file://${u}`;
  }
  return u;
}
