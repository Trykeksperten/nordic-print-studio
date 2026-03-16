#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const cwd = process.cwd();
const publicDir = path.resolve(cwd, "public");
const outTs = path.resolve(cwd, "src/lib/autoFolderProductVariants.ts");

const IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);

const normalize = (value) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ß/g, "ss")
    .toLowerCase()
    .trim();

const slugify = (value) =>
  normalize(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const titleCase = (value) =>
  value
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const COLOR_META = [
  { aliases: ["sort", "black"], value: "black", da: "Sort", en: "Black", hex: "#111827", priority: 10 },
  { aliases: ["hvid", "white"], value: "white", da: "Hvid", en: "White", hex: "#F7F7F5", priority: 10 },
  { aliases: ["brown", "brun"], value: "brown", da: "Brun", en: "Brown", hex: "#8B6F57", priority: 10 },
  { aliases: ["light asphalt", "asphalt"], value: "light-asphalt", da: "Light Asfalt", en: "Light Asphalt", hex: "#9CA3AF", priority: 10 },
  { aliases: ["soft pink", "pink"], value: "soft-pink", da: "Soft Pink", en: "Soft Pink", hex: "#F3CBD8", priority: 10 },
  { aliases: ["navy", "french navy"], value: "french-navy", da: "French Navy", en: "French Navy", hex: "#3B4557", priority: 10 },
  { aliases: ["grey", "gray", "gra"], value: "grey", da: "Grå", en: "Grey", hex: "#9CA3AF", priority: 10 },
];

const ORDERED_VALUES = [
  "black",
  "white",
  "brown",
  "light-asphalt",
  "soft-pink",
  "french-navy",
  "grey",
];

const KEYWORDS = {
  front: ["front", "for", "forfra", "p1"],
  left: ["venstre", "left", "left sleeve", "left-sleeve"],
  right: ["hojre", "højre", "right", "right sleeve", "right-sleeve", "p3"],
  back: ["bag", "back", "ryg"],
};

const lookupByAlias = new Map();
for (const color of COLOR_META) {
  for (const alias of color.aliases) {
    lookupByAlias.set(normalize(alias), color);
  }
}

const sortVariants = (variants) =>
  variants.sort((a, b) => {
    const ai = ORDERED_VALUES.indexOf(a.value);
    const bi = ORDERED_VALUES.indexOf(b.value);
    if (ai !== -1 && bi !== -1) return ai - bi;
    if (ai !== -1) return -1;
    if (bi !== -1) return 1;
    return a.da.localeCompare(b.da, "da");
  });

const byOrderPreference = (files, buckets) => {
  for (const key of buckets) {
    const match = files.find((name) => normalize(name).includes(key));
    if (match) return match;
  }
  return undefined;
};

const pickImageSet = (files) => {
  const normalized = files.map((name) => ({ name, norm: normalize(name) }));
  const pick = (keys) => normalized.find((f) => keys.some((k) => f.norm.includes(normalize(k))))?.name;

  const front = pick(KEYWORDS.front) ?? byOrderPreference(files, ["p1", "-1", "_1"]);
  // Prefer the requested standard order first (2=left, 4=back), but keep legacy fallback for folders using P4 as left.
  const left = pick(KEYWORDS.left) ?? byOrderPreference(files, ["p2", "-2", "_2", "p4"]);
  const right = pick(KEYWORDS.right) ?? byOrderPreference(files, ["p3"]);
  const back = pick(KEYWORDS.back) ?? byOrderPreference(files, ["p4", "-4", "_4", "p2"]);

  return { front, left, right, back };
};

const PRODUCT_SOURCES = [
  {
    productId: "byb-ladies-fluffy-sweatpants",
    sourcePathCandidates: ["../PRODUKTER/Ladies Fluffy Sweatpants"],
    filePrefix: "byb-ladies-fluffy-sweatpants",
  },
];

const detectColorMeta = (folderName) => {
  const normalized = normalize(folderName);
  const matched = lookupByAlias.get(normalized);
  if (matched) return matched;

  const value = slugify(folderName);
  return {
    value,
    da: titleCase(folderName),
    en: titleCase(value.replace(/-/g, " ")),
    hex: "#9CA3AF",
    priority: 1,
  };
};

const selectCardColor = (variants) =>
  variants.find((v) => v.value === "black") ?? variants[0] ?? null;

const resolveExistingPath = (candidates) => {
  for (const rel of candidates) {
    const abs = path.resolve(cwd, rel);
    if (fs.existsSync(abs) && fs.statSync(abs).isDirectory()) return abs;
  }
  return null;
};

const syncFolderProduct = ({ productId, sourcePathCandidates, filePrefix }) => {
  const sourceDir = resolveExistingPath(sourcePathCandidates);
  if (!sourceDir) {
    return { productId, variants: [], mockups: {}, cardImages: null, synced: 0, warnings: ["source folder not found"] };
  }

  const folders = fs
    .readdirSync(sourceDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
    .map((entry) => entry.name);

  const selectedByValue = new Map();
  const warnings = [];
  const mockups = {};
  const variants = [];

  for (const folderName of folders.sort((a, b) => a.localeCompare(b, "da"))) {
    const folderPath = path.join(sourceDir, folderName);
    const files = fs
      .readdirSync(folderPath)
      .filter((name) => IMAGE_EXTS.has(path.extname(name).toLowerCase()) && !name.startsWith("."));

    const { front, left, right, back } = pickImageSet(files);
    if (!front || !left || !back) {
      warnings.push(`Skipping "${folderName}" (missing required front/left/back image).`);
      continue;
    }

    const meta = detectColorMeta(folderName);
    const existing = selectedByValue.get(meta.value);
    if (existing && (existing.priority ?? 1) >= meta.priority) {
      warnings.push(`Skipping "${folderName}" for value "${meta.value}" (lower/equal priority alias).`);
      continue;
    }

    selectedByValue.set(meta.value, {
      folderName,
      value: meta.value,
      da: meta.da,
      en: meta.en,
      hex: meta.hex,
      priority: meta.priority,
      frontSrc: path.join(folderPath, front),
      leftSrc: path.join(folderPath, left),
      rightSrc: right ? path.join(folderPath, right) : null,
      backSrc: path.join(folderPath, back),
    });
  }

  const entries = Array.from(selectedByValue.values());
  for (const item of entries) {
    const frontExt = path.extname(item.frontSrc).toLowerCase() || ".jpg";
    const leftExt = path.extname(item.leftSrc).toLowerCase() || ".jpg";
    const backExt = path.extname(item.backSrc).toLowerCase() || ".jpg";

    const frontName = `${filePrefix}-${item.value}-front${frontExt}`;
    const leftName = `${filePrefix}-${item.value}-left${leftExt}`;
    const backName = `${filePrefix}-${item.value}-back${backExt}`;

    const frontOut = path.join(publicDir, frontName);
    const leftOut = path.join(publicDir, leftName);
    const backOut = path.join(publicDir, backName);

    fs.copyFileSync(item.frontSrc, frontOut);
    fs.copyFileSync(item.leftSrc, leftOut);
    fs.copyFileSync(item.backSrc, backOut);

    variants.push({
      value: item.value,
      da: item.da,
      en: item.en,
      hex: item.hex,
    });

    mockups[item.value] = {
      fullFront: `/${frontName}`,
      leftSleeve: `/${leftName}`,
      rightSleeve: item.rightSrc ? `/${path.basename(item.rightSrc)}` : `/${leftName}`,
      fullBack: `/${backName}`,
    };

    if (item.rightSrc) {
      const rightExt = path.extname(item.rightSrc).toLowerCase() || ".jpg";
      const rightName = `${filePrefix}-${item.value}-right${rightExt}`;
      const rightOut = path.join(publicDir, rightName);
      fs.copyFileSync(item.rightSrc, rightOut);
      mockups[item.value].rightSleeve = `/${rightName}`;
    }
  }

  sortVariants(variants);
  const cardColor = selectCardColor(variants);
  const cardImages = cardColor
    ? {
        front: mockups[cardColor.value]?.fullFront ?? null,
        back: mockups[cardColor.value]?.fullBack ?? null,
      }
    : null;

  return {
    productId,
    variants,
    mockups,
    cardImages,
    synced: variants.length,
    warnings,
  };
};

const fluffy = syncFolderProduct(PRODUCT_SOURCES[0]);

const ts = `/* Auto-generated by scripts/sync-folder-product-variants.mjs. Do not edit manually. */
export interface AutoProductVariant {
  value: string;
  da: string;
  en: string;
  hex: string;
}

export const autoBybLadiesFluffySweatpantsVariants: AutoProductVariant[] = ${JSON.stringify(fluffy.variants, null, 2)};

export const autoBybLadiesFluffySweatpantsColorMockups: Record<string, Partial<Record<"fullFront" | "leftSleeve" | "rightSleeve" | "fullBack", string>>> = ${JSON.stringify(fluffy.mockups, null, 2)};

export const autoBybLadiesFluffySweatpantsCardImages: { front: string; back: string } | null = ${JSON.stringify(fluffy.cardImages, null, 2)};
`;

fs.writeFileSync(outTs, ts, "utf8");

console.log(`Synced ${fluffy.synced} variants for ${fluffy.productId}.`);
for (const warning of fluffy.warnings) {
  console.warn(`Warning: ${warning}`);
}
