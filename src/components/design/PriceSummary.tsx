import { useLanguage } from "@/i18n/LanguageContext";
import type { PlacementDesign } from "./PlacementStep";

interface PriceSummaryProps {
  designs: Record<string, PlacementDesign>;
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

export function calculateTotal(designs: Record<string, PlacementDesign>, quantity: number) {
  const activePlacements = Object.entries(designs).filter(([, d]) => d.file);
  if (activePlacements.length === 0) return { setupTotal: 0, printTotal: 0, total: 0, details: [] };

  let setupTotal = 0;
  const details: { id: string; setup: number; printPrice: number }[] = [];

  activePlacements.forEach(([id, d], i) => {
    const setup = i === 0 ? FIRST_SETUP : ADDITIONAL_SETUP;
    const printPrice = sizePriceMap[d.sizeCategory] || 30;
    setupTotal += setup;
    details.push({ id, setup, printPrice });
  });

  const printTotal = details.reduce((sum, d) => sum + d.printPrice * quantity, 0);
  return { setupTotal, printTotal, total: setupTotal + printTotal, details };
}

const PriceSummary = ({ designs, quantity, placementLabels }: PriceSummaryProps) => {
  const { lang } = useLanguage();
  const { setupTotal, printTotal, total, details } = calculateTotal(designs, quantity);

  if (details.length === 0) return null;

  return (
    <div className="bg-accent rounded-xl p-5 space-y-3">
      <h4 className="text-sm font-bold text-accent-foreground">
        {lang === "da" ? "Prisoverslag" : "Price Estimate"}
      </h4>
      <div className="space-y-1.5 text-sm">
        {details.map((d, i) => (
          <div key={d.id} className="flex justify-between">
            <span className="text-muted-foreground">
              {placementLabels[d.id]} – {lang === "da" ? "opstart" : "setup"}{" "}
              {i === 0 ? `(${lang === "da" ? "første" : "first"})` : ""}
            </span>
            <span className="font-medium">{d.setup} DKK</span>
          </div>
        ))}
        {details.map((d) => (
          <div key={`print-${d.id}`} className="flex justify-between">
            <span className="text-muted-foreground">
              {placementLabels[d.id]} – {d.printPrice} DKK × {quantity} {lang === "da" ? "stk" : "pcs"}
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
