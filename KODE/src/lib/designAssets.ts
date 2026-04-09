import { getAuthenticatedUserId } from "@/lib/userIdentity";

export type DesignAsset = {
  id: string;
  user_id: string;
  original_filename: string;
  mime_type: string;
  file_url: string;
  storage_key: string;
  thumbnail_url?: string;
  created_at: string;
  checksum: string;
};

const getAuthHeaders = () => ({
  "Content-Type": "application/json",
  "x-user-id": getAuthenticatedUserId(),
});

export const uploadDesignAsset = async (payload: {
  fileName: string;
  dataUrl: string;
  mimeType?: string;
}) => {
  const response = await fetch("/api/design-assets", {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.error || "Failed to upload design asset");
  }
  const result = (await response.json()) as { asset: DesignAsset };
  return result.asset;
};

export const listDesignAssets = async () => {
  const response = await fetch("/api/design-assets", {
    headers: { "x-user-id": getAuthenticatedUserId() },
  });
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.error || "Failed to load design assets");
  }
  const result = (await response.json()) as { assets: DesignAsset[] };
  return result.assets;
};

export const getDesignAsset = async (id: string) => {
  const response = await fetch(`/api/design-assets/${encodeURIComponent(id)}`, {
    headers: { "x-user-id": getAuthenticatedUserId() },
  });
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.error || "Failed to load design asset");
  }
  const result = (await response.json()) as { asset: DesignAsset };
  return result.asset;
};
