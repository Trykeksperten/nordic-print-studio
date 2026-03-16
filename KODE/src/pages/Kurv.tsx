import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useLanguage } from "@/i18n/LanguageContext";
import { defaultPrintAreas, getMockupSourceAndTransform, getVisualScale } from "@/components/design/PlacementStep";
import { calculateOrderSetupFromPlacementCount, calculateTotal } from "@/components/design/PriceSummary";
import { getProductColors } from "@/lib/productColors";
import { Search } from "lucide-react";

type PlacementDesign = {
  file: string | null;
  fileName: string;
  pos: { x: number; y: number };
  scale: number;
  sizeCategory: string;
};

type CartDesignEntry = {
  id: string;
  selectedProduct: string;
  selectedProductName: string;
  selectedColor: string;
  selectedColorName: string;
  sizeQuantities: Record<string, number>;
  totalQuantity: number;
  placementsUsed: string[];
  logoItems: Array<{
    placementId: string;
    fileName: string;
    fileRef: string;
    pos: { x: number; y: number };
    scale: number;
    sizeCategory: string;
  }>;
  uploadedFileRefs: string[];
  mockupRef?: string;
  previewMockupDataUrl?: string;
  placementMockups?: Array<{
    placementId: string;
    placementLabel: string;
    dataUrl: string;
  }>;
  designs: Record<string, PlacementDesign[]>;
  updatedAt: number;
};

const DESIGN_CART_STORAGE_KEY = "trykeksperten:design-cart:v1";

const readDesignCart = (): CartDesignEntry[] => {
  try {
    const raw = localStorage.getItem(DESIGN_CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => item && typeof item === "object") as CartDesignEntry[];
  } catch {
    return [];
  }
};

const writeDesignCart = (entries: CartDesignEntry[]) => {
  const limited = entries.slice(0, 50);
  try {
    localStorage.setItem(DESIGN_CART_STORAGE_KEY, JSON.stringify(limited));
    window.dispatchEvent(new Event("trykeksperten:cart-updated"));
  } catch {
    // Fallback: keep cart item data, but drop heavy cached mockup payloads.
    try {
      const withoutHeavyPreviews = limited.map((entry) => ({
        ...entry,
        previewMockupDataUrl: undefined,
        placementMockups: undefined,
      }));
      localStorage.setItem(DESIGN_CART_STORAGE_KEY, JSON.stringify(withoutHeavyPreviews));
      window.dispatchEvent(new Event("trykeksperten:cart-updated"));
    } catch {
      // Ignore storage errors.
    }
  }
};

const serializeSizeLabels = (quantities: Record<string, number>): string =>
  Object.entries(quantities)
    .filter(([, qty]) => qty > 0)
    .map(([size]) => size)
    .join(", ");

const getItemTotalQuantity = (item: CartDesignEntry) =>
  Object.values(item.sizeQuantities || {}).reduce((q, v) => q + (Number(v) || 0), 0);

const getBaseUnitPrice = (productId: string, colorValue: string) => {
  if (productId === "basic-tshirt") return colorValue === "white" ? 49 : 59;
  if (productId === "heavyweight-tshirt") return colorValue === "white" ? 69 : 79;
  if (productId === "performance-tshirt") return 69;
  if (productId === "byb-oversized-acid-wash-tee") return 129;
  if (productId === "byb-ladies-fluffy-sweatpants") return 249;
  if (productId === "authentic-sweat") return 199;
  if (productId === "standard-hoodie") return 259;
  if (productId === "premium-hoodie") return 299;
  return 0;
};

const getCartItemTotalWithoutSetup = (item: CartDesignEntry) => {
  const quantity = item.totalQuantity || Object.values(item.sizeQuantities).reduce((q, v) => q + (Number(v) || 0), 0);
  const garmentTotal = getBaseUnitPrice(item.selectedProduct, item.selectedColor) * quantity;
  const printPricing = calculateTotal(item.designs, quantity);
  return garmentTotal + printPricing.printTotal;
};

