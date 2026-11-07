import { API_BASE_URL } from "./config";

// The file service sits behind the same gateway as eshop-service:
//   <origin>/api/file/file/{id}            – original image
//   <origin>/api/file/file/thumbnail/{id}  – resized thumbnail
// `NEXT_PUBLIC_FILE_URL` overrides the derived base (no trailing slash).
function deriveFileBaseUrl(): string {
  const override = process.env.NEXT_PUBLIC_FILE_URL;
  if (override) return override.replace(/\/$/, "");
  try {
    return `${new URL(API_BASE_URL).origin}/api/file/file`;
  } catch {
    return "/api/file/file";
  }
}

export const FILE_BASE_URL = deriveFileBaseUrl();

/**
 * Builds a file-service URL from a raw file id. An id that is already an
 * absolute URL (or a blank value) is passed through / nulled out so callers
 * can hand it whatever the backend gave them.
 */
export function fileUrl(
  id: string | null | undefined,
  variant: "original" | "thumbnail" | "grid" | "icon" = "original"
): string | null {
  const value = id?.trim();
  if (!value || value === "null" || value === "undefined") return null;
  if (/^(https?:|blob:|data:)/i.test(value)) return value;
  const trimmed = value.replace(/^\//, "");
  // thumbnail — 400px, grid — 600px, icon — 128px (stores/users logo); a missing size falls back to the original
  return variant === "original" ? `${FILE_BASE_URL}/${trimmed}` : `${FILE_BASE_URL}/${variant}/${trimmed}`;
}

/** Shorthand for `fileUrl(id, "thumbnail")`. */
export function fileThumbnailUrl(id: string | null | undefined): string | null {
  return fileUrl(id, "thumbnail");
}
