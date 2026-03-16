#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const cwd = process.cwd();
const publicDir = path.resolve(cwd, "public");
const outTs = path.resolve(cwd, "src/lib/autoTshirtVariants.ts");

const IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".webp"]);

const KEYWORDS = {
  front: ["front", "forfra"],
  back: ["ryg", "back", "bag"],
  sleeve: ["ærme", "aerme", "sleeve", "side"],
};

const ORDERED_VALUES = [
  "white",
  "black",
  "royal-blue",
  "sapphire-blue",
  "silver-melange",
  "turquoise",
  "blue-steel",
  "blue-melange",
  "bright-green",
  "bright-purple",
  "bordeaux",
  "olive",
  "french-navy",
  "classic-red",
  "bright-royal",
  "bottle-green",
  "convoy-grey",
  "sky",
  "purple",
  "burgundy",
  "yellow",
  "tan",
  "light-oxford",
  "mineral-blue",
  "mocha",
  "natural",
  "rose",
  "pink",
  "oxford-grey",
];

const KNOWN_COLORS = [
  { aliases: ["hvid", "white"], value: "white", da: "Hvid", en: "White", hex: "#F7F7F5", priority: 10 },
  { aliases: ["sort", "black"], value: "black", da: "Sort", en: "Black", hex: "#1C1C1C", priority: 10 },
  { aliases: ["blue steel"], value: "blue-steel", da: "Blue Steel", en: "Blue Steel", hex: "#5B6E80", priority: 10 },
  { aliases: ["royal blue"], value: "royal-blue", da: "Royal Blue", en: "Royal Blue", hex: "#2563EB", priority: 10 },
  { aliases: ["sapphire blue"], value: "sapphire-blue", da: "Sapphire Blue", en: "Sapphire Blue", hex: "#1E3A8A", priority: 10 },
  { aliases: ["silver malange", "silver melange"], value: "silver-melange", da: "Silver Malange", en: "Silver Melange", hex: "#94A3B8", priority: 10 },
  { aliases: ["turquoise"], value: "turquoise", da: "Turquoise", en: "Turquoise", hex: "#14B8A6", priority: 10 },
  { aliases: ["blue melange"], value: "blue-melange", da: "Blue Melange", en: "Blue Melange", hex: "#6A89A8", priority: 10 },
  { aliases: ["bright green"], value: "bright-green", da: "Bright Green", en: "Bright Green", hex: "#42B883", priority: 10 },
  { aliases: ["bright purple"], value: "bright-purple", da: "Bright Purple", en: "Bright Purple", hex: "#7A4FB7", priority: 10 },
  { aliases: ["bordeaux", "burgundy"], value: "bordeaux", da: "Bordeaux", en: "Bordeaux", hex: "#7B2E45", priority: 10 },
  { aliases: ["oliven", "olive"], value: "olive", da: "Oliven", en: "Olive", hex: "#5E6A3A", priority: 30 },
  { aliases: ["french navy"], value: "french-navy", da: "French Navy", en: "French Navy", hex: "#3B4557", priority: 10 },
  { aliases: ["classic rød", "classic rod", "classic red"], value: "classic-red", da: "Classic Red", en: "Classic Red", hex: "#D92247", priority: 10 },
  { aliases: ["azur blå", "azur bla", "bright royal"], value: "bright-royal", da: "Azur blå", en: "Azure Blue", hex: "#6C8CB0", priority: 10 },
  { aliases: ["sky"], value: "sky", da: "Sky", en: "Sky", hex: "#74B9E6", priority: 10 },
  { aliases: ["convoy grå", "convoy gra", "convoy grey"], value: "convoy-grey", da: "Convoy Grey", en: "Convoy Grey", hex: "#6B7280", priority: 10 },
  { aliases: ["lilla", "purple"], value: "purple", da: "Lilla", en: "Purple", hex: "#8574A5", priority: 10 },
  { aliases: ["burgundy", "bordeaux"], value: "burgundy", da: "Bordeaux", en: "Burgundy", hex: "#A2535F", priority: 10 },
  { aliases: ["gul", "yellow"], value: "yellow", da: "Gul", en: "Yellow", hex: "#FFE100", priority: 10 },
  { aliases: ["tan"], value: "tan", da: "Tan", en: "Tan", hex: "#C19A6B", priority: 10 },
  { aliases: ["oliven", "olive"], value: "bottle-green", da: "Oliven", en: "Olive", hex: "#3F6B5A", priority: 20 },
  { aliases: ["flaskegrøn", "flaskegron", "flaske grøn", "flaske gron", "bottle green"], value: "bottle-green", da: "Oliven", en: "Olive", hex: "#3F6B5A", priority: 5 },
  { aliases: ["light oxford"], value: "light-oxford", da: "Light Oxford", en: "Light Oxford", hex: "#CBD5E1", priority: 10 },
  { aliases: ["oxford grey", "oxford gray"], value: "oxford-grey", da: "Oxford Grey", en: "Oxford Grey", hex: "#9CA3AF", priority: 10 },
  { aliases: ["mineral blå", "mineral bla", "mineral blue"], value: "mineral-blue", da: "Mineral blå", en: "Mineral Blue", hex: "#5C7A9C", priority: 10 },
  { aliases: ["mocha"], value: "mocha", da: "Mocha", en: "Mocha", hex: "#8B6F57", priority: 10 },
  { aliases: ["rose"], value: "rose", da: "Rose", en: "Rose", hex: "#C98EA5", priority: 10 },
  { aliases: ["pink"], value: "pink", da: "Pink", en: "Pink", hex: "#D38DA5", priority: 10 },
  { aliases: ["natur", "natural"], value: "natural", da: "Natur", en: "Natural", hex: "#D8CFB8", priority: 10 },
];

