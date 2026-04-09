import express from "express";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import nodemailer from "nodemailer";

const app = express();
const port = Number(process.env.QUOTE_API_PORT || 8787);
const uploadsRoot = path.resolve(process.cwd(), "uploads");
const designAssetsRoot = path.join(uploadsRoot, "design-assets");
const designAssetsIndexPath = path.join(designAssetsRoot, "index.json");

app.use(express.json({ limit: "50mb" }));
app.use("/uploads", express.static(uploadsRoot));

const sanitizeFileName = (name) =>
  name
    .normalize("NFKD")
    .replace(/[^\w.\-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 180) || "design-file";

const inferExtension = (mimeType = "", fallbackName = "") => {
  const fromMime =
    mimeType === "image/png"
      ? ".png"
      : mimeType === "image/svg+xml"
      ? ".svg"
      : mimeType === "image/jpeg"
      ? ".jpg"
      : "";

  if (fromMime) return fromMime;
  const ext = path.extname(fallbackName).toLowerCase();
  if (ext === ".png" || ext === ".svg" || ext === ".jpg" || ext === ".jpeg") return ext;
  return ".bin";
};

const parseDataUrl = (dataUrl) => {
  const match = /^data:([^;,]+)?(?:;charset=[^;,]+)?;base64,(.+)$/i.exec(dataUrl || "");
  if (!match) return null;
  const mimeType = (match[1] || "application/octet-stream").toLowerCase();
  const buffer = Buffer.from(match[2], "base64");
  return { mimeType, buffer };
};

const allowedAssetMimeTypes = new Set([
  "image/png",
  "image/svg+xml",
  "image/jpeg",
]);

const allowedAssetExtensions = new Set([".png", ".svg", ".jpg", ".jpeg"]);

const ensureDir = async (dir) => {
  await fs.mkdir(dir, { recursive: true });
};

const safeUserId = (value = "") =>
  String(value)
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);

const resolveUserId = (req) => {
  const headerUser = req.get("x-user-id") || "";
  if (headerUser) return safeUserId(headerUser);
  const auth = req.get("authorization") || "";
  const bearer = auth.match(/^Bearer\s+(.+)$/i);
  if (bearer?.[1]) return safeUserId(bearer[1]);
  return "";
};

const readDesignAssetsIndex = async () => {
  try {
    const raw = await fs.readFile(designAssetsIndexPath, "utf8");
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.assets)) {
      return { assets: [] };
    }
    return {
      assets: parsed.assets.filter((asset) => asset && typeof asset === "object"),
    };
  } catch {
    return { assets: [] };
  }
};

const writeDesignAssetsIndex = async (index) => {
  await ensureDir(designAssetsRoot);
  await fs.writeFile(designAssetsIndexPath, JSON.stringify(index, null, 2), "utf8");
};

const getDesignAssetUrl = (req, storageKey) => {
  const baseUrl = createPublicBaseUrl(req);
  return `${baseUrl}/uploads/${storageKey.split(path.sep).map(encodeURIComponent).join("/")}`;
};

const normalizeStorageKey = (value = "") => value.split(/[\\/]+/).join("/");

