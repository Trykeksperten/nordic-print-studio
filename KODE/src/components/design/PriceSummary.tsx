import { useLanguage } from "@/i18n/LanguageContext";
import type { PlacementDesign } from "./PlacementStep";

interface PriceSummaryProps {
  designs: Record<string, PlacementDesign[]>;
  quantity: number;
  placementLabels: Record<string, string>;
}

const sizePriceMap: Record<string, number> = {
  "1-6": 35,
  "6-12": 40,
  "12-20": 45,
  "20-40": 55,
};

export const FIRST_SETUP = 299;
export const ADDITIONAL_SETUP = 150;

export function calculateOrderSetupFromLogoRefs(logoRefs: string[]) {
  const uniqueLogoCount = new Set(
    logoRefs
      .map((ref) => ref?.trim?.() ?? "")
      .filter(Boolean)
  ).size;
  const setupTotal =
    uniqueLogoCount === 0 ? 0 : FIRST_SETUP + Math.max(0, uniqueLogoCount - 1) * ADDITIONAL_SETUP;
  return { uniqueLogoCount, setupTotal };
}

export function calculateOrderSetupFromPlacementCount(placementCount: number) {
  const count = Math.max(0, Math.floor(Number(placementCount) || 0));
  const setupTotal = count === 0 ? 0 : FIRST_SETUP + Math.max(0, count - 1) * ADDITIONAL_SETUP;
  return { placementCount: count, setupTotal };
}

export function calculateTotal(designs: Record<string, PlacementDesign[]>, quantity: number) {
  // Flatten all designs with uploaded files
  const allActive: { placementId: string; design: PlacementDesign; index: number }[] = [];
  Object.entries(designs).forEach(([id, list]) => {
    list.forEach((d, i) => {
      if (d.file) allActive.push({ placementId: id, design: d, index: i });
    });
  });

  const logoCount = allActive.length;
  if (logoCount === 0) return { setupTotal: 0, printTotal: 0, total: 0, details: [], logoCount: 0 };

  // Setup logic:
  // 1st uploaded logo = 299 DKK
  // Each additional uploaded logo = 149 DKK
  const firstSetup = FIRST_SETUP;
  const setupTotal = firstSetup + Math.max(0, logoCount - 1) * ADDITIONAL_SETUP;
  const details: { placementId: string; index: number; setup: number; printPrice: number }[] = allActive.map((item, i) => ({
    placementId: item.placementId,
    index: item.index,
    setup: i === 0 ? firstSetup : ADDITIONAL_SETUP,
    printPrice: sizePriceMap[item.design.sizeCategory] || 35,
  }));

  const printTotal = details.reduce((sum, d) => sum + d.printPrice * quantity, 0);
  return { setupTotal, printTotal, total: setupTotal + printTotal, details, logoCount, firstPlacementFree: false };
}

const PriceSummary = ({ designs, quantity, placementLabels }: PriceSummaryProps) => {
  const { lang } = useLanguage();
  const { setupTotal, printTotal, total, details } = calculateTotal(designs, quantity);

  if (details.length === 0) return null;

  const getLabel = (d: { placementId: string; index: number }) => {
    const base = placementLabels[d.placementId] || d.placementId;
    const count = designs[d.placementId]?.filter(x => x.file).length || 0;
    if (count > 1) return `${base} – Logo ${d.index + 1}`;
    return base;
  };

  return (
    <div className="bg-accent rounded-xl p-5 space-y-3">
      <h4 className="text-sm font-bold text-accent-foreground">
        {lang === "da" ? "Prisoverslag" : "Price Estimate"}
      </h4>
      <div className="space-y-1.5 text-sm">
        {details.map((d, i) => (
          <div key={`setup-${d.placementId}-${d.index}`} className="flex justify-between">
            <span className="text-muted-foreground">
              {getLabel(d)} – {lang === "da" ? "designopsætning" : "design setup"}{" "}
              {i === 0 ? `(${lang === "da" ? "første" : "first"})` : ""}
            </span>
            <span className="font-medium">{d.setup} DKK</span>
          </div>
        ))}
        {details.map((d) => (
          <div key={`print-${d.placementId}-${d.index}`} className="flex justify-between">
            <span className="text-muted-foreground">
              {getLabel(d)} – {d.printPrice} DKK × {quantity} {lang === "da" ? "stk" : "pcs"}
            </span>
            <span className="font-medium">{d.printPrice * quantity} DKK</span>
          </div>
        ))}
      </div>
      <div className="border-t border-border pt-2 flex justify-between">
        <span className="text-sm text-muted-foreground">{lang === "da" ? "Designopsætning i alt" : "Total design setup"}</span>
        <span className="font-medium">{setupTotal.toLocaleString("da-DK")} DKK</span>
      </div>
      <div className="flex justify-between">
        <span className="text-sm text-muted-foreground">{lang === "da" ? "Tryk i alt" : "Total print"}</span>
        <span className="font-medium">{printTotal.toLocaleString("da-DK")} DKK</span>
      </div>
      <div className="border-t border-border pt-2 flex justify-between">
        <span className="font-bold">{lang === "da" ? "Estimeret total" : "Estimated total"}</span>
        <span className="text-lg font-bold text-accent-foreground">{total.toLocaleString("da-DK")} DKK</span>
      </div>
    </div>
  );
};

export default PriceSummary;
