import {
  autoBasicTshirtVariants,
  autoPerformanceTshirtVariants,
  autoPremiumHoodieVariants,
  autoStandardHoodieVariants,
} from "@/lib/autoTshirtVariants";
import { autoBybLadiesFluffySweatpantsVariants } from "@/lib/autoFolderProductVariants";

export interface ProductColor {
  value: string;
  da: string;
  en: string;
  hex: string;
}

export const productColorsById: Record<string, ProductColor[]> = {
  "basic-tshirt": autoBasicTshirtVariants,
  "heavyweight-tshirt": [
    { value: "white", da: "Hvid", en: "White", hex: "#F7F7F5" },
    { value: "black", da: "Sort", en: "Black", hex: "#111827" },
    { value: "bright-royal", da: "Bright Royal", en: "Bright Royal", hex: "#6C8CB0" },
    { value: "classic-red", da: "Classic Rød", en: "Classic Red", hex: "#D92247" },
    { value: "convoy-grey", da: "Convoy Grå", en: "Convoy Grey", hex: "#4B5563" },
    { value: "french-navy", da: "French Navy", en: "French Navy", hex: "#3B4557" },
    { value: "tan", da: "Tan", en: "Tan", hex: "#C19A6B" },
  ],
  "byb-oversized-acid-wash-tee": [
    { value: "black", da: "Sort", en: "Black", hex: "#111827" },
    { value: "asphalt", da: "Asfalt", en: "Asphalt", hex: "#4B5563" },
    { value: "salvia", da: "Salvia", en: "Salvia", hex: "#7E9A8A" },
    { value: "soft-lilac", da: "Soft Lilac", en: "Soft Lilac", hex: "#B79CC8" },
  ],
  "authentic-sweat": [
    { value: "white", da: "Hvid", en: "White", hex: "#F7F7F5" },
    { value: "black", da: "Sort", en: "Black", hex: "#111827" },
    { value: "french-navy", da: "French Navy", en: "French Navy", hex: "#3B4557" },
    { value: "classic-red", da: "Classic Red", en: "Classic Red", hex: "#D92247" },
    { value: "bright-royal", da: "Azur blå", en: "Azure Blue", hex: "#6C8CB0" },
    { value: "bottle-green", da: "Oliven", en: "Olive", hex: "#3F6B5A" },
    { value: "yellow", da: "Gul", en: "Yellow", hex: "#FFE100" },
    { value: "light-oxford", da: "Light Oxford", en: "Light Oxford", hex: "#CBD5E1" },
    { value: "indigo-blue", da: "Indigo blå", en: "Indigo Blue", hex: "#5C7A9C" },
    { value: "mocha", da: "Mocha", en: "Mocha", hex: "#8B6F57" },
    { value: "olive", da: "Oliven", en: "Olive", hex: "#3F6B5A" },
    { value: "eucalyptus", da: "Eucalyptus", en: "Eucalyptus", hex: "#7E9A8A" },
  ],
  "performance-tshirt": autoPerformanceTshirtVariants.length
    ? autoPerformanceTshirtVariants
    : [
        { value: "black", da: "Sort", en: "Black", hex: "#1C1C1C" },
        { value: "blue-steel", da: "Blue Steel", en: "Blue Steel", hex: "#5B6E80" },
        { value: "blue-melange", da: "Blue Melange", en: "Blue Melange", hex: "#6A89A8" },
        { value: "bright-green", da: "Bright Green", en: "Bright Green", hex: "#42B883" },
        { value: "bright-purple", da: "Bright Purple", en: "Bright Purple", hex: "#7A4FB7" },
        { value: "bordeaux", da: "Bordeaux", en: "Bordeaux", hex: "#7B2E45" },
        { value: "olive", da: "Oliven", en: "Olive", hex: "#5E6A3A" },
        { value: "yellow", da: "Gul", en: "Yellow", hex: "#FFE100" },
      ],
  "standard-hoodie": autoStandardHoodieVariants.length
    ? autoStandardHoodieVariants
    : [
        { value: "white", da: "Hvid", en: "White", hex: "#F8FAFC" },
        { value: "black", da: "Sort", en: "Black", hex: "#1C1C1C" },
        { value: "bottle-green", da: "Flaske Grøn", en: "Bottle Green", hex: "#3F6B5A" },
        { value: "burgundy", da: "Burgundy", en: "Burgundy", hex: "#A2535F" },
        { value: "pink", da: "Pink", en: "Pink", hex: "#D38DA5" },
        { value: "bright-royal", da: "Bright Royal", en: "Bright Royal", hex: "#6C8CB0" },
        { value: "classic-red", da: "Classic Red", en: "Classic Red", hex: "#D92247" },
        { value: "french-navy", da: "French Navy", en: "French Navy", hex: "#3B4557" },
        { value: "yellow", da: "Gul", en: "Yellow", hex: "#FFE100" },
        { value: "oxford-grey", da: "Oxford Grey", en: "Oxford Grey", hex: "#9CA3AF" },
      ],
  "premium-hoodie": autoPremiumHoodieVariants,
  "byb-ladies-fluffy-sweatpants": autoBybLadiesFluffySweatpantsVariants.length
    ? autoBybLadiesFluffySweatpantsVariants
    : [
        { value: "black", da: "Sort", en: "Black", hex: "#111827" },
        { value: "brown", da: "Brun", en: "Brown", hex: "#8B6F57" },
        { value: "light-asphalt", da: "Light Asfalt", en: "Light Asphalt", hex: "#9CA3AF" },
        { value: "soft-pink", da: "Soft Pink", en: "Soft Pink", hex: "#F3CBD8" },
        { value: "white", da: "Hvid", en: "White", hex: "#F7F7F5" },
      ],
};

export const getProductColors = (productId: string): ProductColor[] =>
  productColorsById[productId] ?? productColorsById["basic-tshirt"];

export const getAllTshirtColors = (): ProductColor[] => {
  const map = new Map<string, ProductColor>();
  ["basic-tshirt", "heavyweight-tshirt", "performance-tshirt"].forEach((id) => {
    getProductColors(id).forEach((color) => {
      if (!map.has(color.value)) {
        map.set(color.value, color);
      }
    });
  });
  return Array.from(map.values());
};