const getPlacementLabel = (placementId: string, lang: "da" | "en") => {
  if (placementId === "fullFront") return lang === "da" ? "Front" : "Front";
  if (placementId === "leftSleeve") return lang === "da" ? "Venstre ærme" : "Left sleeve";
  if (placementId === "rightSleeve") return lang === "da" ? "Højre ærme" : "Right sleeve";
  if (placementId === "fullBack") return lang === "da" ? "Ryg" : "Back";
  return placementId;
};

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

const drawContainImage = (
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number
) => {
  const scale = Math.min(width / img.width, height / img.height);
  const drawWidth = img.width * scale;
  const drawHeight = img.height * scale;
  const drawX = x + (width - drawWidth) / 2;
  const drawY = y + (height - drawHeight) / 2;
  ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
};

const drawPlacementMockup = async (entry: CartDesignEntry, placementId: string): Promise<string | null> => {
  const area = defaultPrintAreas[placementId];
  if (!area) return null;
  const placementDesigns = entry.designs[placementId] ?? [];
  const uploaded = placementDesigns.filter((d) => Boolean(d.file));
  if (uploaded.length === 0) return null;

  const { src, transform } = getMockupSourceAndTransform(entry.selectedProduct, entry.selectedColor, placementId);
  const mockupImg = await loadImage(src);

  const canvas = document.createElement("canvas");
  canvas.width = mockupImg.width;
  canvas.height = mockupImg.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  if (transform.includes("scaleX(-1)")) {
    ctx.save();
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(mockupImg, 0, 0, canvas.width, canvas.height);
    ctx.restore();
  } else {
    ctx.drawImage(mockupImg, 0, 0, canvas.width, canvas.height);
  }

  const areaX = (area.left / 100) * canvas.width;
  const areaY = (area.top / 100) * canvas.height;
  const areaW = (area.width / 100) * canvas.width;
  const areaH = (area.height / 100) * canvas.height;
  const baseLogoWidthCm = 45 * (area.width / 58);

  for (const design of uploaded) {
    if (!design.file) continue;
    const logoImg = await loadImage(design.file);
    const visualScale = getVisualScale(design.scale, baseLogoWidthCm, entry.selectedProduct, placementId);
    ctx.save();
    const centerX = areaX + areaW / 2 + design.pos.x;
    const centerY = areaY + areaH / 2 + design.pos.y;
    ctx.translate(centerX, centerY);
    ctx.scale(visualScale, visualScale);
    drawContainImage(ctx, logoImg, -areaW / 2, -areaH / 2, areaW, areaH);
    ctx.restore();
  }

  return canvas.toDataURL("image/jpeg", 0.82);
};

