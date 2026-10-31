import { apiFetch, type ApiItemResponse } from "./client";
import { API_BASE_URL } from "./config";

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
  variant: "original" | "thumbnail" = "original"
): string | null {
  if (!id) return null;
  if (/^(https?:|blob:|data:)/i.test(id)) return id;
  const trimmed = id.replace(/^\//, "");
  return variant === "thumbnail"
    ? `${FILE_BASE_URL}/thumbnail/${trimmed}`
    : `${FILE_BASE_URL}/${trimmed}`;
}

/** Uploads one image (`POST /file/upload`) and returns its file id. */
export async function uploadFile(file: File): Promise<string> {
  const body = new FormData();
  body.append("file", file);
  const res = await apiFetch<ApiItemResponse<{ id: string } | null>>("/file/upload", { method: "POST", body });
  if (!res.data?.id) throw new Error(res.message);
  return res.data.id;
}
