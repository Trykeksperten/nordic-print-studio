import { useLanguage } from "@/i18n/LanguageContext";
import type { PlacementDesign } from "./PlacementStep";

interface PriceSummaryProps {
  designs: Record<string, PlacementDesign[]>;
  quantity: number;
  placementLabels: Record<string, string>;
}

const sizePriceMap: Record<string, number> = {
  "1-6": 30,
  "6-12": 35,
  "12-20": 40,
  "20-40": 50,
};

const FIRST_SETUP = 295;
const ADDITIONAL_SETUP = 150;

export function calculateTotal(designs: Record<string, PlacementDesign[]>, quantity: number) {
  // Flatten all designs with uploaded files
  const allActive: { placementId: string; design: PlacementDesign; index: number }[] = [];
  Object.entries(designs).forEach(([id, list]) => {
    list.forEach((d, i) => {
      if (d.file) allActive.push({ placementId: id, design: d, index: i });
    });
  });

  if (allActive.length === 0) return { setupTotal: 0, printTotal: 0, total: 0, details: [] };

  let setupTotal = 0;
  const details: { placementId: string; index: number; setup: number; printPrice: number }[] = [];

  allActive.forEach((item, i) => {
    const setup = i === 0 ? FIRST_SETUP : ADDITIONAL_SETUP;
    const printPrice = sizePriceMap[item.design.sizeCategory] || 30;
    setupTotal += setup;
    details.push({ placementId: item.placementId, index: item.index, setup, printPrice });
  });

  const printTotal = details.reduce((sum, d) => sum + d.printPrice * quantity, 0);
  return { setupTotal, printTotal, total: setupTotal + printTotal, details };
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
              {getLabel(d)} – {lang === "da" ? "opstart" : "setup"}{" "}
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
        <span className="text-sm text-muted-foreground">{lang === "da" ? "Opstart i alt" : "Total setup"}</span>
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
