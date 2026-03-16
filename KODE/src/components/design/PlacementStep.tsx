import { useState, useRef, useCallback, useEffect, useMemo, type ReactNode } from "react";
import { Upload, Move, X } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  autoBasicTshirtColorMockups,
  autoPerformanceTshirtColorMockups,
  autoPremiumHoodieColorMockups,
  autoStandardHoodieColorMockups,
} from "@/lib/autoTshirtVariants";
import { autoBybLadiesFluffySweatpantsColorMockups } from "@/lib/autoFolderProductVariants";

export const resolveAssetPath = (src: string) => {
  if (!src) return src;
  if (/^(https?:|data:|blob:)/i.test(src)) return src;
  if (!src.startsWith("/")) return src;
  const baseUrl = import.meta.env.BASE_URL || "/";
  if (baseUrl !== "/" && (src === baseUrl || src.startsWith(baseUrl))) return src;
  return `${baseUrl}${src.slice(1)}`;
};

export interface PlacementDesign {
  file: string | null;
  fileName: string;
  pos: { x: number; y: number };
  scale: number;
  sizeCategory: string;
}

interface PlacementStepProps {
  placementId: string;
  label: string;
  productId: string;
  selectedColor?: { value: string; da: string; en: string; hex: string };
  customMockups?: Partial<Record<string, string>>;
  designs: PlacementDesign[];
  onDesignsChange: (designs: PlacementDesign[]) => void;
  focusRequest?: { designIndex: number; nonce: number };
  stepControls?: ReactNode;
  showHeader?: boolean;
  showColorBadge?: boolean;
}

const sizeOptions = [
  { value: "1-6", da: "1–6 cm (35 DKK)", en: "1–6 cm (35 DKK)" },
  { value: "6-12", da: "6–12 cm (40 DKK)", en: "6–12 cm (40 DKK)" },
  { value: "12-20", da: "12–20 cm (45 DKK)", en: "12–20 cm (45 DKK)" },
  { value: "20-40", da: "20–40 cm (55 DKK)", en: "20–40 cm (55 DKK)" },
];

const sizeCategoryCmBounds: Record<string, { min: number; max: number }> = {
  "1-6": { min: 1, max: 6 },
  "6-12": { min: 6, max: 12 },
  "12-20": { min: 12, max: 20 },
  "20-40": { min: 20, max: 40 },
};

// Visual-only scaling anchors for preview rendering.
// Does not affect pricing, saved order data, or cm calculations.
const visualScaleAnchors = {
  upTo12: 1.3,
  at20: 1.05,
  at40: 1.04,
};

const SHIRT_WIDTH_CM = 45;
const TORSO_WIDTH_PERCENT_OF_IMAGE = 58;
const CENTER_SNAP_THRESHOLD_PX = 14;
const SNAP_TARGETS_STORAGE_KEY = "trykeksperten:snap-targets:v1";

const getGarmentCenterPercent = (productId: string, placementId: string) => {
  const isFrontOrBack = placementId === "fullFront" || placementId === "fullBack";
  const isSleeve = placementId === "leftSleeve" || placementId === "rightSleeve";
  const isHoodieOrSweat =
    productId === "standard-hoodie" || productId === "premium-hoodie" || productId === "authentic-sweat";
  if (isFrontOrBack && isHoodieOrSweat) {
    return { x: 50, y: 58 };
  }
  if (isSleeve && isHoodieOrSweat) {
    return { x: 54, y: 50 };
  }
  return { x: 50, y: 50 };
};

const clampPercent = (value: number) => Math.max(0, Math.min(100, value));

