import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";
import { motion } from "framer-motion";
import Layout from "@/components/Layout";
import { CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import PlacementStep, {
  type PlacementDesign,
  defaultPrintAreas,
  emptyDesign,
  getMockupSourceAndTransform,
  getVisualScale,
  resolveAssetPath,
} from "@/components/design/PlacementStep";
import { calculateOrderSetupFromPlacementCount, calculateTotal } from "@/components/design/PriceSummary";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { getProductColors, type ProductColor } from "@/lib/productColors";
import {
  autoBasicTshirtColorMockups,
  autoPerformanceTshirtColorMockups,
  autoPremiumHoodieColorMockups,
  autoStandardHoodieColorMockups,
} from "@/lib/autoTshirtVariants";
import { autoBybLadiesFluffySweatpantsColorMockups } from "@/lib/autoFolderProductVariants";

const steps = [
  { id: "fullFront" },
  { id: "leftSleeve" },
  { id: "rightSleeve" },
  { id: "fullBack" },
];

const stepLabels: Record<string, { da: string; en: string }> = {
  fullFront: { da: "Front", en: "Front" },
  leftSleeve: { da: "Venstre ærme", en: "Left Sleeve" },
  rightSleeve: { da: "Højre ærme", en: "Right Sleeve" },
  fullBack: { da: "Ryg", en: "Back" },
};

const bottomStepLabels: Record<string, { da: string; en: string }> = {
  fullFront: { da: "Front", en: "Front" },
  leftSleeve: { da: "Venstre side", en: "Left Side" },
  rightSleeve: { da: "Højre side", en: "Right Side" },
  fullBack: { da: "Bag", en: "Back" },
};

const isBottomwearProduct = (productId: string) =>
  /(pants|jogger|shorts|bottom|bukser|sweatpants)/i.test(productId);

const productOptions = [
  { value: "basic-tshirt", da: "Russell Basic T-shirt", en: "Russell Basic T-shirt", sizes: ["XS", "S", "M", "L", "XL", "2XL", "3XL"] },
  { value: "heavyweight-tshirt", da: "Russell Heavyweight T-shirt", en: "Russell Heavyweight T-shirt", sizes: ["S", "M", "L", "XL", "2XL"] },
  { value: "performance-tshirt", da: "TriDri Performance T-shirt", en: "TriDri Performance T-shirt", sizes: ["S", "M", "L", "XL", "2XL"] },
  { value: "byb-oversized-acid-wash-tee", da: "Build Your Brand Acid Wash Tee", en: "Build Your Brand Acid Wash Tee", sizes: ["S", "M", "L", "XL", "2XL"] },
  { value: "byb-ladies-fluffy-sweatpants", da: "Build Your Brand, Ladies Fluffy Sweatpants", en: "Build Your Brand, Ladies Fluffy Sweatpants", sizes: ["XS", "S", "M", "L", "XL"] },
  { value: "authentic-sweat", da: "Russell Authentic Sweat", en: "Russell Authentic Sweat", sizes: ["S", "M", "L", "XL", "2XL"] },
  { value: "standard-hoodie", da: "Russell Basic Hoodie", en: "Russell Basic Hoodie", sizes: ["XS", "S", "M", "L", "XL", "2XL"] },
  { value: "premium-hoodie", da: "Russell Premium Hoodie", en: "Russell Premium Hoodie", sizes: ["S", "M", "L", "XL", "2XL"] },
];

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

const getSetupCtaLabel = (productId: string, lang: "da" | "en") => {
  const labelsByType: Record<string, { da: string; en: string }> = {
    tshirt: { da: "Design t-shirt", en: "Design t-shirt" },
    hoodie: { da: "Design hoodie", en: "Design hoodie" },
    sweatpants: { da: "Design sweatpants", en: "Design sweatpants" },
    sweat: { da: "Design sweatshirt", en: "Design sweatshirt" },
  };

  if (/(tshirt|tee)/i.test(productId)) return labelsByType.tshirt[lang];
  if (/hoodie/i.test(productId)) return labelsByType.hoodie[lang];
  if (/sweatpants/i.test(productId)) return labelsByType.sweatpants[lang];
  if (/sweat/i.test(productId)) return labelsByType.sweat[lang];

  return lang === "da" ? "Design produkt" : "Design product";
};

type QuoteFilePayload = {
  cartItemId?: string;
  productId?: string;
  productName?: string;
  colorValue?: string;
  colorName?: string;
  placementId: string;
  placementLabel: string;
  fileName: string;
  dataUrl: string;
  sizeCategory: string;
};

type QuoteMockupPayload = {
  cartItemId: string;
  productId: string;
  productName: string;
  colorValue: string;
  colorName: string;
  placementId: string;
  placementLabel: string;
  fileName: string;
  dataUrl: string;
};

type QuoteFormInputs = {
  name: string;
  company: string;
  address: string;
  email: string;
  phone: string;
  notes: string;
};

type PersistedDesignUploadState = {
  currentStep: number;
  hasEnteredDesign: boolean;
  selectedProduct: string;
  sizeQuantities: Record<string, number>;
  selectedColor: string;
  designs: Record<string, PlacementDesign[]>;
  formInputs: QuoteFormInputs;
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

const DESIGN_UPLOAD_STORAGE_KEY = "trykeksperten:design-upload:v1";
const DESIGN_CART_STORAGE_KEY = "trykeksperten:design-cart:v1";
const defaultFormInputs: QuoteFormInputs = {
  name: "",
  company: "",
  address: "",
  email: "",
  phone: "",
  notes: "",
};

type PlacementImageKey = "fullFront" | "leftSleeve" | "rightSleeve" | "fullBack";

const colorImagesByProduct: Record<string, Record<string, Partial<Record<PlacementImageKey, string>>>> = {
  "basic-tshirt": {
    ...autoBasicTshirtColorMockups,
  },
  "performance-tshirt": {
    ...autoPerformanceTshirtColorMockups,
  },
  "heavyweight-tshirt": {
    ...autoBasicTshirtColorMockups,
    white: {
      fullFront: "/russell-heavyweight-white-front.jpg",
      leftSleeve: "/russell-heavyweight-white-sleeve.jpg",
      rightSleeve: "/russell-heavyweight-white-sleeve.jpg",
      fullBack: "/russell-heavyweight-white-back.jpg",
    },
  },
  "authentic-sweat": {
    white: {
      fullFront: "/russell-authentic-sweat-white-front.jpg",
      leftSleeve: "/russell-authentic-sweat-white-sleeve.jpg",
      rightSleeve: "/russell-authentic-sweat-white-sleeve.jpg",
      fullBack: "/russell-authentic-sweat-white-back.jpg",
    },
    black: {
      fullFront: "/russell-authentic-sweat-black-front.jpg",
      leftSleeve: "/russell-authentic-sweat-black-sleeve.jpg",
      rightSleeve: "/russell-authentic-sweat-black-sleeve.jpg",
      fullBack: "/russell-authentic-sweat-black-back.jpg",
    },
    "french-navy": {
      fullFront: "/russell-authentic-sweat-french-navy-front.jpg",
      leftSleeve: "/russell-authentic-sweat-french-navy-sleeve.jpg",
      rightSleeve: "/russell-authentic-sweat-french-navy-sleeve.jpg",
      fullBack: "/russell-authentic-sweat-french-navy-back.jpg",
    },
    "classic-red": {
      fullFront: "/russell-authentic-sweat-classic-red-front.jpg",
      leftSleeve: "/russell-authentic-sweat-classic-red-sleeve.jpg",
      rightSleeve: "/russell-authentic-sweat-classic-red-sleeve.jpg",
      fullBack: "/russell-authentic-sweat-classic-red-back.jpg",
    },
    "bright-royal": {
      fullFront: "/russell-authentic-sweat-bright-royal-front.jpg",
      leftSleeve: "/russell-authentic-sweat-bright-royal-sleeve.jpg",
      rightSleeve: "/russell-authentic-sweat-bright-royal-sleeve.jpg",
      fullBack: "/russell-authentic-sweat-bright-royal-back.jpg",
    },
    "bottle-green": {
      fullFront: "/russell-authentic-sweat-bottle-green-front.jpg",
      leftSleeve: "/russell-authentic-sweat-bottle-green-sleeve.jpg",
      rightSleeve: "/russell-authentic-sweat-bottle-green-sleeve.jpg",
      fullBack: "/russell-authentic-sweat-bottle-green-back.jpg",
    },
    yellow: {
      fullFront: "/russell-authentic-sweat-yellow-front.jpg",
      leftSleeve: "/russell-authentic-sweat-yellow-sleeve.jpg",
      rightSleeve: "/russell-authentic-sweat-yellow-sleeve.jpg",
      fullBack: "/russell-authentic-sweat-yellow-back.jpg",
    },
    "light-oxford": {
      fullFront: "/russell-authentic-sweat-light-oxford-front.jpg",
      leftSleeve: "/russell-authentic-sweat-light-oxford-sleeve.jpg",
      rightSleeve: "/russell-authentic-sweat-light-oxford-sleeve.jpg",
      fullBack: "/russell-authentic-sweat-light-oxford-back.jpg",
    },
    "indigo-blue": {
      fullFront: "/russell-authentic-sweat-indigo-blue-front.jpg",
      leftSleeve: "/russell-authentic-sweat-indigo-blue-sleeve.jpg",
      rightSleeve: "/russell-authentic-sweat-indigo-blue-sleeve.jpg",
      fullBack: "/russell-authentic-sweat-indigo-blue-back.jpg",
    },
    mocha: {
      fullFront: "/russell-authentic-sweat-mocha-front.jpg",
      leftSleeve: "/russell-authentic-sweat-mocha-sleeve.jpg",
      rightSleeve: "/russell-authentic-sweat-mocha-sleeve.jpg",
      fullBack: "/russell-authentic-sweat-mocha-back.jpg",
    },
    olive: {
      fullFront: "/russell-authentic-sweat-olive-front.jpg",
      leftSleeve: "/russell-authentic-sweat-olive-sleeve.jpg",
      rightSleeve: "/russell-authentic-sweat-olive-sleeve.jpg",
      fullBack: "/russell-authentic-sweat-olive-back.jpg",
    },
    eucalyptus: {
      fullFront: "/russell-authentic-sweat-eucalyptus-front.jpg",
      leftSleeve: "/russell-authentic-sweat-eucalyptus-sleeve.jpg",
      rightSleeve: "/russell-authentic-sweat-eucalyptus-sleeve.jpg",
      fullBack: "/russell-authentic-sweat-eucalyptus-back.jpg",
    },
  },
  "byb-oversized-acid-wash-tee": {
    black: {
      fullFront: "/byb-acid-wash-black-front.avif",
      leftSleeve: "/byb-acid-wash-black-sleeve.avif",
      rightSleeve: "/byb-acid-wash-black-sleeve.avif",
      fullBack: "/byb-acid-wash-black-back.avif",
    },
    asphalt: {
      fullFront: "/byb-acid-wash-asphalt-front.avif",
      leftSleeve: "/byb-acid-wash-asphalt-sleeve.avif",
      rightSleeve: "/byb-acid-wash-asphalt-sleeve.avif",
      fullBack: "/byb-acid-wash-asphalt-back.avif",
    },
    salvia: {
      fullFront: "/byb-acid-wash-salvia-front.avif",
      leftSleeve: "/byb-acid-wash-salvia-sleeve.avif",
      rightSleeve: "/byb-acid-wash-salvia-sleeve.avif",
      fullBack: "/byb-acid-wash-salvia-back.avif",
    },
    "soft-lilac": {
      fullFront: "/byb-acid-wash-soft-lilac-front.avif",
      leftSleeve: "/byb-acid-wash-soft-lilac-sleeve.avif",
      rightSleeve: "/byb-acid-wash-soft-lilac-sleeve.avif",
      fullBack: "/byb-acid-wash-soft-lilac-back.avif",
    },
  },
  "standard-hoodie": {
    ...autoStandardHoodieColorMockups,
  },
  "premium-hoodie": {
    ...autoPremiumHoodieColorMockups,
  },
  "byb-ladies-fluffy-sweatpants": {
    ...autoBybLadiesFluffySweatpantsColorMockups,
  },
};

const getColorPreviewImage = (
  productId: string,
  colorValue: string,
  placementId: PlacementImageKey
): string | undefined => {
  const colorImages = colorImagesByProduct[productId]?.[colorValue];
  const raw = colorImages?.[placementId] ?? colorImages?.fullFront;
  return raw ? resolveAssetPath(raw) : undefined;
};

const DesignUpload = () => {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const persistedState = useMemo(() => readPersistedState(), []);
  const requestedProduct = searchParams.get("product");
  const requestedCartItem = searchParams.get("cartItem");
  const requestedCheckout = searchParams.get("checkout") === "1";
  const isProductLocked = productOptions.some((p) => p.value === requestedProduct);
  const persistedProduct = persistedState?.selectedProduct;
  const defaultProduct = productOptions.some((p) => p.value === requestedProduct)
    ? requestedProduct!
    : productOptions.some((p) => p.value === persistedProduct)
    ? (persistedProduct as string)
    : "basic-tshirt";
  const defaultSizes = productOptions.find((p) => p.value === defaultProduct)?.sizes ?? ["S", "M", "L"];

  const [currentStep, setCurrentStep] = useState(
    clampStepIndex(persistedState?.currentStep ?? 0, steps.length)
  );
  const [hasEnteredDesign, setHasEnteredDesign] = useState(persistedState?.hasEnteredDesign ?? false);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(defaultProduct);
  const [sizeQuantities, setSizeQuantities] = useState<Record<string, number>>(() => ({
    ...createSizeQuantityMap(defaultSizes),
    ...(persistedState?.sizeQuantities ?? {}),
  }));
  const [selectedColor, setSelectedColor] = useState(() => {
    if (persistedState?.selectedColor) return persistedState.selectedColor;
    const colors = getProductColors(defaultProduct);
    return colors.find((color) => color.value === "black")?.value ?? colors[0]?.value ?? "black";
  });
  const [designs, setDesigns] = useState<Record<string, PlacementDesign[]>>(() => {
    const persistedDesigns = sanitizePersistedDesigns(persistedState?.designs);
    if (persistedDesigns) return persistedDesigns;
    const init: Record<string, PlacementDesign[]> = {};
    steps.forEach((s) => { init[s.id] = [emptyDesign()]; });
    return init;
  });
  const [formInputs, setFormInputs] = useState<QuoteFormInputs>(
    persistedState?.formInputs ?? defaultFormInputs
  );
  const [designCart, setDesignCart] = useState<CartDesignEntry[]>(() => readDesignCart());
  const [generatedCartMockups, setGeneratedCartMockups] = useState<
    Record<string, Array<{ placementId: string; placementLabel: string; dataUrl: string }>>
  >({});

  useEffect(() => {
    if (requestedProduct) {
      window.scrollTo({ top: 0, behavior: "auto" });
    }
  }, [requestedProduct]);

  useEffect(() => {
    if (!requestedProduct || !isProductLocked) return;
    // Enter product-specific flow on the setup step first (color + sizes).
    setHasEnteredDesign(false);
    setCurrentStep(0);
  }, [requestedProduct, isProductLocked]);

  useEffect(() => {
    if (!requestedCartItem) return;
    const entry = designCart.find((item) => item.id === requestedCartItem);
    if (!entry) return;
    const sanitized = sanitizePersistedDesigns(entry.designs);
    if (!sanitized) return;
    setSelectedProduct(entry.selectedProduct);
    setSelectedColor(entry.selectedColor);
    setSizeQuantities(entry.sizeQuantities);
    setDesigns(sanitized);
    setHasEnteredDesign(true);
    setCurrentStep(0);
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [requestedCartItem, designCart]);

  const totalSteps = steps.length;
  const isFormStep = hasEnteredDesign && currentStep >= totalSteps;
  const isSetupStep = !hasEnteredDesign;
  const selectedProductOption = useMemo(
    () => productOptions.find((p) => p.value === selectedProduct) ?? productOptions[0],
    [selectedProduct]
  );
  const availableColors = useMemo(() => getProductColors(selectedProduct), [selectedProduct]);
  const quantity = useMemo(
    () => Object.values(sizeQuantities).reduce((sum, value) => sum + value, 0),
    [sizeQuantities]
  );
  const selectedColorData = useMemo(
    () => availableColors.find((color) => color.value === selectedColor) ?? availableColors[0],
    [availableColors, selectedColor]
  );
  const canStartDesign = Boolean(selectedColorData?.value) && quantity > 0;
  const hasReusableCartDesign = useMemo(
    () =>
      designCart.some(
        (entry) =>
          entry.selectedProduct === selectedProduct &&
          entry.selectedColor !== selectedColor &&
          hasAnyUploadedDesign(entry.designs)
      ),
    [designCart, selectedProduct, selectedColor]
  );

  useEffect(() => {
    if (!availableColors.some((color) => color.value === selectedColor)) {
      setSelectedColor(
        availableColors.find((color) => color.value === "black")?.value ?? availableColors[0]?.value ?? "black"
      );
    }
  }, [availableColors, selectedColor]);

  useEffect(() => {
    setSizeQuantities((prev) => {
      const next = createSizeQuantityMap(selectedProductOption.sizes);
      selectedProductOption.sizes.forEach((size) => {
        if (size in prev) next[size] = prev[size];
      });
      return next;
    });
  }, [selectedProductOption.sizes]);

  useEffect(() => {
    try {
      const payload: PersistedDesignUploadState = {
        currentStep,
        hasEnteredDesign,
        selectedProduct,
        sizeQuantities,
        selectedColor,
        designs,
        formInputs,
      };
      localStorage.setItem(DESIGN_UPLOAD_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore storage quota/access errors.
    }
  }, [currentStep, hasEnteredDesign, selectedProduct, sizeQuantities, selectedColor, designs, formInputs]);

  // Count total uploaded designs across all placements
  const allActiveDesigns: { placementId: string; design: PlacementDesign }[] = [];
  Object.entries(designs).forEach(([id, list]) => {
    list.forEach((d) => { if (d.file) allActiveDesigns.push({ placementId: id, design: d }); });
  });

  const activeStepLabels = useMemo(
    () => (isBottomwearProduct(selectedProduct) ? bottomStepLabels : stepLabels),
    [selectedProduct]
  );
  const currentCartId = useMemo(
    () => createOpenDesignId(selectedProduct, selectedColor),
    [selectedProduct, selectedColor]
  );
  const placementLabelsResolved = Object.fromEntries(
    Object.entries(activeStepLabels).map(([k, v]) => [k, v[lang]])
  );
  const livePrice = useMemo(() => calculateTotal(designs, quantity), [designs, quantity]);
  const baseUnitPrice = useMemo(
    () => getBaseUnitPrice(selectedProduct, selectedColor),
    [selectedProduct, selectedColor]
  );
  const garmentTotal = useMemo(() => baseUnitPrice * quantity, [baseUnitPrice, quantity]);
  const grandTotal = useMemo(() => garmentTotal + livePrice.total, [garmentTotal, livePrice.total]);
  const grandTotalExVat = useMemo(() => grandTotal / 1.25, [grandTotal]);
  const cartItemCount = useMemo(() => designCart.length, [designCart]);
  const cartTotalQuantity = useMemo(
    () => designCart.reduce((sum, entry) => sum + (Number(entry.totalQuantity) || 0), 0),
    [designCart]
  );
  const cartLogoCount = useMemo(
    () => designCart.reduce((sum, entry) => sum + (entry.logoItems?.length ?? 0), 0),
    [designCart]
  );
  const cartGarmentTotal = useMemo(
    () =>
      designCart.reduce(
        (sum, entry) =>
          sum +
          getBaseUnitPrice(entry.selectedProduct, entry.selectedColor) *
            (Number(entry.totalQuantity) || 0),
        0
      ),
    [designCart]
  );
  const cartSetupSummary = useMemo(
    () =>
      calculateOrderSetupFromPlacementCount(
        designCart.reduce((sum, entry) => sum + (entry.logoItems?.length ?? 0), 0)
      ),
    [designCart]
  );
  const cartPrintTotal = useMemo(
    () =>
      designCart.reduce(
        (sum, entry) =>
          sum + calculateTotal(entry.designs, Number(entry.totalQuantity) || 0).printTotal,
        0
      ),
    [designCart]
  );
  const cartGrandTotal = useMemo(
    () => cartGarmentTotal + cartSetupSummary.setupTotal + cartPrintTotal,
    [cartGarmentTotal, cartSetupSummary.setupTotal, cartPrintTotal]
  );
  const cartGrandTotalExVat = useMemo(() => cartGrandTotal / 1.25, [cartGrandTotal]);

  useEffect(() => {
    if (!requestedCheckout) return;
    if (designCart.length === 0) return;
    const latest = designCart.slice().sort((a, b) => b.updatedAt - a.updatedAt)[0];
    const sanitized = sanitizePersistedDesigns(latest.designs);
    if (sanitized) {
      setSelectedProduct(latest.selectedProduct);
      setSelectedColor(latest.selectedColor);
      setSizeQuantities(latest.sizeQuantities);
      setDesigns(sanitized);
    }
    setHasEnteredDesign(true);
    setCurrentStep(totalSteps);
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [requestedCheckout, designCart, totalSteps]);
  const printBreakdownLines = useMemo(() => {
    if (livePrice.details.length === 0 || quantity === 0) return [];

    const groupedByPrintPrice = new Map<number, number>();
    livePrice.details.forEach((detail) => {
      groupedByPrintPrice.set(detail.printPrice, (groupedByPrintPrice.get(detail.printPrice) ?? 0) + 1);
    });

    return Array.from(groupedByPrintPrice.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([printPrice, logoCount]) => {
        const totalPrints = logoCount * quantity;
        const priceLabel = `${printPrice} DKK`;
        if (lang === "da") {
          return `${totalPrints} stk (${logoCount} logo${logoCount > 1 ? "er" : ""} × ${quantity} stk) × ${priceLabel}`;
        }
        return `${totalPrints} pcs (${logoCount} logo${logoCount > 1 ? "s" : ""} × ${quantity} pcs) × ${priceLabel}`;
      });
  }, [livePrice.details, quantity, lang]);
  const cartPrintBreakdownLines = useMemo(() => {
    const groupedByPrintPrice = new Map<number, number>();
    designCart.forEach((entry) => {
      const qty = Number(entry.totalQuantity) || 0;
      if (qty <= 0) return;
      const pricing = calculateTotal(entry.designs, qty);
      pricing.details.forEach((detail) => {
        groupedByPrintPrice.set(
          detail.printPrice,
          (groupedByPrintPrice.get(detail.printPrice) ?? 0) + qty
        );
      });
    });
    return Array.from(groupedByPrintPrice.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([printPrice, totalPrints]) =>
        lang === "da"
          ? `${totalPrints} stk × ${printPrice} DKK`
          : `${totalPrints} pcs × ${printPrice} DKK`
      );
  }, [designCart, lang]);
  const stepControls = (
    <div className="overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="flex min-w-max items-center gap-2 whitespace-nowrap">
      {steps.map((s, i) => {
        const hasDesign = designs[s.id].some(d => d.file !== null);
        const designCount = designs[s.id].filter(d => d.file !== null).length;
        return (
          <button
            key={s.id}
            onClick={() => goToStep(i)}
            className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              currentStep === i
                ? "bg-primary text-primary-foreground"
                : hasDesign
                ? "bg-primary/20 text-primary"
                : "bg-muted text-muted-foreground"
            }`}
          >
            <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs bg-background/20">
              {i + 1}
            </span>
            {activeStepLabels[s.id][lang]}
            {hasDesign && (
              <span className="flex items-center gap-1">
                <CheckCircle2 size={14} />
                {designCount > 1 && <span className="text-xs">×{designCount}</span>}
              </span>
            )}
          </button>
        );
      })}
      </div>
    </div>
  );
  const stepNavigationControls = !isSetupStep && !isFormStep ? (
    <div className="flex w-full gap-3 xl:w-auto">
      {currentStep === 0 && (
        <Button
          variant="outline"
          onClick={() => {
            setHasEnteredDesign(false);
            setCurrentStep(0);
          }}
          className="flex-1 xl:flex-none"
        >
          <ChevronLeft size={16} />
          {lang === "da" ? "Tilbage til farve og størrelser" : "Back to color and sizes"}
        </Button>
      )}
      {currentStep > 0 && (
        <Button variant="outline" onClick={() => goToStep(currentStep - 1)} className="flex-1 xl:flex-none">
          <ChevronLeft size={16} />
          {lang === "da" ? "Forrige" : "Previous"}
        </Button>
      )}
      {currentStep < totalSteps && (
        <Button
          onClick={() => {
            if (currentStep < totalSteps - 1) {
              goToStep(currentStep + 1);
              return;
            }
            void handleAddColorDesignToCart();
          }}
          className="flex-1 xl:flex-none"
        >
          {currentStep < totalSteps - 1
            ? (lang === "da" ? "Næste placering" : "Next Placement")
            : (lang === "da" ? "Tilføj til kurv" : "Add to cart")}
          <ChevronRight size={16} />
        </Button>
      )}
    </div>
  ) : null;

  const handleDesignsChange = (id: string, newDesigns: PlacementDesign[]) => {
    setDesigns((prev) => ({ ...prev, [id]: newDesigns }));
  };

  const handleSizeQuantityChange = (size: string, value: number) => {
    setSizeQuantities((prev) => ({
      ...prev,
      [size]: Math.max(0, Number.isFinite(value) ? value : 0),
    }));
  };

  const goToStep = (nextStep: number) => {
    setCurrentStep(nextStep);
  };

  const handleProductChange = (nextProduct: string) => {
    if (nextProduct === selectedProduct) return;
    setSelectedProduct(nextProduct);
    setHasEnteredDesign(false);
    setCurrentStep(0);
    setDesigns(createEmptyDesignMap());

    const params = new URLSearchParams(searchParams);
    params.set("product", nextProduct);
    params.delete("cartItem");
    params.delete("checkout");
    navigate(`${location.pathname}?${params.toString()}`, { replace: true });
  };

  const handleSelectColor = (nextColor: string) => {
    if (nextColor === selectedColor) return;

    const existing = designCart.find(
      (entry) => entry.selectedProduct === selectedProduct && entry.selectedColor === nextColor
    );
    setSelectedColor(nextColor);
    if (existing) {
      const restored = sanitizePersistedDesigns(existing.designs);
      if (restored) setDesigns(restored);
      setSizeQuantities(existing.sizeQuantities);
    } else {
      setDesigns(createEmptyDesignMap());
      setSizeQuantities(createSizeQuantityMap(selectedProductOption.sizes));
    }
    setCurrentStep(0);
  };

  const handleGoToDesignStep = () => {
    if (quantity <= 0) {
      toast.error(lang === "da" ? "Angiv antal i mindst én størrelse" : "Please set quantity for at least one size");
      return;
    }
    setHasEnteredDesign(true);
    setCurrentStep(0);
  };

  const handleBackToTekstiltryk = () => {
    navigate("/tekstiltryk");
  };

  const handleDoneWithDesign = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setCurrentStep(totalSteps);
  };

  const handleAddColorDesignToCart = async () => {
    if (quantity <= 0) {
      toast.error(lang === "da" ? "Angiv antal i mindst én størrelse" : "Please set quantity for at least one size");
      return;
    }

    const entryBase: CartDesignEntry = {
      id: currentCartId,
      selectedProduct,
      selectedProductName: selectedProductOption[lang],
      selectedColor,
      selectedColorName: selectedColorData?.[lang] ?? selectedColor,
      sizeQuantities,
      totalQuantity: quantity,
      placementsUsed: getUsedPlacements(designs),
      logoItems: getLogoItems(designs),
      uploadedFileRefs: getUploadedFileRefs(designs),
      mockupRef: `${selectedProduct}::${selectedColor}`,
      designs,
      updatedAt: Date.now(),
    };
    const generatedMockups = await buildMockupsForEntry(entryBase, lang);
    const previewMockupDataUrl = generatedMockups[0]?.dataUrl;
    const entry: CartDesignEntry = {
      ...entryBase,
      previewMockupDataUrl,
      placementMockups: generatedMockups.map((mockup) => ({
        placementId: mockup.placementId,
        placementLabel: mockup.placementLabel,
        dataUrl: mockup.dataUrl,
      })),
    };

    setDesignCart((prev) => {
      const next = upsertCartDesign(prev, entry);
      writeDesignCart(next);
      return next;
    });

    toast.success(lang === "da" ? "Tilføjet til kurv" : "Added to cart");
    setDesigns(createEmptyDesignMap());
    setSizeQuantities(createSizeQuantityMap(selectedProductOption.sizes));
    setCurrentStep(0);
  };

  const handleReusePreviousDesign = () => {
    const previous = designCart
      .filter((entry) => entry.selectedProduct === selectedProduct)
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .find((entry) => hasAnyUploadedDesign(entry.designs));

    if (!previous) {
      toast.error(lang === "da" ? "Ingen tidligere design fundet for dette produkt" : "No previous design found for this product");
      return;
    }

    const cloned = sanitizePersistedDesigns(previous.designs);
    if (!cloned) return;
    setDesigns(cloned);
    setHasEnteredDesign(true);
    setCurrentStep(0);
    toast.success(lang === "da" ? "Tidligere design er genbrugt" : "Previous design has been reused");
  };

  const handleEditCartItem = (entry: CartDesignEntry) => {
    const sanitized = sanitizePersistedDesigns(entry.designs);
    if (!sanitized) return;
    if (isProductLocked && entry.selectedProduct !== selectedProduct) {
      toast.error(lang === "da" ? "Vælg en kurvlinje for dette produkt" : "Select a cart item for this product");
      return;
    }
    setSelectedProduct(entry.selectedProduct);
    setSelectedColor(entry.selectedColor);
    setSizeQuantities(entry.sizeQuantities);
    setDesigns(sanitized);
    setHasEnteredDesign(true);
    setCurrentStep(0);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleRemoveCartItem = (entryId: string) => {
    setDesignCart((prev) => {
      const next = prev.filter((entry) => entry.id !== entryId);
      writeDesignCart(next);
      return next;
    });
  };

  useEffect(() => {
    writeDesignCart(designCart);
  }, [designCart]);

  useEffect(() => {
    let cancelled = false;
    const missing = designCart.filter((entry) => !entry.placementMockups || entry.placementMockups.length === 0);
    if (missing.length === 0) return;

    (async () => {
      const next: Record<string, Array<{ placementId: string; placementLabel: string; dataUrl: string }>> = {};
      for (const entry of missing) {
        const placements = getUsedPlacements(entry.designs);
        const mocks: Array<{ placementId: string; placementLabel: string; dataUrl: string }> = [];
        for (const placementId of placements) {
          try {
            const dataUrl = await drawPlacementMockup(entry, placementId);
            if (!dataUrl) continue;
            mocks.push({
              placementId,
              placementLabel: getPlacementLabel(placementId, lang),
              dataUrl,
            });
          } catch {
            // Ignore per-placement generation errors.
          }
        }
        next[entry.id] = mocks;
      }
      if (!cancelled) {
        setGeneratedCartMockups((prev) => ({ ...prev, ...next }));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [designCart, lang]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (designCart.length === 0) {
      toast.error(lang === "da" ? "Tilføj mindst én vare til kurven" : "Add at least one item to the cart");
      return;
    }

    const formData = new FormData(e.currentTarget);
    const name = String(formData.get("name") ?? formInputs.name).trim();
    const email = String(formData.get("email") ?? formInputs.email).trim();
    const phone = String(formData.get("phone") ?? formInputs.phone).trim();
    const company = String(formData.get("company") ?? formInputs.company).trim();
    const address = String(formData.get("address") ?? formInputs.address).trim();
    const notes = String(formData.get("notes") ?? formInputs.notes).trim();

    if (name.length < 2) {
      toast.error(lang === "da" ? "Indtast et gyldigt navn" : "Please enter a valid name");
      return;
    }

    const emailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailIsValid) {
      toast.error(lang === "da" ? "Indtast en gyldig email" : "Please enter a valid email");
      return;
    }

    if (phone && phone.replace(/[^\d+]/g, "").length < 8) {
      toast.error(lang === "da" ? "Indtast et gyldigt telefonnummer" : "Please enter a valid phone number");
      return;
    }

    const quoteFiles: QuoteFilePayload[] = designCart.flatMap((entry) =>
      entry.logoItems
        .filter((logo) => Boolean(logo.fileRef))
        .map((logo) => ({
          cartItemId: entry.id,
          productId: entry.selectedProduct,
          productName: entry.selectedProductName,
          colorValue: entry.selectedColor,
          colorName: entry.selectedColorName,
          placementId: logo.placementId,
          placementLabel: getPlacementLabel(logo.placementId, lang),
          fileName: logo.fileName || "design-file",
          dataUrl: logo.fileRef,
          sizeCategory: logo.sizeCategory,
        }))
    );

    try {
      setIsSubmitting(true);
      const generatedMockups = (
        await Promise.all(designCart.map((entry) => buildMockupsForEntry(entry, lang)))
      ).flat();
      const totalPlacementSetups = designCart.reduce((sum, entry) => sum + entry.logoItems.length, 0);
      const orderSetup = calculateOrderSetupFromPlacementCount(totalPlacementSetups);
      const orderGarmentTotal = designCart.reduce(
        (sum, entry) =>
          sum + getBaseUnitPrice(entry.selectedProduct, entry.selectedColor) * entry.totalQuantity,
        0
      );
      const orderPrintTotal = designCart.reduce(
        (sum, entry) => sum + calculateTotal(entry.designs, entry.totalQuantity).printTotal,
        0
      );
      const orderTotalIncVat = orderGarmentTotal + orderSetup.setupTotal + orderPrintTotal;
      const orderTotalExVat = orderTotalIncVat / 1.25;
      const response = await fetch("/api/quote-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lang,
          customer: { name, email, phone, company, address, notes },
          cartItems: designCart.map((entry) => ({
            id: entry.id,
            productId: entry.selectedProduct,
            productName: entry.selectedProductName,
            colorValue: entry.selectedColor,
            colorName: entry.selectedColorName,
            sizeBreakdown: entry.sizeQuantities,
            quantity: entry.totalQuantity,
            placements: entry.placementsUsed,
            placementCount: entry.placementsUsed.length,
            logoCount: entry.logoItems.length,
            logoItems: entry.logoItems,
            uploadedFileRefs: entry.uploadedFileRefs,
            mockupRef: entry.mockupRef,
          })),
          order: {
            productId: designCart[0]?.selectedProduct ?? selectedProduct,
            productName: designCart[0]?.selectedProductName ?? selectedProductOption[lang],
            colorValue: designCart[0]?.selectedColor ?? selectedColorData?.value ?? selectedColor,
            colorName: designCart[0]?.selectedColorName ?? selectedColorData?.[lang] ?? selectedColor,
            quantity: designCart.reduce((sum, entry) => sum + entry.totalQuantity, 0),
            sizeBreakdown: designCart.reduce<Record<string, number>>((acc, entry) => {
              Object.entries(entry.sizeQuantities).forEach(([size, qty]) => {
                acc[size] = (acc[size] ?? 0) + (Number(qty) || 0);
              });
              return acc;
            }, {}),
            placements: Array.from(new Set(quoteFiles.map((file) => file.placementId))),
            placementCount: Array.from(new Set(quoteFiles.map((file) => file.placementId))).length,
            logoCount: orderSetup.placementCount,
            pricing: {
              garmentTotal: orderGarmentTotal,
              setupTotal: orderSetup.setupTotal,
              printTotal: orderPrintTotal,
              totalIncVat: orderTotalIncVat,
              totalExVat: orderTotalExVat,
              firstPlacementFree: false,
            },
          },
          files: quoteFiles,
          mockups: generatedMockups,
        }),
      });

      const result = await response.json().catch(() => null);
      if (!response.ok) {
        const fallback = lang === "da" ? "Kunne ikke sende forespørgslen. Prøv igen." : "Could not send request. Please try again.";
        throw new Error(result?.error || fallback);
      }

      setSubmitted(true);
      clearPersistedState();
      setDesignCart([]);
      writeDesignCart([]);
      toast.success(t("designPage.success"));
    } catch (error) {
      const message = error instanceof Error ? error.message : (lang === "da" ? "Der opstod en fejl" : "An error occurred");
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentPriceCard = (
    <div className="rounded-2xl bg-primary p-5 text-primary-foreground">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide opacity-90">
            {lang === "da" ? "Aktuel pris" : "Current price"}
          </p>
          <p className="text-sm opacity-95">
            {isFormStep
              ? `${lang === "da" ? "Varer" : "Items"}: ${cartItemCount} • ${lang === "da" ? "Logoer" : "Logos"}: ${cartLogoCount} • ${lang === "da" ? "Antal" : "Quantity"}: ${cartTotalQuantity}`
              : `${selectedProductOption[lang]} • ${lang === "da" ? "Logoer" : "Logos"}: ${allActiveDesigns.length} • ${lang === "da" ? "Antal" : "Quantity"}: ${quantity}`}
          </p>
          {(isFormStep ? cartLogoCount === 0 : allActiveDesigns.length === 0) && (
            <p className="mt-1 text-xs opacity-90">
              {lang === "da" ? "Upload logo for at få prisestimat." : "Upload a logo to get a price estimate."}
            </p>
          )}
        </div>
        <div className="text-left sm:text-right">
          <p className="text-xs opacity-90">
            {lang === "da" ? "Tøj i alt" : "Garments total"}: {(isFormStep ? cartGarmentTotal : garmentTotal).toLocaleString("da-DK")} DKK
          </p>
          <p className="text-xs opacity-90">
            {lang === "da" ? "Designopsætning i alt" : "Design setup total"}: {(isFormStep ? cartSetupSummary.setupTotal : livePrice.setupTotal).toLocaleString("da-DK")} DKK
          </p>
          <p className="text-xs opacity-90">
            {lang === "da" ? "Tryk i alt (logo + størrelse)" : "Print total (logo + size)"}: {(isFormStep ? cartPrintTotal : livePrice.printTotal).toLocaleString("da-DK")} DKK
          </p>
          {(isFormStep ? cartPrintBreakdownLines : printBreakdownLines).map((line) => (
            <p key={line} className="text-[11px] opacity-90">
              {line}
            </p>
          ))}
          <p className="text-xs opacity-90 mt-1">{lang === "da" ? "Estimeret total" : "Estimated total"}</p>
          <p className="text-2xl font-bold">{(isFormStep ? cartGrandTotal : grandTotal).toLocaleString("da-DK")} DKK</p>
          <p className="text-[11px] opacity-90 mt-1">
            {lang === "da" ? "Alle priser er inkl. moms" : "All prices include VAT"}
          </p>
          <p className="text-[11px] opacity-90">
            {lang === "da" ? "Pris ekskl. moms:" : "Price excl. VAT:"}{" "}
            {(isFormStep ? cartGrandTotalExVat : grandTotalExVat).toLocaleString("da-DK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DKK
          </p>
        </div>
      </div>
    </div>
  );

  if (submitted) {
    return (
      <Layout>
        <section className="py-24">
          <div className="container mx-auto px-4 lg:px-8 text-center">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
              <CheckCircle2 size={64} className="text-primary mx-auto mb-6" />
              <h1 className="text-3xl font-bold mb-4">{t("designPage.success")}</h1>
            </motion.div>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Hero */}
      <section className="py-6 md:py-8 bg-gradient-to-br from-accent/50 to-background">
        <div className="container mx-auto px-4 lg:px-8">
          <motion.div className="max-w-2xl" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] as const }}>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {isFormStep
                ? t("designPage.title")
                : lang === "da"
                ? "Vælg farve og antal"
                : "Unleash your inner designer!"}
            </h1>
            <p className="text-lg text-muted-foreground">
              {isFormStep
                ? ""
                : lang === "da"
                ? "Upload dit design · Vælg størrelse · Placer trykket"
                : "Upload your design · Choose size · Place the print"}
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-6 md:py-8">
        <div className="container mx-auto px-4 lg:px-8">
          {!isFormStep && hasEnteredDesign && (
            <div className="mb-4 space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                {selectedColorData && (
                  <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground">
                    <span className="inline-block h-3 w-3 rounded-full border border-black/20" style={{ backgroundColor: selectedColorData.hex }} />
                    {lang === "da" ? `Valgt farve: ${selectedColorData.da}` : `Selected color: ${selectedColorData.en}`}
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div className="min-w-0 xl:flex-1">{stepControls}</div>
                {stepNavigationControls}
              </div>
            </div>
          )}

          <div className={`grid gap-8 ${isSetupStep ? "grid-cols-1" : "lg:grid-cols-[minmax(0,2fr)_minmax(280px,0.9fr)] lg:items-start"}`}>
            {/* Preview / Form */}
            <div className="order-1">
              <motion.div key={currentStep} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
              {!isFormStep && hasEnteredDesign ? (
                <PlacementStep
                  placementId={steps[currentStep].id}
                  label={activeStepLabels[steps[currentStep].id][lang]}
                  productId={selectedProduct}
                  selectedColor={selectedColorData}
                  designs={designs[steps[currentStep].id]}
                  showHeader={false}
                  showColorBadge={false}
                  onDesignsChange={(d) => handleDesignsChange(steps[currentStep].id, d)}
                />
              ) : isSetupStep ? (
                <></>
              ) : (
                <div>
                  <h2 className="text-2xl font-bold mb-6">{t("designPage.formTitle")}</h2>
                  <div className="mb-4 rounded-xl border border-border bg-card p-4">
                    <h4 className="text-sm font-semibold mb-2">
                      {lang === "da" ? "Kurvoversigt" : "Cart Summary"}
                    </h4>
                    <div className="mb-2 flex justify-end mr-1">
                      <Link to="/kurv">
                        <Button type="button" variant="outline" size="sm">
                          {lang === "da" ? "Tilbage for at ændre i kurven" : "Back to edit cart"}
                        </Button>
                      </Link>
                    </div>
                    {designCart.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        {lang === "da" ? "Kurven er tom. Tilføj mindst én vare." : "Cart is empty. Add at least one item."}
                      </p>
                    ) : (
                      <div className="space-y-1.5">
                        {designCart
                          .slice()
                          .sort((a, b) => b.updatedAt - a.updatedAt)
                          .map((entry) => {
                            return (
                              <div key={entry.id} className="rounded-lg border border-border px-3 py-2">
                                <p className="text-xs font-medium truncate">{entry.selectedProductName} · {entry.selectedColorName}</p>
                                <p className="text-[11px] text-muted-foreground">
                                  {lang === "da" ? "Antal:" : "Qty:"} {entry.totalQuantity} · {lang === "da" ? "Størrelser:" : "Sizes:"} {serializeSizeBreakdown(entry.sizeQuantities)}
                                </p>
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <FormField
                      label={t("designPage.name")}
                      name="name"
                      value={formInputs.name}
                      onChange={(value) => setFormInputs((prev) => ({ ...prev, name: value }))}
                      required
                    />
                    <FormField
                      label={t("designPage.company")}
                      name="company"
                      value={formInputs.company}
                      onChange={(value) => setFormInputs((prev) => ({ ...prev, company: value }))}
                    />
                    <FormField
                      label={t("designPage.address")}
                      name="address"
                      value={formInputs.address}
                      onChange={(value) => setFormInputs((prev) => ({ ...prev, address: value }))}
                    />
                    <FormField
                      label={t("designPage.email")}
                      name="email"
                      type="email"
                      value={formInputs.email}
                      onChange={(value) => setFormInputs((prev) => ({ ...prev, email: value }))}
                      required
                    />
                    <FormField
                      label={t("designPage.phone")}
                      name="phone"
                      type="tel"
                      value={formInputs.phone}
                      onChange={(value) => setFormInputs((prev) => ({ ...prev, phone: value }))}
                    />

                    <div>
                      <label className="block text-sm font-medium mb-1.5">{t("designPage.notes")}</label>
                      <textarea
                        name="notes"
                        rows={4}
                        value={formInputs.notes}
                        onChange={(e) => setFormInputs((prev) => ({ ...prev, notes: e.target.value }))}
                        className="w-full bg-card rounded-lg px-3 py-2 text-sm ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2 outline-none resize-none card-shadow"
                      />
                    </div>
                    <OrderSummary
                      lang={lang}
                      productName={selectedProductOption[lang]}
                    />
                    <input type="hidden" name="product" value={selectedProduct} />
                    <input type="hidden" name="color" value={selectedColorData?.[lang] ?? selectedColor} />
                    <input type="hidden" name="sizeBreakdown" value={serializeSizeBreakdown(sizeQuantities)} />

                    {isFormStep && currentPriceCard}

                    <Button type="submit" variant="hero" size="lg" className="w-full">
                      {t("designPage.submit")}
                    </Button>
                  </form>
                </div>
              )}
              </motion.div>
            </div>

            {/* Product controls / summary */}
            <div className="order-2 space-y-6">
              {!isFormStep && (
                <div className="space-y-6">
                  <div className="bg-card rounded-2xl card-shadow p-4">
                    <div className="space-y-4">
                      {isSetupStep && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleBackToTekstiltryk}
                        >
                          <ChevronLeft size={16} />
                          {lang === "da" ? "Tilbage" : "Back"}
                        </Button>
                      )}
                      <div>
                        <label className="block text-xs font-medium mb-1">{t("designPage.product")}</label>
                        <select
                          value={selectedProduct}
                          onChange={(e) => handleProductChange(e.target.value)}
                          className="w-full h-10 bg-card rounded-lg px-2.5 text-xs ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2 outline-none card-shadow"
                        >
                          {productOptions.map((p) => (
                            <option key={p.value} value={p.value}>{p[lang]}</option>
                          ))}
                        </select>
                      </div>

                      {!hasEnteredDesign ? (
                        <>
                          <div>
                            <label className="block text-xs font-medium mb-1.5">
                              {lang === "da" ? "Vælg tøjfarve" : "Choose garment color"}
                            </label>
                            <ColorPicker
                              productId={selectedProduct}
                              colors={availableColors}
                              selectedColor={selectedColor}
                              lang={lang}
                              onSelect={handleSelectColor}
                            />
                            {hasReusableCartDesign && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="mt-2 w-full"
                                onClick={handleReusePreviousDesign}
                              >
                                {lang === "da" ? "Placér som før" : "Use previous placement"}
                              </Button>
                            )}
                          </div>
                          <div>
                            <label className="block text-xs font-medium mb-1.5">
                              {lang === "da" ? "Størrelser og antal" : "Sizes and quantities"}
                            </label>
                            <SizeQuantityPicker
                              lang={lang}
                              sizes={selectedProductOption.sizes}
                              quantities={sizeQuantities}
                              onChange={handleSizeQuantityChange}
                            />
                            <p className="mt-1.5 text-[11px] text-muted-foreground">
                              {lang === "da" ? `Samlet antal: ${quantity}` : `Total quantity: ${quantity}`}
                            </p>
                          </div>
                        </>
                      ) : (
                        <div>
                          <label className="block text-xs font-medium mb-1.5">
                            {lang === "da" ? "Uploadede designfiler" : "Uploaded design files"}
                          </label>
                          {allActiveDesigns.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                              {lang === "da"
                                ? "Du har ikke uploadet et design endnu. Du kan fortsætte uden tryk eller uploade et logo."
                                : "You haven't uploaded a design yet. You can continue without print or upload a logo."}
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {allActiveDesigns.map(({ placementId, design }, i) => {
                                const placementDesigns = designs[placementId].filter((d) => d.file);
                                const logoNum = placementDesigns.length > 1
                                  ? ` – Logo ${designs[placementId].indexOf(design) + 1}`
                                  : "";
                                return (
                                  <div key={`${placementId}-${i}`} className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                                    <img src={design.file!} alt="" className="w-8 h-8 object-contain rounded" />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-medium truncate">{placementLabelsResolved[placementId]}{logoNum}</p>
                                      <p className="text-[11px] text-muted-foreground truncate">{design.fileName}</p>
                                    </div>
                                    <CheckCircle2 size={14} className="text-primary shrink-0" />
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {isSetupStep && (
                    <Button onClick={handleGoToDesignStep} className="w-full" disabled={!canStartDesign}>
                      {getSetupCtaLabel(selectedProduct, lang)}
                      <ChevronRight size={16} />
                    </Button>
                  )}

                  {/* Pricing info */}
                  <div className="bg-card rounded-2xl card-shadow p-4">
                    <h3 className="text-base font-bold mb-2">
                      {lang === "da" ? "Prisstruktur" : "Pricing Structure"}
                    </h3>
                    <div className="space-y-1.5 text-xs text-muted-foreground">
                      <p>
                        <span className="font-medium text-foreground">{lang === "da" ? "Designopsætning (første logo):" : "Design setup (first logo):"}</span>{" "}
                        299 DKK
                      </p>
                      <p>
                        <span className="font-medium text-foreground">{lang === "da" ? "Ekstra designopsætning (nye logoer):" : "Additional design setup (new logos):"}</span>{" "}
                        150 DKK
                      </p>
                      <div className="border-t border-border pt-2 mt-2">
                        <p className="font-medium text-foreground mb-1">{lang === "da" ? "Trykpris pr. stk:" : "Print price per unit:"}</p>
                        <p>1–6 cm: 35 DKK</p>
                        <p>6–12 cm: 40 DKK</p>
                        <p>12–20 cm: 45 DKK</p>
                        <p>20–40 cm: 55 DKK</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {!isFormStep && currentPriceCard}

              {!isFormStep && hasEnteredDesign && (
                <Button
                  type="button"
                  onClick={handleAddColorDesignToCart}
                  className="w-full"
                >
                  {lang === "da" ? "Tilføj til kurv" : "Add to cart"}
                </Button>
              )}
              {!isFormStep && hasEnteredDesign && (
                <p className="text-xs text-muted-foreground text-center">
                  {lang === "da"
                    ? "Du kan springe placeringer over, hvis du ikke ønsker tryk der."
                    : "You can skip placements if you don't want a print there."}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

const FormField = ({
  label,
  name,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) => (
  <div>
    <label className="block text-sm font-medium mb-1.5">{label}</label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      className="w-full h-11 bg-card rounded-lg px-3 text-sm ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2 outline-none card-shadow"
    />
  </div>
);

const ColorPicker = ({
  productId,
  colors,
  selectedColor,
  lang,
  onSelect,
}: {
  productId: string;
  colors: ProductColor[];
  selectedColor: string;
  lang: "da" | "en";
  onSelect: (value: string) => void;
}) => {
  const [hoverPlacementByColor, setHoverPlacementByColor] = useState<Record<string, PlacementImageKey>>({});
  const hoverPreviewOrder: PlacementImageKey[] = ["leftSleeve", "fullBack", "rightSleeve", "fullFront"];

  useEffect(() => {
    setHoverPlacementByColor({});
  }, [productId, selectedColor]);

  const handleMouseMove = (event: React.MouseEvent<HTMLButtonElement>, colorValue: string, active: boolean) => {
    if (active) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    if (!bounds.width) return;
    const relativeX = (event.clientX - bounds.left) / bounds.width;
    const clamped = Math.max(0, Math.min(0.9999, relativeX));
    const index = Math.floor(clamped * hoverPreviewOrder.length);
    const nextPlacement = hoverPreviewOrder[index];
    setHoverPlacementByColor((prev) =>
      prev[colorValue] === nextPlacement ? prev : { ...prev, [colorValue]: nextPlacement }
    );
  };

  const clearHoverPreview = (colorValue: string) => {
    setHoverPlacementByColor((prev) => {
      if (!(colorValue in prev)) return prev;
      const next = { ...prev };
      delete next[colorValue];
      return next;
    });
  };

  const handleSelectColor = (colorValue: string) => {
    setHoverPlacementByColor({});
    onSelect(colorValue);
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5">
        {colors.map((color) => {
          const active = color.value === selectedColor;
          const placementToShow = active ? "fullFront" : hoverPlacementByColor[color.value] ?? "fullFront";
          const previewImage = getColorPreviewImage(productId, color.value, placementToShow);
          return (
            <button
              key={color.value}
              type="button"
              onClick={() => handleSelectColor(color.value)}
              onMouseMove={(event) => handleMouseMove(event, color.value, active)}
              onMouseLeave={() => clearHoverPreview(color.value)}
              className={`group rounded-md border p-1.5 transition-all aspect-[3/4] flex flex-col ${
                active ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-primary/40"
              }`}
              title={color[lang]}
            >
              <span className="block w-full h-full min-h-0">
                {previewImage ? (
                  <img src={previewImage} alt={color[lang]} className="block w-full h-full rounded-sm border border-black/10 object-contain bg-muted/20" loading="lazy" />
                ) : (
                  <span className="block w-full h-full rounded-sm border border-black/10" style={{ backgroundColor: color.hex }} />
                )}
              </span>
              <span className="mt-1 block text-[10px] text-center text-muted-foreground truncate">{color[lang]}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

const SizeQuantityPicker = ({
  lang,
  sizes,
  quantities,
  onChange,
}: {
  lang: "da" | "en";
  sizes: string[];
  quantities: Record<string, number>;
  onChange: (size: string, value: number) => void;
}) => (
  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
    {sizes.map((size) => (
      <div key={size} className="rounded-md border border-border p-1.5 bg-card">
        <label className="block text-[11px] font-medium text-muted-foreground mb-1">{size}</label>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={String(quantities[size] ?? 0)}
          onChange={(e) => {
            const digitsOnly = e.target.value.replace(/\D+/g, "");
            onChange(size, digitsOnly === "" ? 0 : Number(digitsOnly));
          }}
          className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs outline-none focus:ring-2 focus:ring-ring"
          aria-label={`${lang === "da" ? "Antal" : "Quantity"} ${size}`}
        />
      </div>
    ))}
  </div>
);

const OrderSummary = ({
  lang,
  productName,
}: {
  lang: "da" | "en";
  productName: string;
}) => {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h4 className="text-sm font-semibold mb-2">
        {lang === "da" ? "Opsummering af bestilling" : "Order Summary"}
      </h4>
      <div className="space-y-1 text-sm text-muted-foreground">
        <p><span className="text-foreground font-medium">{lang === "da" ? "Produkt:" : "Product:"}</span> {productName}</p>
      </div>
    </div>
  );
};

export default DesignUpload;

const createSizeQuantityMap = (sizes: string[]): Record<string, number> =>
  Object.fromEntries(sizes.map((size) => [size, 0]));

const createEmptyDesignMap = (): Record<string, PlacementDesign[]> =>
  Object.fromEntries(steps.map((step) => [step.id, [emptyDesign()]]));

const serializeSizeBreakdown = (quantities: Record<string, number>): string =>
  Object.entries(quantities)
    .filter(([, qty]) => qty > 0)
    .map(([size, qty]) => `${size}:${qty}`)
    .join(", ");

const clampStepIndex = (step: number, maxBaseSteps: number) => {
  const max = maxBaseSteps;
  if (!Number.isFinite(step)) return 0;
  return Math.max(0, Math.min(max, Math.floor(step)));
};

const sanitizePersistedDesigns = (
  value: PersistedDesignUploadState["designs"] | undefined
): Record<string, PlacementDesign[]> | null => {
  if (!value || typeof value !== "object") return null;
  const next: Record<string, PlacementDesign[]> = {};
  for (const step of steps) {
    const rawList = value[step.id];
    if (!Array.isArray(rawList) || rawList.length === 0) {
      next[step.id] = [emptyDesign()];
      continue;
    }
    const cleaned = rawList
      .filter((item) => item && typeof item === "object")
      .map((item) => ({
        file: typeof item.file === "string" || item.file === null ? item.file : null,
        fileName: typeof item.fileName === "string" ? item.fileName : "",
        pos: {
          x: typeof item.pos?.x === "number" ? item.pos.x : 0,
          y: typeof item.pos?.y === "number" ? item.pos.y : 0,
        },
        scale: typeof item.scale === "number" ? item.scale : 1,
        sizeCategory: typeof item.sizeCategory === "string" ? item.sizeCategory : "1-6",
      }));
    next[step.id] = cleaned.length > 0 ? cleaned : [emptyDesign()];
  }
  return next;
};

const readPersistedState = (): PersistedDesignUploadState | null => {
  try {
    const raw = localStorage.getItem(DESIGN_UPLOAD_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PersistedDesignUploadState>;
    if (!parsed || typeof parsed !== "object") return null;
    const formInputs: QuoteFormInputs = {
      name: typeof parsed.formInputs?.name === "string" ? parsed.formInputs.name : "",
      company: typeof parsed.formInputs?.company === "string" ? parsed.formInputs.company : "",
      address: typeof parsed.formInputs?.address === "string" ? parsed.formInputs.address : "",
      email: typeof parsed.formInputs?.email === "string" ? parsed.formInputs.email : "",
      phone: typeof parsed.formInputs?.phone === "string" ? parsed.formInputs.phone : "",
      notes: typeof parsed.formInputs?.notes === "string" ? parsed.formInputs.notes : "",
    };
    return {
      currentStep: typeof parsed.currentStep === "number" ? parsed.currentStep : 0,
      hasEnteredDesign: typeof parsed.hasEnteredDesign === "boolean" ? parsed.hasEnteredDesign : false,
      selectedProduct: typeof parsed.selectedProduct === "string" ? parsed.selectedProduct : "basic-tshirt",
      sizeQuantities: parsed.sizeQuantities && typeof parsed.sizeQuantities === "object" ? parsed.sizeQuantities : {},
      selectedColor: typeof parsed.selectedColor === "string" ? parsed.selectedColor : "black",
      designs: sanitizePersistedDesigns(parsed.designs) ?? (() => {
        const fallback: Record<string, PlacementDesign[]> = {};
        steps.forEach((s) => { fallback[s.id] = [emptyDesign()]; });
        return fallback;
      })(),
      formInputs,
    };
  } catch {
    return null;
  }
};

const clearPersistedState = () => {
  try {
    localStorage.removeItem(DESIGN_UPLOAD_STORAGE_KEY);
  } catch {
    // Ignore storage access errors.
  }
};

const hasAnyUploadedDesign = (designMap: Record<string, PlacementDesign[]>) =>
  Object.values(designMap).some((list) => list.some((d) => Boolean(d.file)));

const createOpenDesignId = (productId: string, colorValue: string) => `${productId}::${colorValue}`;

const getTotalQuantity = (sizeQuantities: Record<string, number>) =>
  Object.values(sizeQuantities).reduce((sum, value) => sum + (Number(value) || 0), 0);

const getUsedPlacements = (designMap: Record<string, PlacementDesign[]>) =>
  Object.entries(designMap)
    .filter(([, list]) => list.some((d) => Boolean(d.file)))
    .map(([placementId]) => placementId);

const getUploadedFileRefs = (designMap: Record<string, PlacementDesign[]>) =>
  Object.values(designMap)
    .flatMap((list) => list)
    .filter((design) => Boolean(design.file))
    .map((design) => design.fileName || "uploaded-design");

const getLogoItems = (designMap: Record<string, PlacementDesign[]>) =>
  Object.entries(designMap).flatMap(([placementId, list]) =>
    list
      .filter((design) => Boolean(design.file))
      .map((design) => ({
        placementId,
        fileName: design.fileName || "uploaded-design",
        fileRef: design.file || "",
        pos: design.pos,
        scale: design.scale,
        sizeCategory: design.sizeCategory,
      }))
  );

const getPlacementLabel = (placementId: string, lang: "da" | "en") => {
  if (placementId === "fullFront") return lang === "da" ? "Front" : "Front";
  if (placementId === "leftSleeve") return lang === "da" ? "Venstre ærme" : "Left Sleeve";
  if (placementId === "rightSleeve") return lang === "da" ? "Højre ærme" : "Right Sleeve";
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
  return { drawX, drawY, drawWidth, drawHeight };
};

const drawPlacementMockup = async (
  entry: CartDesignEntry,
  placementId: string
): Promise<string | null> => {
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

const buildMockupsForEntry = async (
  entry: CartDesignEntry,
  lang: "da" | "en"
): Promise<QuoteMockupPayload[]> => {
  const placements = getUsedPlacements(entry.designs);
  const results: QuoteMockupPayload[] = [];

  for (const placementId of placements) {
    try {
      const dataUrl = await drawPlacementMockup(entry, placementId);
      if (!dataUrl) continue;
      const placementLabel = getPlacementLabel(placementId, lang);
      const safePlacement = placementId.replace(/[^a-z0-9-]/gi, "-");
      const safeProduct = entry.selectedProduct.replace(/[^a-z0-9-]/gi, "-");
      const safeColor = entry.selectedColor.replace(/[^a-z0-9-]/gi, "-");
      results.push({
        cartItemId: entry.id,
        productId: entry.selectedProduct,
        productName: entry.selectedProductName,
        colorValue: entry.selectedColor,
        colorName: entry.selectedColorName,
        placementId,
        placementLabel,
        fileName: `mockup-${safeProduct}-${safeColor}-${safePlacement}.png`,
        dataUrl,
      });
    } catch {
      // Skip mockup generation errors per placement.
    }
  }

  return results;
};

const readDesignCart = (): CartDesignEntry[] => {
  try {
    const raw = localStorage.getItem(DESIGN_CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item) => item && typeof item === "object")
      .map((item) => {
        const sanitizedDesigns = sanitizePersistedDesigns(item.designs);
        if (!sanitizedDesigns) return null;
        return {
          id: typeof item.id === "string" ? item.id : createOpenDesignId(String(item.selectedProduct ?? ""), String(item.selectedColor ?? "")),
          selectedProduct: typeof item.selectedProduct === "string" ? item.selectedProduct : "basic-tshirt",
          selectedProductName:
            typeof item.selectedProductName === "string"
              ? item.selectedProductName
              : typeof item.selectedProduct === "string"
              ? item.selectedProduct
              : "basic-tshirt",
          selectedColor: typeof item.selectedColor === "string" ? item.selectedColor : "black",
          selectedColorName:
            typeof item.selectedColorName === "string"
              ? item.selectedColorName
              : typeof item.selectedColor === "string"
              ? item.selectedColor
              : "black",
          sizeQuantities: item.sizeQuantities && typeof item.sizeQuantities === "object" ? item.sizeQuantities : {},
          totalQuantity:
            typeof item.totalQuantity === "number"
              ? item.totalQuantity
              : getTotalQuantity(item.sizeQuantities && typeof item.sizeQuantities === "object" ? item.sizeQuantities : {}),
          placementsUsed: Array.isArray(item.placementsUsed) ? item.placementsUsed.filter((entry) => typeof entry === "string") : getUsedPlacements(sanitizedDesigns),
          logoItems: Array.isArray(item.logoItems)
            ? item.logoItems
                .filter((entry) => entry && typeof entry === "object")
                .map((entry) => ({
                  placementId: typeof entry.placementId === "string" ? entry.placementId : "fullFront",
                  fileName: typeof entry.fileName === "string" ? entry.fileName : "uploaded-design",
                  fileRef: typeof entry.fileRef === "string" ? entry.fileRef : "",
                  pos: {
                    x: typeof entry.pos?.x === "number" ? entry.pos.x : 0,
                    y: typeof entry.pos?.y === "number" ? entry.pos.y : 0,
                  },
                  scale: typeof entry.scale === "number" ? entry.scale : 1,
                  sizeCategory: typeof entry.sizeCategory === "string" ? entry.sizeCategory : "1-6",
                }))
            : getLogoItems(sanitizedDesigns),
          uploadedFileRefs: Array.isArray(item.uploadedFileRefs) ? item.uploadedFileRefs.filter((entry) => typeof entry === "string") : getUploadedFileRefs(sanitizedDesigns),
          mockupRef: typeof item.mockupRef === "string" ? item.mockupRef : undefined,
          previewMockupDataUrl: typeof item.previewMockupDataUrl === "string" ? item.previewMockupDataUrl : undefined,
          placementMockups: Array.isArray(item.placementMockups)
            ? item.placementMockups
                .filter((entry) => entry && typeof entry === "object")
                .map((entry) => ({
                  placementId: typeof entry.placementId === "string" ? entry.placementId : "fullFront",
                  placementLabel: typeof entry.placementLabel === "string" ? entry.placementLabel : entry.placementId || "Placement",
                  dataUrl: typeof entry.dataUrl === "string" ? entry.dataUrl : "",
                }))
                .filter((entry) => Boolean(entry.dataUrl))
            : undefined,
          designs: sanitizedDesigns,
          updatedAt: typeof item.updatedAt === "number" ? item.updatedAt : Date.now(),
        } as CartDesignEntry;
      })
      .filter((item): item is CartDesignEntry => Boolean(item));
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

const upsertCartDesign = (entries: CartDesignEntry[], next: CartDesignEntry): CartDesignEntry[] => {
  const idx = entries.findIndex((entry) => entry.id === next.id);
  if (idx === -1) return [...entries, next];
  const copy = [...entries];
  copy[idx] = next;
  return copy;
};