app.post("/api/design-assets", async (req, res) => {
  try {
    const userId = resolveUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Missing authenticated user." });
    }

    const { fileName, dataUrl, mimeType } = req.body || {};
    const parsed = parseDataUrl(dataUrl);
    if (!parsed) {
      return res.status(400).json({ error: "Invalid upload format. Expected data URL." });
    }

    const normalizedMime = (mimeType || parsed.mimeType || "").toLowerCase();
    const ext = inferExtension(normalizedMime, fileName || "asset");
    if (!allowedAssetMimeTypes.has(normalizedMime) && !allowedAssetExtensions.has(ext)) {
      return res.status(400).json({ error: "Unsupported file type." });
    }
    if (parsed.buffer.length === 0) {
      return res.status(400).json({ error: "Uploaded file is empty." });
    }

    const checksum = crypto.createHash("sha256").update(parsed.buffer).digest("hex");
    const index = await readDesignAssetsIndex();
    const existing = index.assets.find(
      (asset) => asset.user_id === userId && asset.checksum === checksum
    );

    if (existing) {
      return res.status(200).json({
        asset: {
          ...existing,
          file_url: getDesignAssetUrl(req, existing.storage_key),
          thumbnail_url: existing.thumbnail_key
            ? getDesignAssetUrl(req, existing.thumbnail_key)
            : getDesignAssetUrl(req, existing.storage_key),
        },
      });
    }

    const assetId = `asset-${crypto.randomUUID()}`;
    const safeFileName = sanitizeFileName(fileName || "design-file");
    const userFolder = path.join(designAssetsRoot, userId);
    await ensureDir(userFolder);
    const storageFileName = `${assetId}${ext || ".png"}`;
    const absolutePath = path.join(userFolder, storageFileName);
    await fs.writeFile(absolutePath, parsed.buffer);

    const storageKey = normalizeStorageKey(path.relative(uploadsRoot, absolutePath));
    const now = new Date().toISOString();
    const created = {
      id: assetId,
      user_id: userId,
      original_filename: safeFileName,
      mime_type: normalizedMime || parsed.mimeType,
      storage_key: storageKey,
      thumbnail_key: storageKey,
      created_at: now,
      checksum,
    };
    index.assets.push(created);
    await writeDesignAssetsIndex(index);

    return res.status(201).json({
      asset: {
        ...created,
        file_url: getDesignAssetUrl(req, created.storage_key),
        thumbnail_url: getDesignAssetUrl(req, created.thumbnail_key),
      },
    });
  } catch (error) {
    console.error("Design asset upload error:", error);
    return res.status(500).json({ error: "Server error while storing design asset." });
  }
});

app.get("/api/design-assets", async (req, res) => {
  try {
    const userId = resolveUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Missing authenticated user." });
    }
    const index = await readDesignAssetsIndex();
    const assets = index.assets
      .filter((asset) => asset.user_id === userId)
      .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
      .map((asset) => ({
        id: asset.id,
        user_id: asset.user_id,
        original_filename: asset.original_filename,
        mime_type: asset.mime_type,
        storage_key: asset.storage_key,
        file_url: getDesignAssetUrl(req, asset.storage_key),
        thumbnail_url: asset.thumbnail_key
          ? getDesignAssetUrl(req, asset.thumbnail_key)
          : getDesignAssetUrl(req, asset.storage_key),
        created_at: asset.created_at,
        checksum: asset.checksum,
      }));
    return res.status(200).json({ assets });
  } catch (error) {
    console.error("Design asset list error:", error);
    return res.status(500).json({ error: "Server error while loading design assets." });
  }
});

app.get("/api/design-assets/:id", async (req, res) => {
  try {
    const userId = resolveUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Missing authenticated user." });
    }
    const id = String(req.params.id || "");
    const index = await readDesignAssetsIndex();
    const asset = index.assets.find((entry) => entry.id === id && entry.user_id === userId);
    if (!asset) return res.status(404).json({ error: "Asset not found." });
    return res.status(200).json({
      asset: {
        id: asset.id,
        user_id: asset.user_id,
        original_filename: asset.original_filename,
        mime_type: asset.mime_type,
        storage_key: asset.storage_key,
        file_url: getDesignAssetUrl(req, asset.storage_key),
        thumbnail_url: asset.thumbnail_key
          ? getDesignAssetUrl(req, asset.thumbnail_key)
          : getDesignAssetUrl(req, asset.storage_key),
        created_at: asset.created_at,
        checksum: asset.checksum,
      },
    });
  } catch (error) {
    console.error("Design asset fetch error:", error);
    return res.status(500).json({ error: "Server error while loading design asset." });
  }
});

