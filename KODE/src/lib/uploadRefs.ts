import type { PlacementDesign } from "@/components/design/PlacementStep";

const DB_NAME = "trykeksperten-upload-cache";
const DB_VERSION = 1;
const STORE_NAME = "uploads";
const UPLOAD_REF_PREFIX = "upload-ref:";
const INLINE_DATA_URL_LIMIT = 180_000;

type UploadRecord = {
  id: string;
  dataUrl: string;
  fileName: string;
  updatedAt: number;
};

const openDb = () =>
  new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB is not available"));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Failed to open IndexedDB"));
  });

const randomId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const getMimeFromDataUrl = (value: string) => {
  const match = /^data:([^;,]+)/i.exec(value);
  return (match?.[1] || "").toLowerCase();
};

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

const createFallbackPreview = (fileName: string) => {
  const safeName = fileName.replace(/[<>&"']/g, "_");
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='800' height='800' viewBox='0 0 800 800'>
    <rect width='800' height='800' fill='#f1f5f9'/>
    <rect x='80' y='120' width='640' height='520' rx='28' fill='none' stroke='#cbd5e1' stroke-width='12'/>
    <text x='400' y='390' text-anchor='middle' font-family='Arial, Helvetica, sans-serif' font-size='48' font-weight='700' fill='#334155'>Uploaded File</text>
    <text x='400' y='455' text-anchor='middle' font-family='Arial, Helvetica, sans-serif' font-size='22' fill='#64748b'>${safeName}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

const createLightPreviewDataUrl = async (dataUrl: string, fileName: string) => {
  const mime = getMimeFromDataUrl(dataUrl);
  if (!mime.startsWith("image/") || mime.includes("svg")) return createFallbackPreview(fileName);
  try {
    const img = await loadImage(dataUrl);
    const maxEdge = 900;
    const scale = Math.min(1, maxEdge / Math.max(img.width, img.height));
    const width = Math.max(1, Math.round(img.width * scale));
    const height = Math.max(1, Math.round(img.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return createFallbackPreview(fileName);
    ctx.drawImage(img, 0, 0, width, height);
    return canvas.toDataURL("image/jpeg", 0.82);
  } catch {
    return createFallbackPreview(fileName);
  }
};

export const isUploadRef = (value: string | null | undefined): value is string =>
  typeof value === "string" && value.startsWith(UPLOAD_REF_PREFIX);

export const isDataUrl = (value: string | null | undefined): value is string =>
  typeof value === "string" && value.startsWith("data:");

export const saveDataUrlAsUploadRef = async (dataUrl: string, fileName: string) => {
  if (!isDataUrl(dataUrl)) return dataUrl;
  try {
    const db = await openDb();
    const id = randomId();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const payload: UploadRecord = {
      id,
      dataUrl,
      fileName: fileName || "uploaded-file",
      updatedAt: Date.now(),
    };
    await new Promise<void>((resolve, reject) => {
      const request = store.put(payload);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error ?? new Error("Failed to write upload record"));
    });
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("Upload transaction failed"));
      tx.onabort = () => reject(tx.error ?? new Error("Upload transaction aborted"));
    });
    db.close();
    return `${UPLOAD_REF_PREFIX}${id}`;
  } catch {
    return dataUrl;
  }
};

export const resolveUploadRefToDataUrl = async (value: string | null | undefined) => {
  if (!value) return null;
  if (!isUploadRef(value)) return value;
  const id = value.slice(UPLOAD_REF_PREFIX.length);
  if (!id) return null;
  try {
    const db = await openDb();
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const result = await new Promise<UploadRecord | undefined>((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result as UploadRecord | undefined);
      request.onerror = () => reject(request.error ?? new Error("Failed to read upload record"));
    });
    db.close();
    return result?.dataUrl ?? null;
  } catch {
    return null;
  }
};

export const prepareDesignMapForCartStorage = async (designMap: Record<string, PlacementDesign[]>) => {
  const next: Record<string, PlacementDesign[]> = {};
  for (const [placementId, list] of Object.entries(designMap)) {
    const prepared = await Promise.all(
      list.map(async (design) => {
        if (!design?.file) return design;
        const sourceCandidate = design.uploadFile || design.file;
        const sourceRef = isDataUrl(sourceCandidate)
          ? await saveDataUrlAsUploadRef(sourceCandidate, design.fileName)
          : sourceCandidate;
        let preview = design.file;
        if (isDataUrl(preview) && preview.length > INLINE_DATA_URL_LIMIT) {
          preview = await createLightPreviewDataUrl(preview, design.fileName || "uploaded-file");
        }
        return {
          ...design,
          file: preview,
          uploadFile: sourceRef,
        };
      })
    );
    next[placementId] = prepared;
  }
  return next;
};