const Kurv = () => {
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const [items, setItems] = useState<CartDesignEntry[]>(() => readDesignCart());
  const [generatedMockups, setGeneratedMockups] = useState<Record<string, Array<{ placementId: string; dataUrl: string }>>>({});
  const [zoomedMockup, setZoomedMockup] = useState<{ src: string; label: string } | null>(null);

  const sortedItems = useMemo(
    () => items.slice().sort((a, b) => b.updatedAt - a.updatedAt),
    [items]
  );
  const cartTotal = useMemo(
    () => sortedItems.reduce((sum, item) => sum + getCartItemTotalWithoutSetup(item), 0),
    [sortedItems]
  );
  const orderSetup = useMemo(
    () => calculateOrderSetupFromPlacementCount(sortedItems.reduce((sum, item) => sum + item.logoItems.length, 0)),
    [sortedItems]
  );
  const orderTotal = cartTotal + orderSetup.setupTotal;

  const handleRemove = (id: string) => {
    setItems((prev) => {
      const next = prev.filter((item) => item.id !== id);
      writeDesignCart(next);
      return next;
    });
  };

  const handleSizeQuantityChange = (itemId: string, size: string, value: string) => {
    const digitsOnly = value.replace(/\D+/g, "");
    const nextQty = digitsOnly === "" ? 0 : Number(digitsOnly);
    setItems((prev) => {
      const next = prev.map((item) => {
        if (item.id !== itemId) return item;
        const nextSizeQuantities = {
          ...item.sizeQuantities,
          [size]: Math.max(0, Number.isFinite(nextQty) ? nextQty : 0),
        };
        return {
          ...item,
          sizeQuantities: nextSizeQuantities,
          totalQuantity: Object.values(nextSizeQuantities).reduce((sum, qty) => sum + (Number(qty) || 0), 0),
          updatedAt: Date.now(),
        };
      });
      writeDesignCart(next);
      return next;
    });
  };

  useEffect(() => {
    let cancelled = false;
    const missing = items.filter((item) => !item.placementMockups || item.placementMockups.length === 0);
    if (missing.length === 0) return;

    (async () => {
      const next: Record<string, Array<{ placementId: string; dataUrl: string }>> = {};
      for (const item of missing) {
        const placements = (item.placementsUsed ?? []).filter((placementId) =>
          (item.designs?.[placementId] ?? []).some((design) => Boolean(design.file))
        );
        const mocks: Array<{ placementId: string; dataUrl: string }> = [];
        for (const placementId of placements) {
          try {
            const dataUrl = await drawPlacementMockup(item, placementId);
            if (dataUrl) mocks.push({ placementId, dataUrl });
          } catch {
            // Ignore per-placement errors.
          }
        }
        next[item.id] = mocks;
      }
      if (!cancelled) {
        setGeneratedMockups((prev) => ({ ...prev, ...next }));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [items]);

  return (
    <Layout>
      <section className="py-8">
        <div className="container mx-auto px-4 lg:px-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-6">{lang === "da" ? "Kurv" : "Cart"}</h1>

          {sortedItems.length === 0 ? (
            <div className="bg-card rounded-2xl card-shadow p-6">
              <p className="text-muted-foreground">
                {lang === "da" ? "Din kurv er tom." : "Your cart is empty."}
              </p>
              <Link to="/tekstiltryk/produkter" className="inline-block mt-4">
                <Button variant="default">{lang === "da" ? "Se produkter" : "View products"}</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedItems.map((item) => {
                const colorName =
                  getProductColors(item.selectedProduct).find((c) => c.value === item.selectedColor)?.[lang] ??
                  item.selectedColorName ??
                  item.selectedColor;
                const fallbackProductImage = getMockupSourceAndTransform(
                  item.selectedProduct,
                  item.selectedColor,
                  "fullFront"
                ).src;
                const editableSizes = Object.entries(item.sizeQuantities || {})
                  .filter(([, qty]) => (Number(qty) || 0) > 0)
                  .map(([size]) => size);
                if (editableSizes.length === 0) {
                  const allSizes = Object.keys(item.sizeQuantities || {});
                  if (allSizes.length > 0) editableSizes.push(allSizes[0]);
                }
                return (
                  <div key={item.id} className="bg-card rounded-2xl card-shadow p-4">
                    <div className="flex items-start gap-3">
                      {item.previewMockupDataUrl ? (
                        <button
                          type="button"
                          className="shrink-0 relative"
                          onClick={() => setZoomedMockup({ src: item.previewMockupDataUrl!, label: item.selectedProductName })}
                        >
                          <img src={item.previewMockupDataUrl} alt="" className="h-16 w-14 rounded object-contain bg-muted" />
                          <span className="absolute bottom-1 right-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-background/90 text-muted-foreground">
                            <Search size={10} />
                          </span>
                        </button>
                      ) : fallbackProductImage ? (
                        <button
                          type="button"
                          className="shrink-0 relative"
                          onClick={() => setZoomedMockup({ src: fallbackProductImage, label: item.selectedProductName })}
                        >
                          <img src={fallbackProductImage} alt="" className="h-16 w-14 rounded object-contain bg-muted" />
                          <span className="absolute bottom-1 right-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-background/90 text-muted-foreground">
                            <Search size={10} />
                          </span>
                        </button>
                      ) : (
                        <div className="h-16 w-14 rounded bg-muted shrink-0" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{item.selectedProductName}</p>
                        <p className="text-sm text-muted-foreground">{lang === "da" ? "Farve" : "Color"}: {colorName}</p>
                        <p className="text-sm text-muted-foreground">
                          {lang === "da" ? "Størrelse" : "Size"}: {serializeSizeLabels(item.sizeQuantities)}
                        </p>
                        {editableSizes.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-2">
                            {editableSizes.map((size) => (
                              <label key={`${item.id}-${size}`} className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                <span>{lang === "da" ? "Antal" : "Quantity"}</span>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  pattern="[0-9]*"
                                  value={String(item.sizeQuantities?.[size] ?? 0)}
                                  onChange={(e) => handleSizeQuantityChange(item.id, size, e.target.value)}
                                  className="w-16 h-8 rounded-md border border-input bg-background px-2 text-xs outline-none focus:ring-2 focus:ring-ring"
                                  aria-label={`${lang === "da" ? "Antal" : "Quantity"} ${size}`}
                                />
                              </label>
                            ))}
                          </div>
                        )}
                        <p className="text-sm text-muted-foreground">
                          {lang === "da" ? "Logo" : "Logo"}:{" "}
                          {item.logoItems.length > 0
                            ? (lang === "da"
                                ? `${item.logoItems.length} logo${item.logoItems.length > 1 ? "er" : ""}`
                                : `${item.logoItems.length} logo${item.logoItems.length > 1 ? "s" : ""}`)
                            : (lang === "da" ? "Uden tryk" : "Without print")}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {lang === "da" ? "Pris" : "Price"}:{" "}
                          {`${getCartItemTotalWithoutSetup(item).toLocaleString("da-DK")} DKK`}
                        </p>
                      </div>
                      <div className="shrink-0 flex flex-col gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/tekstiltryk/design?cartItem=${encodeURIComponent(item.id)}`)}
                        >
                          {lang === "da" ? "Rediger design" : "Edit design"}
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => handleRemove(item.id)}>
                          {lang === "da" ? "Fjern" : "Remove"}
                        </Button>
                      </div>
                    </div>
                    {((item.placementMockups?.length ? item.placementMockups : generatedMockups[item.id] ?? []).length > 0) && (
                      <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
                        {(item.placementMockups?.length ? item.placementMockups : generatedMockups[item.id] ?? []).map((mockup) => (
                          <div key={`${item.id}-${mockup.placementId}`} className="rounded-lg border border-border p-2">
                            <button
                              type="button"
                              className="w-full relative"
                              onClick={() =>
                                setZoomedMockup({
                                  src: mockup.dataUrl,
                                  label: `${item.selectedProductName} · ${getPlacementLabel(mockup.placementId, lang)}`,
                                })
                              }
                            >
                              <img src={mockup.dataUrl} alt="" className="w-full aspect-[3/4] object-contain rounded bg-muted" />
                              <span className="absolute bottom-1 right-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-background/90 text-muted-foreground">
                                <Search size={12} />
                              </span>
                            </button>
                            <p className="mt-1 text-[11px] text-muted-foreground truncate">
                              {getPlacementLabel(mockup.placementId, lang)}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {sortedItems.length > 0 && (
            <div className="mt-4 bg-card rounded-2xl card-shadow p-4">
              <p className="text-sm text-muted-foreground">
                {lang === "da" ? "Designopsætning (ordre)" : "Design setup (order)"}: {orderSetup.setupTotal.toLocaleString("da-DK")} DKK
              </p>
              <p className="text-sm font-medium">
                {lang === "da" ? "Kurv total" : "Cart total"}: {orderTotal.toLocaleString("da-DK")} DKK
              </p>
            </div>
          )}

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
            <Link to="/tekstiltryk/produkter">
              <Button variant="outline" className="w-full">
                {lang === "da" ? "Nyt produkt" : "New product"}
              </Button>
            </Link>
            <Link to="/tekstiltryk/design?checkout=1">
              <Button className="w-full" disabled={sortedItems.length === 0}>
                {lang === "da" ? "Send forespørgsel" : "Send request"}
              </Button>
            </Link>
          </div>
        </div>
      </section>
      <Dialog open={Boolean(zoomedMockup)} onOpenChange={(open) => !open && setZoomedMockup(null)}>
        <DialogContent className="max-w-4xl p-4">
          <DialogTitle className="text-sm">{zoomedMockup?.label ?? ""}</DialogTitle>
          {zoomedMockup?.src && (
            <img
              src={zoomedMockup.src}
              alt={zoomedMockup.label}
              className="w-full max-h-[80vh] object-contain rounded bg-muted"
            />
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Kurv;