const getTransporter = () => {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = String(process.env.SMTP_SECURE || "false") === "true";

  if (!host || !user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
};

const createPublicBaseUrl = (req) =>
  process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get("host")}`;

app.post("/api/quote-request", async (req, res) => {
  try {
    const { customer, order, files, mockups, cartItems, lang } = req.body || {};
    const normalizedFiles = Array.isArray(files) ? files : [];
    if (!customer?.name || !customer?.email) {
      return res.status(400).json({ error: "Missing customer name or email." });
    }
    if (!order?.productId || !order?.quantity) {
      return res.status(400).json({ error: "Missing order details." });
    }

    const requestId = `quote-${new Date().toISOString().slice(0, 10)}-${crypto.randomUUID().slice(0, 8)}`;
    const requestFolder = path.join(uploadsRoot, requestId);
    const logosFolder = path.join(requestFolder, "logos");
    const mockupsFolder = path.join(requestFolder, "mockups");
    await fs.mkdir(requestFolder, { recursive: true });
    if (normalizedFiles.length > 0) {
      await fs.mkdir(logosFolder, { recursive: true });
    }
    await fs.mkdir(mockupsFolder, { recursive: true });

    const baseUrl = createPublicBaseUrl(req);
    const storedFiles = [];
    const storedMockups = [];

    for (const [index, file] of normalizedFiles.entries()) {
      const parsed = parseDataUrl(file?.dataUrl);
      if (!parsed) {
        return res.status(400).json({ error: "Invalid upload format. Expected data URL." });
      }
      const inputExt = path.extname(String(file?.fileName || "")).toLowerCase();
      const inputMime = String(parsed.mimeType || "").toLowerCase();
      if (!allowedAssetMimeTypes.has(inputMime) && !allowedAssetExtensions.has(inputExt)) {
        return res.status(400).json({ error: "Unsupported file type. Allowed: PNG, SVG, JPEG." });
      }

      const ext = inferExtension(parsed.mimeType, file?.fileName);
      const baseName = sanitizeFileName(path.basename(file?.fileName || "design-file", path.extname(file?.fileName || "")));
      const filename = `${String(index + 1).padStart(2, "0")}-${sanitizeFileName(file?.cartItemId || "item")}-${baseName}${ext}`;
      const absolute = path.join(logosFolder, filename);

      await fs.writeFile(absolute, parsed.buffer);
      storedFiles.push({
        cartItemId: file?.cartItemId || "",
        productId: file?.productId || "",
        productName: file?.productName || "",
        colorValue: file?.colorValue || "",
        colorName: file?.colorName || "",
        placementId: file?.placementId || "unknown",
        placementLabel: file?.placementLabel || file?.placementId || "Unknown",
        sizeCategory: file?.sizeCategory || "",
        fileName: filename,
        url: `${baseUrl}/uploads/${requestId}/logos/${encodeURIComponent(filename)}`,
      });
    }

    if (Array.isArray(mockups)) {
      for (const [index, mockup] of mockups.entries()) {
        const parsed = parseDataUrl(mockup?.dataUrl);
        if (!parsed) continue;
        const ext = inferExtension(parsed.mimeType, mockup?.fileName || "mockup.png");
        const baseName = sanitizeFileName(path.basename(mockup?.fileName || "mockup", path.extname(mockup?.fileName || "")));
        const filename = `${String(index + 1).padStart(2, "0")}-${sanitizeFileName(mockup?.cartItemId || "item")}-${baseName}${ext}`;
        const absolute = path.join(mockupsFolder, filename);
        await fs.writeFile(absolute, parsed.buffer);
        storedMockups.push({
          cartItemId: mockup?.cartItemId || "",
          productId: mockup?.productId || "",
          productName: mockup?.productName || "",
          colorValue: mockup?.colorValue || "",
          colorName: mockup?.colorName || "",
          placementId: mockup?.placementId || "unknown",
          placementLabel: mockup?.placementLabel || mockup?.placementId || "Unknown",
          fileName: filename,
          url: `${baseUrl}/uploads/${requestId}/mockups/${encodeURIComponent(filename)}`,
        });
      }
    }

    const metadata = {
      requestId,
      createdAt: new Date().toISOString(),
      lang: lang || "da",
      customer,
      order,
      cartItems: Array.isArray(cartItems) ? cartItems : [],
      files: storedFiles,
      mockups: storedMockups,
    };
    await fs.writeFile(path.join(requestFolder, "request.json"), JSON.stringify(metadata, null, 2), "utf8");

    const transporter = getTransporter();
    if (!transporter) {
      return res.status(500).json({
        error: "SMTP is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS and SMTP_FROM.",
      });
    }

    const recipients = ["joakim@trykeksperten.dk", "kontakt@trykeksperten.dk", "ordre@trykeksperten.dk"];
    const from = process.env.SMTP_FROM || "Trykeksperten <noreply@trykeksperten.dk>";
    const normalizedCartItems = Array.isArray(cartItems) ? cartItems : [];

    const fileLines =
      storedFiles.length > 0
        ? storedFiles
            .map(
              (file, index) =>
                `${index + 1}. ${file.productName || file.productId} · ${file.colorName || file.colorValue} · ${file.placementLabel} (${file.sizeCategory}) - ${file.fileName}\n${file.url}`
            )
            .join("\n\n")
        : "Ingen uploadede designfiler";
    const mockupLines = storedMockups
      .map(
        (mockup, index) =>
          `${index + 1}. ${mockup.productName || mockup.productId} · ${mockup.colorName || mockup.colorValue} · ${mockup.placementLabel} - ${mockup.fileName}\n${mockup.url}`
      )
      .join("\n\n");

    const cartLines =
      normalizedCartItems.length === 0
        ? `Produkt: ${order.productName || order.productId}\nFarve: ${order.colorName || order.colorValue || ""}\nAntal: ${order.quantity}`
        : normalizedCartItems
            .map((item, index) => {
              const sizes = item?.sizeBreakdown
                ? Object.entries(item.sizeBreakdown)
                    .map(([size, qty]) => `${size}: ${qty}`)
                    .join(", ")
                : "";
              const placements = Array.isArray(item?.placements) ? item.placements.join(", ") : "";
              const logoDetails = Array.isArray(item?.logoItems)
                ? item.logoItems
                    .map(
                      (logo, logoIndex) =>
                        `  - Logo ${logoIndex + 1}: ${logo.placementId}, pos(${Number(logo?.pos?.x || 0)}, ${Number(logo?.pos?.y || 0)}), scale ${Number(logo?.scale || 0).toFixed(3)}, interval ${logo?.sizeCategory || ""}`
                    )
                    .join("\n")
                : "";
              return [
                `${index + 1}. ${item.productName || item.productId}`,
                `Farve: ${item.colorName || item.colorValue || ""}`,
                `Antal: ${item.quantity || 0}`,
                `Størrelser: ${sizes}`,
                `Placeringer: ${placements}`,
                `Logoer: ${item.logoCount || 0}`,
                logoDetails ? `Logo detaljer:\n${logoDetails}` : "",
              ]
                .filter(Boolean)
                .join("\n");
            })
            .join("\n\n");

    const subject = `Ny tilbudsforespørgsel (${requestId}) - ${order.productName || order.productId}`;
    const text = `
