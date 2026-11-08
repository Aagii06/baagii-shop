import { apiFetch, type ApiItemResponse } from "./client";
import { API_BASE_URL } from "./config";
import { tr } from "@/lib/i18n/translations";

// Images are served by ../backend at `NEXT_PUBLIC_FILE_URL` (`/file/{id}`,
// `/file/thumbnail/{id}`). The old file service, behind the eshop gateway:
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

const FILE_BASE_URL = deriveFileBaseUrl();

/** Resolves a raw file id from the API to a file-service URL. */
export function fileUrl(
  id: string | null | undefined,
  variant: "original" | "thumbnail" | "grid" | "icon" = "original"
): string | null {
  const value = id?.trim();
  if (!value || value === "null" || value === "undefined") return null;
  if (/^(https?:|blob:|data:)/i.test(value)) return value;
  const trimmed = value.replace(/^\//, "");
  // Sizes (backend helper/fileHelper.js): icon — 128px (boxes ≤64px), thumbnail — 300px (≤150px),
  // grid — 600px (product cards), original — up to 800px (each fits a square box, aspect kept). A missing size falls back to a larger one.
  return variant === "original" ? `${FILE_BASE_URL}/${trimmed}` : `${FILE_BASE_URL}/${variant}/${trimmed}`;
}

/** The backend's `public/uploads/<folder>` an image is saved in (one per model). */
export type UploadFolder = "products" | "stores" | "users" | "blogs";

/** Largest image the backend takes (`api/file/router.js` maxFileSize); it then shrinks it. */
export const MAX_IMAGE_MB = 50;

/** The error to show for a picked image over `MAX_IMAGE_MB`, or `null` if it's fine. */
export function imageSizeError(file: File): string | null {
  if (file.size <= MAX_IMAGE_MB * 1024 * 1024) return null;
  return tr("img.tooLarge", { name: file.name, size: (file.size / 1024 / 1024).toFixed(1), max: MAX_IMAGE_MB });
}

/** Uploads one image (`POST /file/upload`) into `folder` and returns its file id. */
export async function uploadFile(file: File, folder: UploadFolder): Promise<string> {
  const tooLarge = imageSizeError(file);
  if (tooLarge) throw new Error(tooLarge);
  const body = new FormData();
  body.append("folder", folder);
  body.append("file", file);
  const res = await apiFetch<ApiItemResponse<{ id: string } | null>>("/file/upload", { method: "POST", body });
  if (!res.data?.id) throw new Error(res.message);
  return res.data.id;
}
