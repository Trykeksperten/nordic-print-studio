import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";
import { motion } from "framer-motion";
import Layout from "@/components/Layout";
import { CheckCircle2, ChevronLeft, ChevronRight, X } from "lucide-react";
import { toast } from "sonner";
import PlacementStep, {
  type LogoBankAsset,
  type PlacementDesign,
  defaultPrintAreas,
  emptyDesign,
  getMockupSourceAndTransform,
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
import { FORMINIT_ACTION_URL, submitToForminit } from "@/lib/forminit";
import {
  prepareDesignMapForCartStorage,
  resolveUploadRefToDataUrl,
} from "@/lib/uploadRefs";

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
  postCode: string;
  email: string;
  phone: string;
  notes: string;
};

type PersistedDesignUploadState = {
  currentStep: number;
  hasEnteredDesign: boolean;
  selectedProduct: string;
  sizeQuantities: Record<string, number>;
  quantityDraftsByVariant?: Record<string, Record<string, number>>;
  selectedColor: string;
  designs: Record<string, PlacementDesign[]>;
  logoBankAssets?: LogoBankAsset[];
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
    uploadFile?: string | null;
    pos: { x: number; y: number };
    posPct?: { x: number; y: number };
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
  postCode: "",
  email: "",
  phone: "+45 ",
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
  const defaultColors = getProductColors(defaultProduct);
  const defaultColor =
    (persistedState?.selectedColor && defaultColors.some((color) => color.value === persistedState.selectedColor)
      ? persistedState.selectedColor
      : defaultColors.find((color) => color.value === "black")?.value) ??
    defaultColors[0]?.value ??
    "black";
  const initialQuantityDraftsByVariant = useMemo(
    () => sanitizeQuantityDraftsByVariant(persistedState?.quantityDraftsByVariant),
    [persistedState]
  );

  const [currentStep, setCurrentStep] = useState(
    clampStepIndex(persistedState?.currentStep ?? 0, steps.length)
  );
  const [hasEnteredDesign, setHasEnteredDesign] = useState(persistedState?.hasEnteredDesign ?? false);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(defaultProduct);
  const [selectedColor, setSelectedColor] = useState(defaultColor);
  const [quantityDraftsByVariant, setQuantityDraftsByVariant] = useState<Record<string, Record<string, number>>>(() => {
    const migrated = { ...initialQuantityDraftsByVariant };
    const legacyQuantities = sanitizeSizeQuantitiesRecord(persistedState?.sizeQuantities);
    const legacyHasValues = Object.values(legacyQuantities).some((value) => value > 0);
    const legacyKey = createVariantQuantityKey(
      persistedState?.selectedProduct || defaultProduct,
      persistedState?.selectedColor || defaultColor
    );
    if (legacyHasValues && !migrated[legacyKey]) {
      migrated[legacyKey] = legacyQuantities;
    }
    return migrated;
  });
  const [sizeQuantities, setSizeQuantities] = useState<Record<string, number>>(() =>
    buildSizeQuantities(
      defaultSizes,
      initialQuantityDraftsByVariant[createVariantQuantityKey(defaultProduct, defaultColor)] ||
        sanitizeSizeQuantitiesRecord(persistedState?.sizeQuantities)
    )
  );
  const [designs, setDesigns] = useState<Record<string, PlacementDesign[]>>(() => {
    const persistedDesigns = sanitizePersistedDesigns(persistedState?.designs);
    if (persistedDesigns) return persistedDesigns;
    const init: Record<string, PlacementDesign[]> = {};
    steps.forEach((s) => { init[s.id] = [emptyDesign()]; });
    return init;
  });
  const [logoBankAssets, setLogoBankAssets] = useState<LogoBankAsset[]>(
    () => sanitizePersistedLogoBankAssets(persistedState?.logoBankAssets)
  );
  const [formInputs, setFormInputs] = useState<QuoteFormInputs>(
    persistedState?.formInputs ?? defaultFormInputs
  );
  const [designCart, setDesignCart] = useState<CartDesignEntry[]>(() => readDesignCart());
  const [generatedCartMockups, setGeneratedCartMockups] = useState<
    Record<string, Array<{ placementId: string; placementLabel: string; dataUrl: string }>>
  >({});
  const [designFocusRequest, setDesignFocusRequest] = useState<{
    placementId: string;
    designIndex: number;
    nonce: number;
  } | null>(null);
  const [selectedActiveLogoKey, setSelectedActiveLogoKey] = useState<string | null>(null);
  const [addressSuggestions, setAddressSuggestions] = useState<Array<{ id: string; label: string; postCode: string }>>([]);
  const [addressLookupLoading, setAddressLookupLoading] = useState(false);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  const addressLookupAbortRef = useRef<AbortController | null>(null);

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
    const safeQuantities = sanitizeSizeQuantitiesRecord(entry.sizeQuantities);
    setQuantityDraftsByVariant((prev) => ({
      ...prev,
      [createVariantQuantityKey(entry.selectedProduct, entry.selectedColor)]: safeQuantities,
    }));
    setSizeQuantities(buildSizeQuantities(
      productOptions.find((p) => p.value === entry.selectedProduct)?.sizes ?? defaultSizes,
      safeQuantities
    ));
    setDesigns(sanitized);
    setHasEnteredDesign(true);
    setCurrentStep(0);
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [requestedCartItem, designCart, defaultSizes]);

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
  const currentVariantQuantityKey = useMemo(
    () => createVariantQuantityKey(selectedProduct, selectedColor),
    [selectedProduct, selectedColor]
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
    return () => {
      addressLookupAbortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    setSizeQuantities((prev) => {
      const next = buildSizeQuantities(
        selectedProductOption.sizes,
        quantityDraftsByVariant[currentVariantQuantityKey]
      );
      return areSizeQuantitiesEqual(prev, next) ? prev : next;
    });
  }, [currentVariantQuantityKey, quantityDraftsByVariant, selectedProductOption.sizes]);

  useEffect(() => {
    try {
      const payload: PersistedDesignUploadState = {
        currentStep,
        hasEnteredDesign,
        selectedProduct,
        sizeQuantities,
        quantityDraftsByVariant,
        selectedColor,
        designs,
        logoBankAssets,
        formInputs,
      };
      localStorage.setItem(DESIGN_UPLOAD_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore storage quota/access errors.
    }
  }, [currentStep, hasEnteredDesign, selectedProduct, sizeQuantities, quantityDraftsByVariant, selectedColor, designs, logoBankAssets, formInputs]);

  useEffect(() => {
    const query = formInputs.address.trim();
    if (query.length < 3) {
      setAddressSuggestions([]);
      setAddressLookupLoading(false);
      return;
    }

    const timer = window.setTimeout(async () => {
      addressLookupAbortRef.current?.abort();
      const controller = new AbortController();
      addressLookupAbortRef.current = controller;
      setAddressLookupLoading(true);
      try {
        const endpoint = `https://api.dataforsyningen.dk/adresser/autocomplete?q=${encodeURIComponent(query)}`;
        const response = await fetch(endpoint, { signal: controller.signal });
        if (!response.ok) throw new Error("Address lookup failed");
        const payload = await response.json();
        const next = parseAddressSuggestions(payload).slice(0, 8);
        setAddressSuggestions(next);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setAddressSuggestions([]);
      } finally {
        setAddressLookupLoading(false);
      }
    }, 220);

    return () => {
      window.clearTimeout(timer);
    };
  }, [formInputs.address]);

  // Count total uploaded designs across all placements
  const allActiveDesigns = useMemo(() => {
    const collected: { placementId: string; designIndex: number; design: PlacementDesign; key: string }[] = [];
    Object.entries(designs).forEach(([id, list]) => {
      list.forEach((d, index) => {
        if (!d.file) return;
        collected.push({
          placementId: id,
          designIndex: index,
          design: d,
          key: `${id}:${index}:${d.fileName || "uploaded-design"}`,
        });
      });
    });
    return collected;
  }, [designs]);
  const currentPlacementId = steps[currentStep]?.id ?? steps[0].id;
  const currentPlacementActiveDesigns = useMemo(
    () => allActiveDesigns.filter((entry) => entry.placementId === currentPlacementId),
    [allActiveDesigns, currentPlacementId]
  );

  const activeStepLabels = useMemo(
    () => (isBottomwearProduct(selectedProduct) ? bottomStepLabels : stepLabels),
    [selectedProduct]
  );
  const currentCartId = useMemo(
    () => createOpenDesignId(selectedProduct, selectedColor),
    [selectedProduct, selectedColor]
  );
  const isEditingExistingCartItem = useMemo(
    () => Boolean(requestedCartItem && designCart.some((item) => item.id === requestedCartItem)),
    [requestedCartItem, designCart]
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
      const safeQuantities = sanitizeSizeQuantitiesRecord(latest.sizeQuantities);
      setQuantityDraftsByVariant((prev) => ({
        ...prev,
        [createVariantQuantityKey(latest.selectedProduct, latest.selectedColor)]: safeQuantities,
      }));
      setSizeQuantities(buildSizeQuantities(
        productOptions.find((p) => p.value === latest.selectedProduct)?.sizes ?? defaultSizes,
        safeQuantities
      ));
      setDesigns(sanitized);
    }
    setHasEnteredDesign(true);
    setCurrentStep(totalSteps);
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [requestedCheckout, designCart, totalSteps, defaultSizes]);
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
        <>
          {(!isEditingExistingCartItem || currentStep < totalSteps - 1) && (
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
          {isEditingExistingCartItem && (
            <Button
              type="button"
              onClick={() => void handleAddColorDesignToCart()}
              className="flex-1 xl:flex-none"
            >
              {lang === "da" ? "Gem" : "Save"}
            </Button>
          )}
        </>
      )}
    </div>
  ) : null;

  const handleDesignsChange = (id: string, newDesigns: PlacementDesign[]) => {
    setDesigns((prev) => ({ ...prev, [id]: newDesigns }));
  };

  const handleUploadToLogoBank = (asset: Omit<LogoBankAsset, "id">) => {
    const dedupeKey = createLogoBankAssetKey(asset.fileName, asset.sourceUrl || asset.previewUrl);
    setLogoBankAssets((prev) => {
      const existing = prev.find(
        (entry) => createLogoBankAssetKey(entry.fileName, entry.sourceUrl || entry.previewUrl) === dedupeKey
      );
      if (existing) return prev;
      return [
        {
          id: createLogoBankAssetId(),
          ...asset,
        },
        ...prev,
      ];
    });
  };

  const handleRemoveLogoBankAsset = (assetId: string) => {
    setLogoBankAssets((prev) => prev.filter((asset) => asset.id !== assetId));
  };

  const handleSelectActiveLogo = (placementId: string, designIndex: number) => {
    const targetStep = steps.findIndex((step) => step.id === placementId);
    if (targetStep < 0) return;
    setCurrentStep(targetStep);
    setHasEnteredDesign(true);
    setSelectedActiveLogoKey(`${placementId}:${designIndex}`);
    setDesignFocusRequest({
      placementId,
      designIndex,
      nonce: Date.now(),
    });
  };

  const handleRemoveActiveLogo = (placementId: string, designIndex: number) => {
    setDesigns((prev) => {
      const placementDesigns = prev[placementId] ?? [emptyDesign()];
      const nextPlacementDesigns = placementDesigns.filter((_, index) => index !== designIndex);
      const normalizedPlacementDesigns =
        nextPlacementDesigns.length > 0 ? nextPlacementDesigns : [emptyDesign()];
      const next = {
        ...prev,
        [placementId]: normalizedPlacementDesigns,
      };
      return next;
    });

    setSelectedActiveLogoKey((prev) => (prev === `${placementId}:${designIndex}` ? null : prev));
    setDesignFocusRequest((prev) => {
      if (!prev || prev.placementId !== placementId) return prev;
      const nextIndex = Math.max(0, Math.min(prev.designIndex, (designs[placementId]?.length ?? 1) - 2));
      return { placementId, designIndex: nextIndex, nonce: Date.now() };
    });
  };

  const handleSizeQuantityChange = (size: string, value: number) => {
    const safeValue = Math.max(0, Number.isFinite(value) ? value : 0);
    setSizeQuantities((prev) => {
      const next = {
        ...prev,
        [size]: safeValue,
      };
      setQuantityDraftsByVariant((drafts) => ({
        ...drafts,
        [currentVariantQuantityKey]: sanitizeSizeQuantitiesRecord(next),
      }));
      return next;
    });
  };

  const handleSelectAddressSuggestion = (suggestion: { label: string; postCode: string }) => {
    setFormInputs((prev) => ({
      ...prev,
      address: suggestion.label,
      postCode: suggestion.postCode || prev.postCode,
    }));
    setAddressSuggestions([]);
    setShowAddressSuggestions(false);
  };

  const handlePhoneChange = (value: string) => {
    setFormInputs((prev) => ({ ...prev, phone: value }));
  };

  const handlePhoneBlur = () => {
    setFormInputs((prev) => ({
      ...prev,
      phone: normalizePhoneWithDefaultCountryCode(prev.phone),
    }));
  };

  const goToStep = (nextStep: number) => {
    setCurrentStep(nextStep);
    setSelectedActiveLogoKey(null);
    setDesignFocusRequest(null);
  };

  const handleProductChange = (nextProduct: string) => {
    if (nextProduct === selectedProduct) return;
    const nextColors = getProductColors(nextProduct);
    const nextColor =
      nextColors.find((color) => color.value === "black")?.value ??
      nextColors[0]?.value ??
      "black";
    setSelectedProduct(nextProduct);
    setSelectedColor(nextColor);
    setHasEnteredDesign(false);
    setCurrentStep(0);
    setDesigns(createEmptyDesignMap());
    setSizeQuantities(buildSizeQuantities(
      productOptions.find((p) => p.value === nextProduct)?.sizes ?? ["S", "M", "L"],
      quantityDraftsByVariant[createVariantQuantityKey(nextProduct, nextColor)]
    ));

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
      const safeQuantities = sanitizeSizeQuantitiesRecord(existing.sizeQuantities);
      setQuantityDraftsByVariant((prev) => ({
        ...prev,
        [createVariantQuantityKey(selectedProduct, nextColor)]: safeQuantities,
      }));
      setSizeQuantities(buildSizeQuantities(selectedProductOption.sizes, safeQuantities));
    } else {
      setDesigns(createEmptyDesignMap());
      setSizeQuantities(buildSizeQuantities(
        selectedProductOption.sizes,
        quantityDraftsByVariant[createVariantQuantityKey(selectedProduct, nextColor)]
      ));
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

    const rawDesigns = designs;
    const placementIds = getUsedPlacements(rawDesigns);
    const storedDesigns = await prepareDesignMapForCartStorage(rawDesigns).catch(() => rawDesigns);
    const cartTimestamp = Date.now();
    const entryBase: CartDesignEntry = {
      id: currentCartId,
      selectedProduct,
      selectedProductName: selectedProductOption[lang],
      selectedColor,
      selectedColorName: selectedColorData?.[lang] ?? selectedColor,
      sizeQuantities,
      totalQuantity: quantity,
      placementsUsed: placementIds,
      logoItems: getLogoItems(storedDesigns),
      uploadedFileRefs: getUploadedFileRefs(storedDesigns),
      mockupRef: `${selectedProduct}::${selectedColor}`,
      designs: storedDesigns,
      updatedAt: cartTimestamp,
    };
    let generatedMockups: QuoteMockupPayload[] = [];
    try {
      generatedMockups = await buildMockupsForEntry(
        {
          ...entryBase,
          logoItems: getLogoItems(rawDesigns),
          designs: rawDesigns,
        },
        lang
      );
    } catch {
      // Never block adding to cart if mockup rendering fails.
      generatedMockups = [];
    }
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

    toast.success(
      isEditingExistingCartItem
        ? (lang === "da" ? "Design opdateret" : "Design updated")
        : (lang === "da" ? "Tilføjet til kurv" : "Added to cart")
    );
    const resetQuantities = buildSizeQuantities(selectedProductOption.sizes, undefined);
    setQuantityDraftsByVariant((prev) => ({
      ...prev,
      [currentVariantQuantityKey]: resetQuantities,
    }));
    setDesigns(createEmptyDesignMap());
    setSizeQuantities(resetQuantities);
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
    const safeQuantities = sanitizeSizeQuantitiesRecord(entry.sizeQuantities);
    setQuantityDraftsByVariant((prev) => ({
      ...prev,
      [createVariantQuantityKey(entry.selectedProduct, entry.selectedColor)]: safeQuantities,
    }));
    setSizeQuantities(buildSizeQuantities(
      productOptions.find((p) => p.value === entry.selectedProduct)?.sizes ?? defaultSizes,
      safeQuantities
    ));
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
    const name = String(formData.get("fi-sender-fullName") ?? formInputs.name).trim();
    const email = String(formData.get("fi-sender-email") ?? formInputs.email).trim();
    const rawPhone = String(formData.get("fi-sender-phone") ?? formInputs.phone).trim();
    const phone = normalizePhoneWithDefaultCountryCode(rawPhone);
    const company = String(formData.get("fi-text-company") ?? formInputs.company).trim();
    const address = String(formData.get("fi-text-address") ?? formInputs.address).trim();
    const notes = String(formData.get("fi-text-notes") ?? formInputs.notes).trim();

    if (name.length < 2) {
      toast.error(lang === "da" ? "Indtast et gyldigt navn" : "Please enter a valid name");
      return;
    }

    const emailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailIsValid) {
      toast.error(lang === "da" ? "Indtast en gyldig email" : "Please enter a valid email");
      return;
    }

    if (!address) {
      toast.error(lang === "da" ? "Adresse er påkrævet" : "Address is required");
      return;
    }

    const phoneHasCountryCode = /^\+\d{1,3}/.test(phone);
    const phoneDigitCount = phone.replace(/[^\d]/g, "").length;
    if (!phone || !phoneHasCountryCode || phoneDigitCount < 8) {
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
      const aggregatedSizeBreakdown = designCart.reduce<Record<string, number>>((acc, entry) => {
        Object.entries(entry.sizeQuantities).forEach(([size, qty]) => {
          acc[size] = (acc[size] ?? 0) + (Number(qty) || 0);
        });
        return acc;
      }, {});
      const placements = Array.from(new Set(quoteFiles.map((file) => file.placementId)));

      const forminitPayload = new FormData();
      const [firstName, ...lastNameParts] = name.split(/\s+/).filter(Boolean);
      const lastName = lastNameParts.join(" ");
      forminitPayload.set("fi-sender-firstName", firstName || name);
      forminitPayload.set("fi-sender-lastName", lastName || "-");
      forminitPayload.set("fi-sender-fullName", name);
      forminitPayload.set("fi-sender-email", email);
      forminitPayload.set("fi-sender-phone", phone);
      forminitPayload.set("fi-text-company", company);
      forminitPayload.set("fi-text-address", address);
      forminitPayload.set("fi-text-postcode", formInputs.postCode);
      forminitPayload.set("fi-text-notes", notes);
      forminitPayload.set("fi-text-message", notes || (lang === "da" ? "Ingen bemærkninger." : "No notes."));
      forminitPayload.set("fi-metadata-source", "DesignUpload checkout");
      forminitPayload.set("fi-metadata-language", lang);
      forminitPayload.set(
        "fi-text-order-summary",
        JSON.stringify(
          {
            productId: designCart[0]?.selectedProduct ?? selectedProduct,
            productName: designCart[0]?.selectedProductName ?? selectedProductOption[lang],
            colorValue: designCart[0]?.selectedColor ?? selectedColorData?.value ?? selectedColor,
            colorName: designCart[0]?.selectedColorName ?? selectedColorData?.[lang] ?? selectedColor,
            quantity: designCart.reduce((sum, entry) => sum + entry.totalQuantity, 0),
            sizeBreakdown: aggregatedSizeBreakdown,
            placements,
            placementCount: placements.length,
            logoCount: orderSetup.placementCount,
            pricing: {
              garmentTotal: orderGarmentTotal,
              setupTotal: orderSetup.setupTotal,
              printTotal: orderPrintTotal,
              totalIncVat: orderTotalIncVat,
              totalExVat: orderTotalExVat,
            },
          },
          null,
          2
        )
      );
      forminitPayload.set(
        "fi-text-cart-items",
        JSON.stringify(
          designCart.map((entry) => ({
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
            logoItems: entry.logoItems.map((logo) => ({
              placementId: logo.placementId,
              fileName: logo.fileName,
              sizeCategory: logo.sizeCategory,
              posPct: logo.posPct,
              scale: logo.scale,
            })),
          })),
          null,
          2
        )
      );
      forminitPayload.set(
        "fi-text-files",
        JSON.stringify(
          quoteFiles.map((file) => ({
            fileName: file.fileName,
            placementId: file.placementId,
            placementLabel: file.placementLabel,
            sizeCategory: file.sizeCategory,
          })),
          null,
          2
        )
      );
      forminitPayload.set(
        "fi-text-mockups",
        JSON.stringify(
          generatedMockups.map((mockup) => ({
            fileName: mockup.fileName,
            placementId: mockup.placementId,
            placementLabel: mockup.placementLabel,
          })),
          null,
          2
        )
      );

      // Attach only unique uploaded logo files to keep payload size manageable.
      const uniqueQuoteFiles = quoteFiles.filter((file, index, all) => {
        const key = `${file.fileName}::${file.dataUrl.slice(0, 120)}`;
        return all.findIndex((other) => `${other.fileName}::${other.dataUrl.slice(0, 120)}` === key) === index;
      });

      for (let i = 0; i < uniqueQuoteFiles.length; i += 1) {
        const file = uniqueQuoteFiles[i];
        try {
          const blob = await dataUrlToBlob(file.dataUrl);
          const safeName = file.fileName || `design-${i + 1}.png`;
          forminitPayload.append("fi-file-uploadedDesigns", new File([blob], safeName, { type: blob.type || "image/png" }));
        } catch {
          // Skip invalid data URLs for file attachment.
        }
      }

      // Attach all generated mockups as files.
      const uniqueMockups = generatedMockups.filter((mockup, index, all) => {
        const key = `${mockup.cartItemId}::${mockup.placementId}::${mockup.fileName}`;
        return all.findIndex((other) => `${other.cartItemId}::${other.placementId}::${other.fileName}` === key) === index;
      });

      for (let i = 0; i < uniqueMockups.length; i += 1) {
        const mockup = uniqueMockups[i];
        try {
          const blob = await dataUrlToBlob(mockup.dataUrl);
          const safeName = mockup.fileName || `mockup-${i + 1}.jpg`;
          forminitPayload.append("fi-file-mockups", new File([blob], safeName, { type: blob.type || "image/jpeg" }));
        } catch {
          // Skip invalid mockup data URLs for file attachment.
        }
      }

      const response = await submitToForminit(forminitPayload);
      if (!response.ok) {
        const result = await response.json().catch(() => null);
        const message =
          result?.error?.message ||
          result?.error ||
          (lang === "da" ? "Kunne ikke sende forespørgslen. Prøv igen." : "Could not send request. Please try again.");
        throw new Error(message);
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
                  logoBankAssets={logoBankAssets}
                  onUploadToLogoBank={handleUploadToLogoBank}
                  onRemoveLogoBankAsset={handleRemoveLogoBankAsset}
                  onActiveDesignChange={(designIndex) =>
                    setSelectedActiveLogoKey(`${steps[currentStep].id}:${designIndex}`)
                  }
                  showHeader={false}
                  showColorBadge={false}
                  focusRequest={
                    designFocusRequest?.placementId === steps[currentStep].id
                      ? { designIndex: designFocusRequest.designIndex, nonce: designFocusRequest.nonce }
                      : undefined
                  }
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
                  <form onSubmit={handleSubmit} action={FORMINIT_ACTION_URL} method="POST" className="space-y-4">
                    <FormField
                      label={t("designPage.name")}
                      name="fi-sender-fullName"
                      value={formInputs.name}
                      onChange={(value) => setFormInputs((prev) => ({ ...prev, name: value }))}
                      required
                    />
                    <FormField
                      label={t("designPage.company")}
                      name="fi-text-company"
                      value={formInputs.company}
                      onChange={(value) => setFormInputs((prev) => ({ ...prev, company: value }))}
                    />
                    <div className="relative">
                      <label className="block text-sm font-medium mb-1.5">{t("designPage.address")}</label>
                      <input
                        type="text"
                        name="fi-text-address"
                        value={formInputs.address}
                        onChange={(e) => {
                          const value = e.target.value;
                          const typedPostCode = value.match(/\b\d{4}\b/)?.[0] || "";
                          setFormInputs((prev) => ({
                            ...prev,
                            address: value,
                            postCode: typedPostCode,
                          }));
                          setShowAddressSuggestions(true);
                        }}
                        onFocus={() => setShowAddressSuggestions(true)}
                        onBlur={() => {
                          window.setTimeout(() => setShowAddressSuggestions(false), 120);
                        }}
                        required
                        autoComplete="street-address"
                        className="w-full h-11 bg-card rounded-lg px-3 text-sm ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2 outline-none card-shadow"
                      />
                      {showAddressSuggestions && (addressLookupLoading || addressSuggestions.length > 0) && (
                        <div className="absolute z-20 mt-1 w-full rounded-lg border border-border bg-card shadow-lg max-h-64 overflow-auto">
                          {addressLookupLoading ? (
                            <div className="px-3 py-2 text-sm text-muted-foreground">
                              {lang === "da" ? "Søger adresser..." : "Searching addresses..."}
                            </div>
                          ) : (
                            addressSuggestions.map((suggestion) => (
                              <button
                                key={suggestion.id}
                                type="button"
                                className="w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors"
                                onMouseDown={(event) => {
                                  event.preventDefault();
                                  handleSelectAddressSuggestion(suggestion);
                                }}
                              >
                                {suggestion.label}
                              </button>
                            ))
                          )}
                        </div>
                      )}
                      {formInputs.postCode ? (
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          {lang === "da" ? `Postnummer registreret: ${formInputs.postCode}` : `Postcode detected: ${formInputs.postCode}`}
                        </p>
                      ) : null}
                    </div>
                    <FormField
                      label={t("designPage.email")}
                      name="fi-sender-email"
                      type="email"
                      value={formInputs.email}
                      onChange={(value) => setFormInputs((prev) => ({ ...prev, email: value }))}
                      required
                    />
                    <FormField
                      label={t("designPage.phone")}
                      name="fi-sender-phone"
                      type="tel"
                      value={formInputs.phone}
                      onChange={handlePhoneChange}
                      onFocus={() => {
                        setFormInputs((prev) =>
                          prev.phone.trim().length === 0 ? { ...prev, phone: "+45 " } : prev
                        );
                      }}
                      onBlur={handlePhoneBlur}
                      autoComplete="tel"
                      placeholder="+45 12 34 56 78"
                      required
                    />

                    <div>
                      <label className="block text-sm font-medium mb-1.5">{t("designPage.notes")}</label>
                      <textarea
                        name="fi-text-notes"
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
                    <input type="hidden" name="fi-text-product" value={selectedProduct} />
                    <input type="hidden" name="fi-text-color" value={selectedColorData?.[lang] ?? selectedColor} />
                    <input type="hidden" name="fi-text-sizeBreakdown" value={serializeSizeBreakdown(sizeQuantities)} />
                    <input type="hidden" name="fi-text-postcode" value={formInputs.postCode} />

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
                            {lang === "da" ? "Aktive logoer" : "Active logos"}
                          </label>
                          {currentPlacementActiveDesigns.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                              {lang === "da"
                                ? "Klik på et logo i din logobank for at aktivere det."
                                : "Click a logo in your logo bank to activate it."}
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {currentPlacementActiveDesigns.map(({ placementId, designIndex, design, key }) => {
                                const rowKey = `${placementId}:${designIndex}`;
                                const isSelected = selectedActiveLogoKey === rowKey;
                                return (
                                  <div
                                    key={key}
                                    className={`w-full flex items-center gap-2 p-2 rounded-lg text-left transition-colors ${
                                      isSelected ? "bg-primary/10 border border-primary/30" : "bg-muted"
                                    }`}
                                  >
                                    <button
                                      type="button"
                                      onClick={() => handleSelectActiveLogo(placementId, designIndex)}
                                      className="flex flex-1 min-w-0 items-center gap-2 text-left"
                                    >
                                      <img src={design.file!} alt="" className="w-8 h-8 object-contain rounded" />
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium truncate">{design.fileName}</p>
                                        <p className="text-[11px] text-muted-foreground">{activeStepLabels[placementId][lang]}</p>
                                      </div>
                                      <CheckCircle2 size={14} className="text-primary shrink-0" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveActiveLogo(placementId, designIndex)}
                                      className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-background/70 transition-colors shrink-0"
                                      title={lang === "da" ? "Fjern aktivt logo" : "Remove active logo"}
                                      aria-label={lang === "da" ? "Fjern aktivt logo" : "Remove active logo"}
                                    >
                                      <X size={16} />
                                    </button>
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
                  {isEditingExistingCartItem
                    ? (lang === "da" ? "Gem" : "Save")
                    : (lang === "da" ? "Tilføj til kurv" : "Add to cart")}
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
  onFocus,
  onBlur,
  type = "text",
  autoComplete,
  placeholder,
  required = false,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  type?: string;
  autoComplete?: string;
  placeholder?: string;
  required?: boolean;
}) => (
  <div>
    <label className="block text-sm font-medium mb-1.5">{label}</label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onFocus={onFocus}
      onBlur={onBlur}
      autoComplete={autoComplete}
      placeholder={placeholder}
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
  const hoverPreviewOrder: PlacementImageKey[] =
    productId === "performance-tshirt"
      ? ["rightSleeve", "fullBack", "leftSleeve", "fullFront"]
      : ["rightSleeve", "fullBack", "leftSleeve", "fullFront"];

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

const sanitizeSizeQuantitiesRecord = (value: unknown): Record<string, number> => {
  if (!value || typeof value !== "object") return {};
  return Object.entries(value as Record<string, unknown>).reduce<Record<string, number>>((acc, [size, qty]) => {
    const parsed = Number(qty);
    acc[size] = Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 0;
    return acc;
  }, {});
};

const createVariantQuantityKey = (productId: string, colorValue: string) =>
  `${productId}::${colorValue}`;

const sanitizeQuantityDraftsByVariant = (value: unknown): Record<string, Record<string, number>> => {
  if (!value || typeof value !== "object") return {};
  return Object.entries(value as Record<string, unknown>).reduce<Record<string, Record<string, number>>>(
    (acc, [variantKey, sizes]) => {
      acc[variantKey] = sanitizeSizeQuantitiesRecord(sizes);
      return acc;
    },
    {}
  );
};

const buildSizeQuantities = (sizes: string[], source?: Record<string, number>): Record<string, number> => {
  const next = createSizeQuantityMap(sizes);
  if (!source) return next;
  sizes.forEach((size) => {
    const qty = Number(source[size] ?? 0);
    next[size] = Number.isFinite(qty) && qty > 0 ? Math.floor(qty) : 0;
  });
  return next;
};

const areSizeQuantitiesEqual = (a: Record<string, number>, b: Record<string, number>) => {
  const keys = Array.from(new Set([...Object.keys(a), ...Object.keys(b)]));
  return keys.every((key) => (Number(a[key]) || 0) === (Number(b[key]) || 0));
};

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

const isAiFileName = (name: string) => name.toLowerCase().endsWith(".ai");

const AI_DATA_URL_PREFIXES = [
  "data:application/postscript",
  "data:application/illustrator",
  "data:application/eps",
  "data:application/x-illustrator",
  "data:application/vnd.adobe.illustrator",
];

const isAiDataUrl = (value: string) => {
  const lower = value.toLowerCase();
  return AI_DATA_URL_PREFIXES.some((prefix) => lower.startsWith(prefix));
};

const createAiPreviewDataUrl = (fileName: string) => {
  const safeName = fileName.replace(/[<>&\"']/g, "_");
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='1200' viewBox='0 0 1200 1200'>
    <rect width='1200' height='1200' fill='#f3f4f6'/>
    <rect x='180' y='260' width='840' height='680' rx='48' fill='none' stroke='#cbd5e1' stroke-width='16'/>
    <text x='600' y='520' text-anchor='middle' font-family='Arial, Helvetica, sans-serif' font-size='120' font-weight='700' fill='#334155'>AI</text>
    <text x='600' y='620' text-anchor='middle' font-family='Arial, Helvetica, sans-serif' font-size='44' fill='#64748b'>${safeName}</text>
    <text x='600' y='690' text-anchor='middle' font-family='Arial, Helvetica, sans-serif' font-size='36' fill='#94a3b8'>Preview placeholder</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

const createLogoBankAssetId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `logo-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const createLogoBankAssetKey = (fileName: string, source: string) =>
  `${fileName.trim().toLowerCase()}::${String(source).slice(0, 180)}`;

const normalizePhoneWithDefaultCountryCode = (input: string) => {
  const trimmed = String(input || "").trim();
  if (!trimmed) return "+45 ";
  const normalizedInternational = trimmed.startsWith("00") ? `+${trimmed.slice(2)}` : trimmed;
  if (/^\+\d/.test(normalizedInternational)) return normalizedInternational;
  const digitsOnly = normalizedInternational.replace(/\D+/g, "");
  if (!digitsOnly) return "+45 ";
  return `+45 ${digitsOnly}`;
};

const normalizeSuggestionLabel = (item: unknown): string => {
  if (!item || typeof item !== "object") return "";
  const entry = item as Record<string, unknown>;
  const data =
    entry.data && typeof entry.data === "object" ? (entry.data as Record<string, unknown>) : null;
  const directText =
    typeof entry.tekst === "string"
      ? entry.tekst
      : typeof entry.forslagstekst === "string"
      ? entry.forslagstekst
      : typeof entry.adresse === "string"
      ? entry.adresse
      : "";
  if (directText) return directText;
  if (!data) return "";

  const road = typeof data.vejnavn === "string" ? data.vejnavn : "";
  const number = typeof data.husnr === "string" ? data.husnr : "";
  const floor = typeof data.etage === "string" ? data.etage : "";
  const door = typeof data.dør === "string" ? data.dør : "";
  const postCode = typeof data.postnr === "string" ? data.postnr : "";
  const city = typeof data.postnrnavn === "string" ? data.postnrnavn : "";
  return [road, number, floor, door, postCode, city].filter(Boolean).join(" ");
};

const extractSuggestionPostCode = (item: unknown, fallbackLabel: string) => {
  if (item && typeof item === "object") {
    const entry = item as Record<string, unknown>;
    const data =
      entry.data && typeof entry.data === "object" ? (entry.data as Record<string, unknown>) : null;
    const code =
      (typeof entry.postnr === "string" && entry.postnr) ||
      (typeof entry.postnummer === "string" && entry.postnummer) ||
      (data && typeof data.postnr === "string" && data.postnr) ||
      "";
    if (code) return code;
  }
  const match = fallbackLabel.match(/\b\d{4}\b/);
  return match?.[0] || "";
};

const parseAddressSuggestions = (payload: unknown): Array<{ id: string; label: string; postCode: string }> => {
  if (!Array.isArray(payload)) return [];
  return payload
    .map((item, index) => {
      const label = normalizeSuggestionLabel(item).trim();
      const postCode = extractSuggestionPostCode(item, label);
      const id =
        item && typeof item === "object" && typeof (item as Record<string, unknown>).id === "string"
          ? ((item as Record<string, unknown>).id as string)
          : `${label}-${index}`;
      return { id, label, postCode };
    })
    .filter((entry) => Boolean(entry.label));
};

const sanitizePersistedLogoBankAssets = (value: PersistedDesignUploadState["logoBankAssets"]): LogoBankAsset[] => {
  if (!Array.isArray(value)) return [];
  return value
    .filter((asset) => asset && typeof asset === "object")
    .map((asset) => {
      const fileName = typeof asset.fileName === "string" ? asset.fileName : "";
      const previewUrl = typeof asset.previewUrl === "string" ? asset.previewUrl : "";
      const sourceUrl =
        typeof asset.sourceUrl === "string"
          ? asset.sourceUrl
          : asset.sourceUrl === null
          ? null
          : null;
      return {
        id: typeof asset.id === "string" && asset.id ? asset.id : createLogoBankAssetId(),
        fileName,
        previewUrl,
        sourceUrl,
      };
    })
    .filter((asset) => Boolean(asset.fileName) && Boolean(asset.previewUrl));
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
      .map((item) => {
        const file = typeof item.file === "string" || item.file === null ? item.file : null;
        const fileName = typeof item.fileName === "string" ? item.fileName : "";
        const uploadFile =
          typeof (item as { uploadFile?: unknown }).uploadFile === "string"
            ? (item as { uploadFile?: string }).uploadFile ?? null
            : (item as { uploadFile?: unknown }).uploadFile === null
            ? null
            : null;
        const shouldTreatAsAi = Boolean(uploadFile || (typeof file === "string" && (isAiDataUrl(file) || isAiFileName(fileName))));
        const preservedAiUpload = uploadFile || (shouldTreatAsAi && typeof file === "string" ? file : null);
        return {
          file: shouldTreatAsAi ? createAiPreviewDataUrl(fileName || "uploaded.ai") : file,
          uploadFile: preservedAiUpload,
          fileName,
          pos: {
            x: typeof item.pos?.x === "number" ? item.pos.x : 0,
            y: typeof item.pos?.y === "number" ? item.pos.y : 0,
          },
          posPct:
            typeof item.posPct?.x === "number" && typeof item.posPct?.y === "number"
              ? { x: item.posPct.x, y: item.posPct.y }
              : undefined,
          scale: typeof item.scale === "number" ? item.scale : 1,
          sizeCategory: typeof item.sizeCategory === "string" ? item.sizeCategory : "1-6",
        };
      });
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
      postCode: typeof (parsed.formInputs as Partial<QuoteFormInputs> | undefined)?.postCode === "string"
        ? (parsed.formInputs as Partial<QuoteFormInputs>).postCode || ""
        : "",
      email: typeof parsed.formInputs?.email === "string" ? parsed.formInputs.email : "",
      phone: normalizePhoneWithDefaultCountryCode(
        typeof parsed.formInputs?.phone === "string" ? parsed.formInputs.phone : "+45 "
      ),
      notes: typeof parsed.formInputs?.notes === "string" ? parsed.formInputs.notes : "",
    };
    return {
      currentStep: typeof parsed.currentStep === "number" ? parsed.currentStep : 0,
      hasEnteredDesign: typeof parsed.hasEnteredDesign === "boolean" ? parsed.hasEnteredDesign : false,
      selectedProduct: typeof parsed.selectedProduct === "string" ? parsed.selectedProduct : "basic-tshirt",
      sizeQuantities: sanitizeSizeQuantitiesRecord(parsed.sizeQuantities),
      quantityDraftsByVariant: sanitizeQuantityDraftsByVariant(parsed.quantityDraftsByVariant),
      selectedColor: typeof parsed.selectedColor === "string" ? parsed.selectedColor : "black",
      designs: sanitizePersistedDesigns(parsed.designs) ?? (() => {
        const fallback: Record<string, PlacementDesign[]> = {};
        steps.forEach((s) => { fallback[s.id] = [emptyDesign()]; });
        return fallback;
      })(),
      logoBankAssets: sanitizePersistedLogoBankAssets(parsed.logoBankAssets),
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
        fileRef: design.uploadFile || design.file || "",
        uploadFile: design.uploadFile || null,
        pos: design.pos,
        posPct: design.posPct,
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

const dataUrlToBlob = async (dataUrl: string) => {
  const resolved = await resolveUploadRefToDataUrl(dataUrl);
  if (!resolved) {
    throw new Error("Invalid upload reference");
  }
  const response = await fetch(resolved);
  return response.blob();
};

const drawPlacementMockup = async (
  entry: CartDesignEntry,
  placementId: string
): Promise<string | null> => {
  const area = defaultPrintAreas[placementId];
  if (!area) return null;
  const placementDesigns = entry.designs[placementId] ?? [];
  const uploaded = placementDesigns.filter((d) => Boolean(d.uploadFile || d.file));
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

  for (const design of uploaded) {
    const resolvedUpload = await resolveUploadRefToDataUrl(design.uploadFile || null);
    const imageSource = resolvedUpload || design.file;
    if (!imageSource) continue;
    const logoImg = await loadImage(imageSource);
    const offsetX =
      typeof design.posPct?.x === "number" ? design.posPct.x * areaW : design.pos.x;
    const offsetY =
      typeof design.posPct?.y === "number" ? design.posPct.y * areaH : design.pos.y;
    const logoAspect = logoImg.width / Math.max(1, logoImg.height);
    const targetWidthPx = Math.max(1, design.scale * areaW);
    const targetHeightPx = targetWidthPx / Math.max(0.0001, logoAspect);
    const centerX = areaX + areaW / 2 + offsetX;
    const centerY = areaY + areaH / 2 + offsetY;
    const drawX = centerX - targetWidthPx / 2;
    const drawY = centerY - targetHeightPx / 2;
    ctx.drawImage(logoImg, drawX, drawY, targetWidthPx, targetHeightPx);
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
                  fileRef:
                    typeof entry.uploadFile === "string"
                      ? entry.uploadFile
                      : typeof entry.fileRef === "string"
                      ? entry.fileRef
                      : "",
                  uploadFile:
                    typeof entry.uploadFile === "string"
                      ? entry.uploadFile
                      : entry.uploadFile === null
                      ? null
                      : undefined,
                  pos: {
                    x: typeof entry.pos?.x === "number" ? entry.pos.x : 0,
                    y: typeof entry.pos?.y === "number" ? entry.pos.y : 0,
                  },
                  posPct:
                    typeof entry.posPct?.x === "number" && typeof entry.posPct?.y === "number"
                      ? { x: entry.posPct.x, y: entry.posPct.y }
                      : undefined,
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