const PRODUCT_SOURCES = [
  {
    productId: "basic-tshirt",
    label: "T-shirt",
    sourcePathCandidates: [
      "../PRODUKTER/T-shirt",
      "../nye billeder /T-shirt",
      "../nye billeder/T-shirt",
    ],
    filePrefix: "russell",
  },
  {
    productId: "performance-tshirt",
    label: "TriDri Performance Herre",
    sourcePathCandidates: [
      "../PRODUKTER/TriDri Performance Herre",
    ],
    filePrefix: "tridri-performance",
    sleeveSourceSide: "left",
  },
  {
    productId: "premium-hoodie",
    label: "Russell Premium Hoodie",
    sourcePathCandidates: [
      "../PRODUKTER/Russell Premium Hoodie 265M",
      "../nye billeder /Russell Premium Hoodie",
      "../nye billeder/Russell Premium Hoodie",
    ],
    filePrefix: "russell-premium-hoodie",
  },
  {
    productId: "standard-hoodie",
    label: "Russell Basic Hoodie",
    sourcePathCandidates: [
      "../PRODUKTER/Russell Premium Hoodie 265M",
      "../nye billeder /Russell Premium Hoodie",
      "../nye billeder/Russell Premium Hoodie",
      "../nye billeder /Russell Basic Hoodie",
      "../nye billeder/Russell Basic Hoodie",
      "../TØJ/Russell Premium Hoodie",
    ],
    filePrefix: "russell-basic-hoodie",
    allowedValues: [
      "white",
      "black",
      "bottle-green",
      "burgundy",
      "pink",
      "bright-royal",
      "classic-red",
      "french-navy",
      "yellow",
      "oxford-grey",
    ],
  },
];

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

const resolveExistingPath = (candidates) => {
  for (const rel of candidates) {
    const abs = path.resolve(cwd, rel);
    if (fs.existsSync(abs) && fs.statSync(abs).isDirectory()) {
      return abs;
    }
  }
  return null;
};

const findByKeywords = (files, keywords) =>
  files.find((name) => {
    const n = normalize(name);
    return keywords.some((kw) => n.includes(normalize(kw)));
  });