const getSnapStorageMap = (): Record<string, { x: number; y: number }> => {
  try {
    const raw = localStorage.getItem(SNAP_TARGETS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, { x: number; y: number }>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

const setSnapStorageValue = (key: string, value: { x: number; y: number }) => {
  const map = getSnapStorageMap();
  map[key] = value;
  try {
    localStorage.setItem(SNAP_TARGETS_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // Ignore storage errors.
  }
};

// Default print areas (relative coordinates in %)
export const defaultPrintAreas: Record<string, { top: number; left: number; width: number; height: number }> = {
  fullFront: { top: 25, left: 25, width: 40, height: 30 },
  leftSleeve: { top: 22, left: 41, width: 22, height: 24 },
  rightSleeve: { top: 22, left: 37, width: 22, height: 24 },
  fullBack: { top: 18, left: 26, width: 40, height: 35 },
};

const mockupImagesByProduct: Record<string, Record<string, string>> = {
  "basic-tshirt": {
    fullFront: "/russell-basic-front.jpg",
    leftSleeve: "/russell-basic-side.jpg",
    rightSleeve: "/russell-basic-side.jpg",
    fullBack: "/russell-basic-back.jpg",
  },
  "heavyweight-tshirt": {
    fullFront: "/russell-heavyweight-front.jpg",
    leftSleeve: "/russell-heavyweight-side.jpg",
    rightSleeve: "/russell-heavyweight-side.jpg",
    fullBack: "/russell-heavyweight-back.jpg",
  },
  "byb-oversized-acid-wash-tee": {
    fullFront: "/byb-acid-wash-black-front.avif",
    leftSleeve: "/byb-acid-wash-black-sleeve.avif",
    rightSleeve: "/byb-acid-wash-black-sleeve.avif",
    fullBack: "/byb-acid-wash-black-back.avif",
  },
  "byb-ladies-fluffy-sweatpants": {
    fullFront: "/BY291_Mw1-14274 for.webp",
    leftSleeve: "/BY291_Mw1-14274 for.webp",
    rightSleeve: "/BY291_Mw1-14274 for.webp",
    fullBack: "/BY291_Mw2-14274 bag.webp",
  },
  "authentic-sweat": {
    fullFront: "/russell-authentic-sweat-black-front.jpg",
    leftSleeve: "/russell-authentic-sweat-black-sleeve.jpg",
    rightSleeve: "/russell-authentic-sweat-black-sleeve.jpg",
    fullBack: "/russell-authentic-sweat-black-back.jpg",
  },
  "standard-hoodie": {
    fullFront: "/russell-hoodie-basic.png",
    leftSleeve: "/russell-hoodie-basic.png",
    rightSleeve: "/russell-hoodie-basic.png",
    fullBack: "/russell-hoodie-basic.png",
  },
  "premium-hoodie": {
    fullFront: "/russell-premium-hoodie-front.png",
    leftSleeve: "/russell-premium-hoodie-front.png",
    rightSleeve: "/russell-premium-hoodie-front.png",
    fullBack: "/russell-premium-hoodie-back.png",
  },
  "performance-tshirt": {
    fullFront: "/russell-basic-tshirt.png",
    leftSleeve: "/russell-basic-tshirt.png",
    rightSleeve: "/russell-basic-tshirt.png",
    fullBack: "/russell-basic-tshirt.png",
  },
};

const pickColorMockups = (
  source: Record<string, Partial<Record<"fullFront" | "leftSleeve" | "rightSleeve" | "fullBack", string>>>,
  keys: string[]
) =>
  Object.fromEntries(
    keys
      .filter((key) => Boolean(source[key]))
      .map((key) => [key, source[key]])
  ) as Record<string, Partial<Record<string, string>>>;

const colorSpecificMockups: Record<string, Record<string, Partial<Record<string, string>>>> = {
  "basic-tshirt": {
    default: {
      fullFront: "/russell-black-front.jpg",
      leftSleeve: "/russell-black-left-sleeve.png",
      rightSleeve: "/russell-black-right-sleeve.png",
      fullBack: "/russell-black-back.png",
    },
    ...autoBasicTshirtColorMockups,
  },
  "heavyweight-tshirt": {
    ...pickColorMockups(autoBasicTshirtColorMockups, [
      "white",
      "black",
      "bright-royal",
      "classic-red",
      "convoy-grey",
      "french-navy",
      "tan",
    ]),
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
  "performance-tshirt": {
    ...autoPerformanceTshirtColorMockups,
  },
  "byb-ladies-fluffy-sweatpants": autoBybLadiesFluffySweatpantsColorMockups,
  "premium-hoodie": {
    ...autoPremiumHoodieColorMockups,
  },
  "standard-hoodie": {
    ...autoStandardHoodieColorMockups,
  },
};

// For products where left/right sleeve currently share the same source file,
// this defines which sleeve side the source image represents.
// We then mirror only the opposite side during render.
const sharedSleeveSourceSideByProduct: Record<string, "left" | "right"> = {
  "authentic-sweat": "right",
  "byb-oversized-acid-wash-tee": "left",
  "byb-ladies-fluffy-sweatpants": "left",
};

export const getMockupSourceAndTransform = (
  productId: string,
  colorValue: string | undefined,
  placementId: string
) => {
  const productMockups = mockupImagesByProduct[productId] ?? mockupImagesByProduct["basic-tshirt"];
  const exactColorMockup = colorValue
    ? colorSpecificMockups[productId]?.[colorValue]?.[placementId]
    : undefined;
  const defaultColorMockup = colorSpecificMockups[productId]?.default?.[placementId];
  const baseMockupImage =
    exactColorMockup ??
    defaultColorMockup ??
    productMockups[placementId] ??
    productMockups.fullFront;

  const isSharedSideMockup =
    !exactColorMockup &&
    !defaultColorMockup &&
    baseMockupImage.includes("side");
  const sameSleeveImageForColor =
    Boolean(colorValue) &&
    colorSpecificMockups[productId]?.[colorValue!]?.leftSleeve !== undefined &&
    colorSpecificMockups[productId]?.[colorValue!]?.leftSleeve ===
      colorSpecificMockups[productId]?.[colorValue!]?.rightSleeve;
  const usesSharedSleeveImage = isSharedSideMockup || sameSleeveImageForColor;
  const sharedSleeveSourceSide = sharedSleeveSourceSideByProduct[productId] ?? "left";
  const mirrorMockup = usesSharedSleeveImage
    ? sharedSleeveSourceSide === "left"
      ? placementId === "rightSleeve"
      : placementId === "leftSleeve"
    : false;
  const mockupTransform = `${mirrorMockup ? "scaleX(-1) " : ""}scale(1)`;

  return { src: resolveAssetPath(baseMockupImage), transform: mockupTransform };
};

export const emptyDesign = (): PlacementDesign => ({
  file: null,
  fileName: "",
  pos: { x: 0, y: 0 },
  scale: 1,
  sizeCategory: "1-6",
});

const PlacementStep = ({
  placementId,
  label,
  productId,
  selectedColor,
  customMockups,
  designs,
  onDesignsChange,
  focusRequest,
  stepControls,
  showHeader = true,
  showColorBadge = true,
}: PlacementStepProps) => {
  const { lang } = useLanguage();
  const areaLocked = placementId === "fullFront" || placementId === "leftSleeve" || placementId === "rightSleeve" || placementId === "fullBack";
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [centerGuide, setCenterGuide] = useState<{ x: boolean; y: boolean }>({ x: false, y: false });
  const [isCalibratingSnap, setIsCalibratingSnap] = useState(false);
  const [calibratingAxis, setCalibratingAxis] = useState<"x" | "y" | "both">("both");
  const snapStorageKey = `${productId}:${placementId}`;
  const dragRef = useRef<{ startX: number; startY: number; startPosX: number; startPosY: number } | null>(null);

  // Calibration state
  const defaults = defaultPrintAreas[placementId];
  const [areaPos, setAreaPos] = useState({ top: defaults.top, left: defaults.left, width: defaults.width, height: defaults.height });
  const [isDraggingArea, setIsDraggingArea] = useState(false);
  const [isResizingArea, setIsResizingArea] = useState(false);
  const areaDragRef = useRef<{ startX: number; startY: number; startTop: number; startLeft: number } | null>(null);
  const areaResizeRef = useRef<{ startX: number; startY: number; startWidth: number; startHeight: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentDesign = designs[activeIndex] || emptyDesign();
  const firstUploadedIndex = designs.findIndex((d) => Boolean(d.file));
  const controlsDesignIndex =
    currentDesign.file || firstUploadedIndex < 0 ? activeIndex : firstUploadedIndex;
  const controlsDesign = designs[controlsDesignIndex] || currentDesign;

  useEffect(() => {
    if (!focusRequest) return;
    const safeIndex = Math.max(0, Math.min(designs.length - 1, focusRequest.designIndex));
    if (Number.isFinite(safeIndex)) setActiveIndex(safeIndex);
  }, [designs.length, focusRequest]);

  // Convert from image-percent to real cm using torso width (without sleeves) as reference.
  const torsoRelativeWidth = areaPos.width / TORSO_WIDTH_PERCENT_OF_IMAGE;
  const baseLogoWidthCm = SHIRT_WIDTH_CM * torsoRelativeWidth;
  const currentSizeBoundsCm =
    sizeCategoryCmBounds[controlsDesign.sizeCategory] ?? sizeCategoryCmBounds["1-6"];
  const currentLogoWidthCm = useMemo(
    () => controlsDesign.scale * baseLogoWidthCm,
    [controlsDesign.scale, baseLogoWidthCm]
  );

  useEffect(() => {
    if (!controlsDesign.file) return;
    const clamped = clampScale(controlsDesign.scale, controlsDesign.sizeCategory, baseLogoWidthCm);
    if (!Number.isFinite(controlsDesign.scale) || Math.abs(clamped - controlsDesign.scale) > 0.000001) {
      updateDesign(controlsDesignIndex, { ...controlsDesign, scale: clamped });
    }
  }, [
    baseLogoWidthCm,
    controlsDesign.file,
    controlsDesign.scale,
    controlsDesign.sizeCategory,
    controlsDesignIndex,
  ]);

  const updateDesign = (index: number, updated: PlacementDesign) => {
    const newDesigns = [...designs];
    newDesigns[index] = updated;
    onDesignsChange(newDesigns);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const targetIndex = activeIndex;
    const targetDesign = designs[targetIndex] || emptyDesign();
    const shouldAppendNew = Boolean(targetDesign.file);
    const fileName = file.name.toLowerCase();
    const validExtension = fileName.endsWith(".png") || fileName.endsWith(".svg") || fileName.endsWith(".ai");
    if (!validExtension) {
      toast.error(lang === "da" ? "Kun PNG, SVG eller AI filer er tilladt" : "Only PNG, SVG or AI files are allowed");
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const nextDesign: PlacementDesign = {
        ...(shouldAppendNew ? emptyDesign() : targetDesign),
        file: ev.target?.result as string,
        fileName: file.name,
        pos: { x: 0, y: 0 },
        scale: getDefaultScale((shouldAppendNew ? "1-6" : targetDesign.sizeCategory), baseLogoWidthCm),
      };
      if (shouldAppendNew) {
        const nextDesigns = [...designs, nextDesign];
        onDesignsChange(nextDesigns);
        setActiveIndex(nextDesigns.length - 1);
      } else {
        updateDesign(targetIndex, nextDesign);
      }
      e.target.value = "";
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveDesign = (index: number) => {
    if (designs.length <= 1) {
      updateDesign(0, emptyDesign());
    } else {
      const newDesigns = designs.filter((_, i) => i !== index);
      onDesignsChange(newDesigns);
      if (activeIndex >= newDesigns.length) {
        setActiveIndex(newDesigns.length - 1);
      }
    }
  };

  const handleLogoWidthCmChange = (rawValue: string) => {
    const parsedCm = Number.parseFloat(rawValue);
    if (!Number.isFinite(parsedCm)) return;
    const safeBase = Math.max(0.1, baseLogoWidthCm);
    const nextScale = parsedCm / safeBase;
    updateDesign(controlsDesignIndex, {
      ...controlsDesign,
      scale: clampScale(nextScale, controlsDesign.sizeCategory, baseLogoWidthCm),
    });
  };

  const snapTargetPercent = getGarmentCenterPercent(productId, placementId);
  const [snapTargetOverride, setSnapTargetOverride] = useState<{ x: number; y: number } | null>(null);
  useEffect(() => {
    const saved = getSnapStorageMap()[snapStorageKey];
    if (saved && Number.isFinite(saved.x) && Number.isFinite(saved.y)) {
      setSnapTargetOverride({ x: clampPercent(saved.x), y: clampPercent(saved.y) });
      return;
    }
    setSnapTargetOverride(null);
  }, [snapStorageKey]);
  const effectiveSnapTargetPercent = snapTargetOverride ?? snapTargetPercent;
  const snapGuidePosition = useMemo(() => {
    const x = ((effectiveSnapTargetPercent.x - areaPos.left) / Math.max(1, areaPos.width)) * 100;
    const y = ((effectiveSnapTargetPercent.y - areaPos.top) / Math.max(1, areaPos.height)) * 100;
    return {
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y)),
    };
  }, [areaPos.left, areaPos.top, areaPos.width, areaPos.height, effectiveSnapTargetPercent.x, effectiveSnapTargetPercent.y]);

  const updateSnapTargetFromClient = useCallback((clientX: number, clientY: number, axis: "x" | "y" | "both" = "both") => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || !rect.width || !rect.height) return;
    const nextX = clampPercent(((clientX - rect.left) / rect.width) * 100);
    const nextY = clampPercent(((clientY - rect.top) / rect.height) * 100);
    const current = snapTargetOverride ?? snapTargetPercent;
    setSnapTargetOverride({
      x: axis === "y" ? current.x : nextX,
      y: axis === "x" ? current.y : nextY,
    });
  }, [snapTargetOverride, snapTargetPercent]);

  const startSnapCalibration = useCallback((clientX: number, clientY: number, axis: "x" | "y" | "both") => {
    setCalibratingAxis(axis);
    setIsCalibratingSnap(true);
    updateSnapTargetFromClient(clientX, clientY, axis);
  }, [updateSnapTargetFromClient]);

  // Design drag handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragRef.current = { startX: e.clientX, startY: e.clientY, startPosX: currentDesign.pos.x, startPosY: currentDesign.pos.y };
  }, [currentDesign.pos]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isCalibratingSnap) {
      updateSnapTargetFromClient(e.clientX, e.clientY, calibratingAxis);
      return;
    }
    if (isResizingArea && areaResizeRef.current && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const dx = ((e.clientX - areaResizeRef.current.startX) / rect.width) * 100;
      const dy = ((e.clientY - areaResizeRef.current.startY) / rect.height) * 100;
      const nextWidth = Math.max(8, Math.min(100 - areaPos.left, areaResizeRef.current.startWidth + dx));
      const nextHeight = Math.max(8, Math.min(100 - areaPos.top, areaResizeRef.current.startHeight + dy));
      setAreaPos(prev => ({
        ...prev,
        width: nextWidth,
        height: nextHeight,
      }));
      return;
    }
    if (isDraggingArea && areaDragRef.current && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const dx = ((e.clientX - areaDragRef.current.startX) / rect.width) * 100;
      const dy = ((e.clientY - areaDragRef.current.startY) / rect.height) * 100;
      setAreaPos(prev => ({
        ...prev,
        top: Math.max(0, Math.min(100 - prev.height, areaDragRef.current!.startTop + dy)),
        left: Math.max(0, Math.min(100 - prev.width, areaDragRef.current!.startLeft + dx)),
      }));
      return;
    }
    if (!isDragging || !dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    const rawX = dragRef.current.startPosX + dx;
    const rawY = dragRef.current.startPosY + dy;
    const rect = containerRef.current?.getBoundingClientRect();
    const printAreaWidthPx = rect ? (rect.width * areaPos.width) / 100 : 0;
    const printAreaHeightPx = rect ? (rect.height * areaPos.height) / 100 : 0;
    const targetOffsetX = ((snapGuidePosition.x - 50) / 100) * printAreaWidthPx;
    const targetOffsetY = ((snapGuidePosition.y - 50) / 100) * printAreaHeightPx;
    const snapX = Math.abs(rawX - targetOffsetX) <= CENTER_SNAP_THRESHOLD_PX;
    const snapY = Math.abs(rawY - targetOffsetY) <= CENTER_SNAP_THRESHOLD_PX;
    setCenterGuide({ x: snapX, y: snapY });
    updateDesign(activeIndex, {
      ...currentDesign,
      pos: { x: snapX ? targetOffsetX : rawX, y: snapY ? targetOffsetY : rawY },
    });
  }, [isCalibratingSnap, calibratingAxis, updateSnapTargetFromClient, isDragging, isDraggingArea, isResizingArea, currentDesign, activeIndex, areaPos.width, areaPos.height, snapGuidePosition.x, snapGuidePosition.y]);

  const handleMouseUp = useCallback(() => {
    if (isCalibratingSnap) {
      if (snapTargetOverride) setSnapStorageValue(snapStorageKey, snapTargetOverride);
      setIsCalibratingSnap(false);
      setCalibratingAxis("both");
    }
    if (isDraggingArea || isResizingArea) {
      setIsDraggingArea(false);
      setIsResizingArea(false);
      console.log(`📐 Print area for "${placementId}":`, JSON.stringify({
        top: Math.round(areaPos.top), left: Math.round(areaPos.left),
        width: areaPos.width, height: areaPos.height,
      }));
    }
    setIsDragging(false);
    setCenterGuide({ x: false, y: false });
    dragRef.current = null;
    areaDragRef.current = null;
    areaResizeRef.current = null;
  }, [isCalibratingSnap, snapStorageKey, snapTargetOverride, isDraggingArea, isResizingArea, placementId, areaPos]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    setIsDragging(true);
    dragRef.current = { startX: touch.clientX, startY: touch.clientY, startPosX: currentDesign.pos.x, startPosY: currentDesign.pos.y };
  }, [currentDesign.pos]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging || !dragRef.current) return;
    const touch = e.touches[0];
    const dx = touch.clientX - dragRef.current.startX;
    const dy = touch.clientY - dragRef.current.startY;
    const rawX = dragRef.current.startPosX + dx;
    const rawY = dragRef.current.startPosY + dy;
    const rect = containerRef.current?.getBoundingClientRect();
    const printAreaWidthPx = rect ? (rect.width * areaPos.width) / 100 : 0;
    const printAreaHeightPx = rect ? (rect.height * areaPos.height) / 100 : 0;
    const targetOffsetX = ((snapGuidePosition.x - 50) / 100) * printAreaWidthPx;
    const targetOffsetY = ((snapGuidePosition.y - 50) / 100) * printAreaHeightPx;
    const snapX = Math.abs(rawX - targetOffsetX) <= CENTER_SNAP_THRESHOLD_PX;
    const snapY = Math.abs(rawY - targetOffsetY) <= CENTER_SNAP_THRESHOLD_PX;
    setCenterGuide({ x: snapX, y: snapY });
    updateDesign(activeIndex, {
      ...currentDesign,
      pos: { x: snapX ? targetOffsetX : rawX, y: snapY ? targetOffsetY : rawY },
    });
  }, [isDragging, currentDesign, activeIndex, areaPos.width, areaPos.height, snapGuidePosition.x, snapGuidePosition.y]);

  const handleAreaMouseDown = useCallback((e: React.MouseEvent) => {
    if (areaLocked) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingArea(true);
    areaDragRef.current = { startX: e.clientX, startY: e.clientY, startTop: areaPos.top, startLeft: areaPos.left };
  }, [areaLocked, areaPos]);

  const handleAreaResizeMouseDown = useCallback((e: React.MouseEvent) => {
    if (areaLocked) return;
    e.preventDefault();
    e.stopPropagation();
    setIsResizingArea(true);
    areaResizeRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startWidth: areaPos.width,
      startHeight: areaPos.height,
    };
  }, [areaLocked, areaPos]);

  const printArea = { top: `${areaPos.top}%`, left: `${areaPos.left}%`, width: `${areaPos.width}%`, height: `${areaPos.height}%` };
  const productMockups = mockupImagesByProduct[productId] ?? mockupImagesByProduct["basic-tshirt"];
  const exactColorMockup = selectedColor
    ? colorSpecificMockups[productId]?.[selectedColor.value]?.[placementId]
    : undefined;
  const defaultColorMockup = colorSpecificMockups[productId]?.default?.[placementId];
  const baseMockupImage =
    customMockups?.[placementId] ??
    exactColorMockup ??
    defaultColorMockup ??
    productMockups[placementId] ??
    productMockups.fullFront;
  const [recoloredMockup, setRecoloredMockup] = useState<string | null>(null);
  const resolvedBaseMockupImage = resolveAssetPath(baseMockupImage);
  const mockupImage = recoloredMockup ?? resolvedBaseMockupImage;
  const isSharedSideMockup =
    !customMockups?.[placementId] &&
    !exactColorMockup &&
    !defaultColorMockup &&
    baseMockupImage.includes("side");
  const sameSleeveImageForColor =
    Boolean(selectedColor) &&
    colorSpecificMockups[productId]?.[selectedColor!.value]?.leftSleeve !== undefined &&
    colorSpecificMockups[productId]?.[selectedColor!.value]?.leftSleeve ===
      colorSpecificMockups[productId]?.[selectedColor!.value]?.rightSleeve;
  const usesSharedSleeveImage = isSharedSideMockup || sameSleeveImageForColor;
  const sharedSleeveSourceSide = sharedSleeveSourceSideByProduct[productId] ?? "left";
  const mirrorMockup = usesSharedSleeveImage
    ? sharedSleeveSourceSide === "left"
      ? placementId === "rightSleeve"
      : placementId === "leftSleeve"
    : false;
  const mockupTransform = `${mirrorMockup ? "scaleX(-1) " : ""}scale(1)`;
  const uploadedDesigns = designs.filter(d => d.file);

  useEffect(() => {
    let cancelled = false;
    const hasCustomForPlacement = Boolean(customMockups?.[placementId]);
    const hasExactColorMockup = Boolean(exactColorMockup);
    const isBlackLike = (selectedColor?.value ?? "").includes("black");

    if (!selectedColor || hasCustomForPlacement || hasExactColorMockup || isBlackLike) {
      setRecoloredMockup(null);
      return;
    }

    colorizeMockupImage(resolvedBaseMockupImage, selectedColor.hex, selectedColor.value)
      .then((dataUrl) => {
        if (!cancelled) setRecoloredMockup(dataUrl);
      })
      .catch(() => {
        if (!cancelled) setRecoloredMockup(null);
      });

    return () => {
      cancelled = true;
    };
  }, [customMockups, exactColorMockup, placementId, resolvedBaseMockupImage, selectedColor]);

  return (
    <div>
      {showHeader && <h3 className="text-xl font-bold mb-4">{label}</h3>}
      {showColorBadge && selectedColor && (
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground">
          <span className="inline-block h-3 w-3 rounded-full border border-black/20" style={{ backgroundColor: selectedColor.hex }} />
          {lang === "da" ? `Valgt farve: ${selectedColor.da}` : `Selected color: ${selectedColor.en}`}
        </div>
      )}
      {stepControls && <div className="mb-4">{stepControls}</div>}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2.5fr)_minmax(260px,1fr)] lg:items-start">
        {/* Left: Preview */}
        <div
          className="bg-card rounded-2xl card-shadow p-4 sm:p-6 relative select-none overflow-hidden"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleMouseUp}
        >
          <div ref={containerRef} className="relative mx-auto w-full max-w-[860px] aspect-[3/4] rounded-2xl bg-white">
            <img
              src={mockupImage}
              alt="Product mockup"
              className="w-full h-full object-contain"
              style={{ transform: mockupTransform, transformOrigin: "center center" }}
              draggable={false}
            />

            {/* All uploaded designs rendered on mockup */}
            {uploadedDesigns.map((d, i) => (
              <div key={i} className="absolute" style={{ ...printArea, pointerEvents: "none" }}>
                <img
                  src={d.file!}
                  alt={`Design ${i + 1}`}
                  className="w-full h-full object-contain"
                  style={{
                    transform: `translate(${d.pos.x}px, ${d.pos.y}px) scale(${getVisualScale(d.scale, baseLogoWidthCm, productId, placementId)})`,
                    pointerEvents: designs.indexOf(d) === activeIndex ? "auto" : "none",
                    opacity: designs.indexOf(d) === activeIndex ? 1 : 0.5,
                  }}
                  onMouseDown={designs.indexOf(d) === activeIndex ? handleMouseDown : undefined}
                  onTouchStart={designs.indexOf(d) === activeIndex ? handleTouchStart : undefined}
                  draggable={false}
                />
              </div>
            ))}

            {isDragging && (centerGuide.x || centerGuide.y) && (
              <div className="absolute pointer-events-none" style={printArea}>
                {centerGuide.x && (
                  <div
                    className="absolute top-0 bottom-0 w-px -translate-x-1/2 bg-primary/50"
                    style={{ left: `${snapGuidePosition.x}%` }}
                  />
                )}
                {centerGuide.y && (
                  <div
                    className="absolute left-0 right-0 h-px -translate-y-1/2 bg-primary/50"
                    style={{ top: `${snapGuidePosition.y}%` }}
                  />
                )}
              </div>
            )}

            <div className="absolute pointer-events-none" style={printArea}>
              <div
                className="absolute top-0 bottom-0 w-px -translate-x-1/2 bg-primary/30"
                style={{ left: `${snapGuidePosition.x}%` }}
              />
              <div
                className="absolute left-0 right-0 h-px -translate-y-1/2 bg-primary/30"
                style={{ top: `${snapGuidePosition.y}%` }}
              />
              <button
                type="button"
                className="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/60 bg-background/80 pointer-events-auto cursor-move"
                style={{ left: `${snapGuidePosition.x}%`, top: `${snapGuidePosition.y}%` }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  startSnapCalibration(e.clientX, e.clientY, "both");
                }}
                onTouchStart={(e) => {
                  const touch = e.touches[0];
                  if (!touch) return;
                  e.preventDefault();
                  e.stopPropagation();
                  startSnapCalibration(touch.clientX, touch.clientY, "both");
                }}
                aria-label={lang === "da" ? "Juster snap-center" : "Adjust snap center"}
              />
              <button
                type="button"
                className="absolute top-0 bottom-0 w-4 -translate-x-1/2 bg-transparent pointer-events-auto cursor-ew-resize"
                style={{ left: `${snapGuidePosition.x}%` }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  startSnapCalibration(e.clientX, e.clientY, "x");
                }}
                onTouchStart={(e) => {
                  const touch = e.touches[0];
                  if (!touch) return;
                  e.preventDefault();
                  e.stopPropagation();
                  startSnapCalibration(touch.clientX, touch.clientY, "x");
                }}
                aria-label={lang === "da" ? "Flyt lodret snap-linje" : "Move vertical snap guide"}
              />
              <button
                type="button"
                className="absolute left-0 right-0 h-4 -translate-y-1/2 bg-transparent pointer-events-auto cursor-ns-resize"
                style={{ top: `${snapGuidePosition.y}%` }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  startSnapCalibration(e.clientX, e.clientY, "y");
                }}
                onTouchStart={(e) => {
                  const touch = e.touches[0];
                  if (!touch) return;
                  e.preventDefault();
                  e.stopPropagation();
                  startSnapCalibration(touch.clientX, touch.clientY, "y");
                }}
                aria-label={lang === "da" ? "Flyt vandret snap-linje" : "Move horizontal snap guide"}
              />
            </div>
          </div>
        </div>

        {/* Right: Controls */}
        <div className="space-y-4">
          <div className="bg-card rounded-2xl card-shadow p-4">
            <div>
              <label className="flex items-center justify-center gap-2 bg-card rounded-xl card-shadow p-5 cursor-pointer hover:card-shadow-hover transition-all border-2 border-dashed border-border hover:border-primary/30">
                <Upload size={18} className="text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {lang === "da" ? "Klik for at uploade (PNG, SVG, AI)" : "Click to upload (PNG, SVG, AI)"}
                </span>
                <input type="file" accept=".png,.svg,.ai,image/png,image/svg+xml" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>

            {uploadedDesigns.length > 0 ? (
              <div className="mt-3 space-y-2">
                {designs.map((design, index) => {
                  if (!design.file) return null;
                  return (
                    <div
                      key={index}
                      className={`flex items-center justify-between rounded-xl p-2 transition-all ${
                        activeIndex === index ? "bg-primary/10" : "bg-muted/40"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setActiveIndex(index)}
                        className="flex min-w-0 flex-1 items-center gap-2 text-left"
                      >
                        <img src={design.file} alt="" className="w-10 h-10 object-contain rounded bg-muted shrink-0" />
                        <span className="text-sm text-muted-foreground truncate">{design.fileName}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveDesign(index)}
                        className="p-2 hover:bg-muted rounded-lg transition-colors shrink-0"
                        title={lang === "da" ? "Fjern design" : "Remove design"}
                      >
                        <X size={18} className="text-muted-foreground" />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>

          {controlsDesign.file && (
            <div className="bg-card rounded-2xl card-shadow p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Move size={14} />
                {lang === "da" ? "Træk og tilpas dit design" : "Drag and adjust your design"}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <label className="text-xs text-muted-foreground shrink-0">{lang === "da" ? "Størrelse" : "Size"}</label>
                <input
                  type="range"
                  min={currentSizeBoundsCm.min}
                  max={currentSizeBoundsCm.max}
                  step="0.1"
                  value={Math.min(currentSizeBoundsCm.max, Math.max(currentSizeBoundsCm.min, currentLogoWidthCm))}
                  onChange={(e) => handleLogoWidthCmChange(e.target.value)}
                  onInput={(e) => handleLogoWidthCmChange((e.target as HTMLInputElement).value)}
                  className="flex-1 min-w-0 accent-primary"
                />
                <span className="text-xs text-muted-foreground w-14 shrink-0 text-right whitespace-nowrap">
                  {currentLogoWidthCm.toFixed(1)} cm
                </span>
              </div>

              <div className="mt-3">
                <label className="block text-sm font-medium mb-2">
                  {lang === "da" ? "Trykstørrelse" : "Print size"}
                  {designs.length > 1 && ` (Logo ${controlsDesignIndex + 1})`}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {sizeOptions.map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => updateDesign(controlsDesignIndex, {
                        ...controlsDesign,
                        sizeCategory: s.value,
                        scale: clampScale(controlsDesign.scale, s.value, baseLogoWidthCm),
                      })}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        controlsDesign.sizeCategory === s.value
                          ? "bg-primary text-primary-foreground"
                          : "bg-card card-shadow text-foreground hover:card-shadow-hover"
                      }`}
                    >
                      {s[lang]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlacementStep;

const colorizeMockupImage = (src: string, hex: string, colorKey?: string): Promise<string> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("No canvas context"));

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        const bg = sampleBackgroundColor(data, canvas.width, canvas.height);
        const target = hexToRgb(hex);
        const targetLum = perceivedLuminance(target.r, target.g, target.b);
        const targetChroma = Math.max(target.r, target.g, target.b) - Math.min(target.r, target.g, target.b);
        const isSoftFabricColor = colorKey === "bright-royal";
        const isWhiteColor = colorKey === "white";
        const isVibrantColor = targetChroma > 80 && targetLum > 0.2 && targetLum < 0.75;
        const threshold = 44;

        const mask = new Uint8Array(canvas.width * canvas.height);
        let minLum = 1;
        let maxLum = 0;
        let lumSum = 0;
        let count = 0;
        let minX = canvas.width;
        let minY = canvas.height;
        let maxX = 0;
        let maxY = 0;

        // Build garment mask and luminance statistics.
        for (let i = 0, p = 0; i < data.length; i += 4, p += 1) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];
          if (a === 0) continue;

          const bgDistance = Math.abs(r - bg.r) + Math.abs(g - bg.g) + Math.abs(b - bg.b);
          if (bgDistance <= threshold) continue;

          mask[p] = 1;
          const px = p % canvas.width;
          const py = Math.floor(p / canvas.width);
          minX = Math.min(minX, px);
          minY = Math.min(minY, py);
          maxX = Math.max(maxX, px);
          maxY = Math.max(maxY, py);
          const lum = perceivedLuminance(r, g, b);
          minLum = Math.min(minLum, lum);
          maxLum = Math.max(maxLum, lum);
          lumSum += lum;
          count += 1;
        }

        if (count === 0) {
          resolve(src);
          return;
        }

        const lumAvg = lumSum / count;
        const lumRange = Math.max(0.06, maxLum - minLum);
        const bboxWidth = Math.max(1, maxX - minX + 1);
        const bboxHeight = Math.max(1, maxY - minY + 1);

        for (let i = 0, p = 0; i < data.length; i += 4, p += 1) {
          if (!mask[p]) continue;
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const px = p % canvas.width;
          const py = Math.floor(p / canvas.width);
          const lum = perceivedLuminance(r, g, b);
          const n = clamp01((lum - minLum) / lumRange);
          const contrastN = Math.pow(n, targetLum < 0.25 ? 1.02 : targetLum > 0.9 ? 0.70 : 0.90);
          const shade = targetLum > 0.9
            ? isWhiteColor
              ? 0.93 + contrastN * 0.07
              : 0.88 + contrastN * 0.12
            : isSoftFabricColor
            ? 0.60 + contrastN * 0.36
            : isVibrantColor
            ? 0.54 + contrastN * 0.48
            : 0.18 + contrastN * 0.88;

          // Preserve subtle fabric texture from source channels.
          const channelAvg = (r + g + b) / 3;
          const textureStrength = isWhiteColor ? 0.18 : isSoftFabricColor ? 0.38 : 0.33;
          const texR = (r - channelAvg) * textureStrength;
          const texG = (g - channelAvg) * textureStrength;
          const texB = (b - channelAvg) * textureStrength;

          let outR = target.r * shade + texR;
          let outG = target.g * shade + texG;
          let outB = target.b * shade + texB;

          // Keep hue closer to the button swatch for colored garments.
          if (targetLum > 0.18 && targetLum < 0.9 && targetChroma > 18) {
            const colorLock = isSoftFabricColor ? 0.16 : isVibrantColor ? 0.42 : 0.18;
            outR = outR * (1 - colorLock) + target.r * colorLock;
            outG = outG * (1 - colorLock) + target.g * colorLock;
            outB = outB * (1 - colorLock) + target.b * colorLock;
          }

          // Slight desaturation for textile realism on azur blue.
          if (isSoftFabricColor) {
            const neutral = (outR + outG + outB) / 3;
            const desat = 0.28;
            outR = outR * (1 - desat) + neutral * desat;
            outG = outG * (1 - desat) + neutral * desat;
            outB = outB * (1 - desat) + neutral * desat;
          }

          // Keep natural highlights on folds; stronger for dark garments.
          const highlight = clamp01((n - 0.70) / 0.30);
          const highlightStrength = targetLum < 0.25 ? 0.14 : isWhiteColor ? 0.05 : 0.09;
          const mixWhite = highlight * highlightStrength;
          outR = outR * (1 - mixWhite) + 255 * mixWhite;
          outG = outG * (1 - mixWhite) + 255 * mixWhite;
          outB = outB * (1 - mixWhite) + 255 * mixWhite;

          // Slight depth boost around darker folds.
          const shadow = clamp01((lumAvg - lum) * (targetLum < 0.25 ? 1.8 : targetLum > 0.9 ? 0.8 : 1.25));
          const shadowStrength = targetLum < 0.25 ? 0.26 : targetLum > 0.9 ? (isWhiteColor ? 0.03 : 0.08) : isVibrantColor ? 0.14 : 0.19;

          // Edge darkening adds volume so the shirt reads less flat/fake.
          const nx = (px - minX) / bboxWidth;
          const ny = (py - minY) / bboxHeight;
          const edge = Math.max(Math.abs(nx - 0.5), Math.abs(ny - 0.5)) * 2;
          const edgeShadow = clamp01((edge - 0.58) / 0.42) * (isWhiteColor ? 0.05 : 0.12);

          const totalShadow = shadow * shadowStrength + edgeShadow;
          outR *= 1 - totalShadow;
          outG *= 1 - totalShadow;
          outB *= 1 - totalShadow;

          // Keep white garments crisp and closer to the front-view tone.
          if (isWhiteColor) {
            const whiteLift = 0.08;
            outR = outR * (1 - whiteLift) + 255 * whiteLift;
            outG = outG * (1 - whiteLift) + 255 * whiteLift;
            outB = outB * (1 - whiteLift) + 255 * whiteLift;
          }

          data[i] = clamp255(outR);
          data[i + 1] = clamp255(outG);
          data[i + 2] = clamp255(outB);
        }

        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = reject;
    img.src = src;
  });

const sampleBackgroundColor = (data: Uint8ClampedArray, width: number, height: number) => {
  const sampleSize = 12;
  let r = 0;
  let g = 0;
  let b = 0;
  let count = 0;

  for (let y = 0; y < sampleSize; y++) {
    for (let x = 0; x < sampleSize; x++) {
      const i = (y * width + x) * 4;
      r += data[i];
      g += data[i + 1];
      b += data[i + 2];
      count += 1;
    }
  }

  return {
    r: Math.round(r / count),
    g: Math.round(g / count),
    b: Math.round(b / count),
  };
};

const hexToRgb = (hex: string) => {
  const clean = hex.replace("#", "");
  const int = parseInt(clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean, 16);
  return {
    r: (int >> 16) & 255,
    g: (int >> 8) & 255,
    b: int & 255,
  };
};

const perceivedLuminance = (r: number, g: number, b: number) =>
  (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

const clamp255 = (value: number) => Math.max(0, Math.min(255, Math.round(value)));

const getScaleBounds = (sizeCategory: string, baseLogoWidthCm: number) => {
  const bounds = sizeCategoryCmBounds[sizeCategory] ?? sizeCategoryCmBounds["1-6"];
  const safeBase = Math.max(0.1, baseLogoWidthCm);
  let min = bounds.min / safeBase;
  let max = bounds.max / safeBase;

  // Guard against invalid or effectively locked slider ranges.
  if (!Number.isFinite(min) || !Number.isFinite(max) || max <= min) {
    const fallbackBase = SHIRT_WIDTH_CM * (40 / TORSO_WIDTH_PERCENT_OF_IMAGE);
    min = bounds.min / fallbackBase;
    max = bounds.max / fallbackBase;
  }

  return { min, max };
};

const clampScale = (scale: number, sizeCategory: string, baseLogoWidthCm: number) => {
  const { min, max } = getScaleBounds(sizeCategory, baseLogoWidthCm);
  return Math.min(max, Math.max(min, scale));
};

const getDefaultScale = (sizeCategory: string, baseLogoWidthCm: number) => {
  const { min, max } = getScaleBounds(sizeCategory, baseLogoWidthCm);
  return (min + max) / 2;
};

export const getVisualScale = (
  scale: number,
  baseLogoWidthCm: number,
  productId?: string,
  placementId?: string
) => {
  const cm = scale * Math.max(0.1, baseLogoWidthCm);
  let multiplier = visualScaleAnchors.upTo12;

  if (cm > 12 && cm <= 20) {
    const t = (cm - 12) / 8;
    multiplier = visualScaleAnchors.upTo12 + (visualScaleAnchors.at20 - visualScaleAnchors.upTo12) * t;
  } else if (cm > 20) {
    const t = Math.min(1, (cm - 20) / 20);
    multiplier = visualScaleAnchors.at20 + (visualScaleAnchors.at40 - visualScaleAnchors.at20) * t;
  }

  const productMultiplier =
    productId === "performance-tshirt"
      ? 1.15 * 1.25
      : productId === "basic-tshirt" || productId === "heavyweight-tshirt"
      ? 1.15
      : 1;
  const backPlacementMultiplier =
    productId === "performance-tshirt" && placementId === "fullBack" ? 0.75 : 1;
  const realisticPreviewCompensation =
    productId === "standard-hoodie" || productId === "premium-hoodie" || productId === "authentic-sweat"
      ? 0.78
      : 1;
  return scale * multiplier * productMultiplier * backPlacementMultiplier * realisticPreviewCompensation;
};