Ny tilbudsforespørgsel
Request ID: ${requestId}

Kundeoplysninger
Navn: ${customer.name || ""}
Email: ${customer.email || ""}
Telefon: ${customer.phone || ""}
Virksomhed: ${customer.company || ""}
Adresse: ${customer.address || ""}
Noter: ${customer.notes || ""}

Ordredetaljer (kurv)
${cartLines}

Prisestimat
Tøj i alt: ${Number(order?.pricing?.garmentTotal || 0).toLocaleString("da-DK")} DKK
Designopsætning i alt: ${Number(order?.pricing?.setupTotal || 0).toLocaleString("da-DK")} DKK
Tryk i alt: ${Number(order?.pricing?.printTotal || 0).toLocaleString("da-DK")} DKK
Estimeret total (inkl. moms): ${Number(order?.pricing?.totalIncVat || 0).toLocaleString("da-DK")} DKK
Pris ekskl. moms: ${Number(order?.pricing?.totalExVat || 0).toLocaleString("da-DK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DKK
Designopsætning pr. placering/logo i ordren: første 299 DKK, ekstra 150 DKK

Download links
${fileLines}

Mockup links
${mockupLines || "Ingen mockups genereret"}
`.trim();

    await transporter.sendMail({
      from,
      to: recipients.join(", "),
      replyTo: customer.email,
      subject,
      text,
    });

    return res.status(200).json({
      ok: true,
      requestId,
      files: storedFiles,
      mockups: storedMockups,
    });
  } catch (error) {
    console.error("Quote request error:", error);
    return res.status(500).json({ error: "Server error while processing quote request." });
  }
});

app.listen(port, () => {
  console.log(`Quote API listening on http://localhost:${port}`);
});