const sortVariants = (variants) =>
  variants.sort((a, b) => {
    const ai = ORDERED_VALUES.indexOf(a.value);
    const bi = ORDERED_VALUES.indexOf(b.value);
    if (ai !== -1 && bi !== -1) return ai - bi;
    if (ai !== -1) return -1;
    if (bi !== -1) return 1;
    return a.da.localeCompare(b.da, "da");
  });

const knownLookup = new Map();
for (const color of KNOWN_COLORS) {
  for (const alias of color.aliases) {
    knownLookup.set(normalize(alias), color);
  }
}

const warnings = [];

const removeIfExists = (filePath) => {
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch {
    // Ignore cleanup errors; sync should still attempt to write output.
  }
};

const syncProduct = ({ productId, label, sourcePathCandidates, filePrefix, allowedValues, sleeveSourceSide = "left" }) => {
  const sourceDir = resolveExistingPath(sourcePathCandidates);
  if (!sourceDir) {
    warnings.push(`Skipping ${label}: source folder not found.`);
    return { productId, variants: [], mockups: {}, synced: 0 };
  }

  const folderEntries = fs
    .readdirSync(sourceDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
    .map((entry) => entry.name);

  const selectedByValue = new Map();

  for (const folderName of folderEntries.sort()) {
    const folderPath = path.join(sourceDir, folderName);
    const files = fs
      .readdirSync(folderPath)
      .filter((name) => IMAGE_EXTS.has(path.extname(name).toLowerCase()) && !name.startsWith("."));

    const frontFile = findByKeywords(files, KEYWORDS.front);
    const backFile = findByKeywords(files, KEYWORDS.back);
    const sleeveFile = findByKeywords(files, KEYWORDS.sleeve);

    if (!frontFile || !backFile || !sleeveFile) {
      warnings.push(`Skipping "${folderName}" in ${label} (missing front/ryg/ærme image).`);
      continue;
    }

    const normalizedFolder = normalize(folderName);
    const known = knownLookup.get(normalizedFolder);
    const value = known?.value ?? slugify(folderName);
    const da = known?.da ?? titleCase(folderName);
    const en = known?.en ?? titleCase(slugify(folderName).replace(/-/g, " "));
    const hex = known?.hex ?? "#9CA3AF";
    const priority = known?.priority ?? 1;

    const candidate = {
      folderName,
      value,
      da,
      en,
      hex,
      priority,
      frontSrc: path.join(folderPath, frontFile),
      backSrc: path.join(folderPath, backFile),
      sleeveSrc: path.join(folderPath, sleeveFile),
    };

    const existing = selectedByValue.get(value);
    if (!existing || candidate.priority > existing.priority) {
      selectedByValue.set(value, candidate);
    } else {
      warnings.push(`Skipping "${folderName}" in ${label} for value "${value}" (lower priority alias).`);
    }
  }

  const variants = [];
  const mockups = {};
  const selectedItems = Array.from(selectedByValue.values())
    .filter((item) => !allowedValues || allowedValues.includes(item.value))
    .sort((a, b) => a.da.localeCompare(b.da, "da"));

  for (const item of selectedItems) {
    const frontExt = path.extname(item.frontSrc).toLowerCase() || ".jpg";
    const backExt = path.extname(item.backSrc).toLowerCase() || ".jpg";
    const sleeveExt = path.extname(item.sleeveSrc).toLowerCase() || ".jpg";

    const frontName = `${filePrefix}-${item.value}-front${frontExt}`;
    const leftName = `${filePrefix}-${item.value}-left-sleeve${sleeveExt}`;
    const rightName = `${filePrefix}-${item.value}-right-sleeve${sleeveExt}`;
    const backName = `${filePrefix}-${item.value}-back${backExt}`;

    const frontOut = path.join(publicDir, frontName);
    const leftOut = path.join(publicDir, leftName);
    const rightOut = path.join(publicDir, rightName);
    const backOut = path.join(publicDir, backName);

    removeIfExists(frontOut);
    removeIfExists(leftOut);
    removeIfExists(rightOut);
    removeIfExists(backOut);

    fs.copyFileSync(item.frontSrc, frontOut);
    fs.copyFileSync(item.backSrc, backOut);
    if (sleeveSourceSide === "right") {
      fs.copyFileSync(item.sleeveSrc, leftOut);
      execFileSync("sips", ["-f", "horizontal", item.sleeveSrc, "--out", rightOut], { stdio: "ignore" });
    } else {
      fs.copyFileSync(item.sleeveSrc, rightOut);
      execFileSync("sips", ["-f", "horizontal", item.sleeveSrc, "--out", leftOut], { stdio: "ignore" });
    }

    variants.push({
      value: item.value,
      da: item.da,
      en: item.en,
      hex: item.hex,
    });

    mockups[item.value] = {
      fullFront: `/${frontName}`,
      leftSleeve: `/${leftName}`,
      rightSleeve: `/${rightName}`,
      fullBack: `/${backName}`,
    };
  }

  sortVariants(variants);

  return {
    productId,
    variants,
    mockups,
    synced: variants.length,
    sourceDir,
  };
};

const basic = syncProduct(PRODUCT_SOURCES[0]);
const performance = syncProduct(PRODUCT_SOURCES[1]);
const premium = syncProduct(PRODUCT_SOURCES[2]);
const standard = syncProduct(PRODUCT_SOURCES[3]);

const ts = `/* Auto-generated by scripts/sync-tshirt-variants.mjs. Do not edit manually. */
export interface AutoProductVariant {
  value: string;
  da: string;
  en: string;
  hex: string;
}

export const autoBasicTshirtVariants: AutoProductVariant[] = ${JSON.stringify(basic.variants, null, 2)};

export const autoBasicTshirtColorMockups: Record<string, Partial<Record<"fullFront" | "leftSleeve" | "rightSleeve" | "fullBack", string>>> = ${JSON.stringify(
  basic.mockups,
  null,
  2
)};

export const autoPerformanceTshirtVariants: AutoProductVariant[] = ${JSON.stringify(performance.variants, null, 2)};

export const autoPerformanceTshirtColorMockups: Record<string, Partial<Record<"fullFront" | "leftSleeve" | "rightSleeve" | "fullBack", string>>> = ${JSON.stringify(
  performance.mockups,
  null,
  2
)};

export const autoPremiumHoodieVariants: AutoProductVariant[] = ${JSON.stringify(premium.variants, null, 2)};

export const autoPremiumHoodieColorMockups: Record<string, Partial<Record<"fullFront" | "leftSleeve" | "rightSleeve" | "fullBack", string>>> = ${JSON.stringify(
  premium.mockups,
  null,
  2
)};

export const autoStandardHoodieVariants: AutoProductVariant[] = ${JSON.stringify(standard.variants, null, 2)};

export const autoStandardHoodieColorMockups: Record<string, Partial<Record<"fullFront" | "leftSleeve" | "rightSleeve" | "fullBack", string>>> = ${JSON.stringify(
  standard.mockups,
  null,
  2
)};
`;

fs.writeFileSync(outTs, ts, "utf8");

console.log(`Synced ${basic.synced} variants for basic-tshirt from "${basic.sourceDir ?? "N/A"}"`);
console.log(`Synced ${performance.synced} variants for performance-tshirt from "${performance.sourceDir ?? "N/A"}"`);
console.log(`Synced ${premium.synced} variants for premium-hoodie from "${premium.sourceDir ?? "N/A"}"`);
console.log(`Synced ${standard.synced} variants for standard-hoodie from "${standard.sourceDir ?? "N/A"}"`);
if (warnings.length) {
  console.log("Warnings:");
  for (const warning of warnings) {
    console.log(`- ${warning}`);
  }
}
