import { useState, useRef, useCallback } from "react";
import { Upload, Move, X } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import hoodieFront from "@/assets/hoodie-front.png";
import hoodieBack from "@/assets/hoodie-back.png";
import hoodieSleeve from "@/assets/hoodie-sleeve.png";

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
  design: PlacementDesign;
  onDesignChange: (design: PlacementDesign) => void;
}

const sizeOptions = [
  { value: "1-6", da: "1–6 cm (30 DKK)", en: "1–6 cm (30 DKK)" },
  { value: "6-12", da: "6–12 cm (35 DKK)", en: "6–12 cm (35 DKK)" },
  { value: "12-20", da: "12–20 cm (40 DKK)", en: "12–20 cm (40 DKK)" },
  { value: "20-40", da: "20–40 cm (50 DKK)", en: "20–40 cm (50 DKK)" },
];

// Default print areas (relative coordinates in %)
const defaultPrintAreas: Record<string, { top: number; left: number; width: number; height: number }> = {
  fullFront: { top: 22, left: 30, width: 40, height: 30 },
  leftSleeve: { top: 40, left: 12, width: 22, height: 18 },
  rightSleeve: { top: 40, left: 66, width: 22, height: 18 },
  fullBack: { top: 22, left: 30, width: 40, height: 35 },
};

// Mockup images for each placement
const mockupImages: Record<string, string> = {
  fullFront: hoodieFront,
  leftSleeve: hoodieSleeve,
  rightSleeve: hoodieSleeve,
  fullBack: hoodieBack,
};

const PlacementStep = ({ placementId, label, design, onDesignChange }: PlacementStepProps) => {
  const { lang } = useLanguage();
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; startPosX: number; startPosY: number } | null>(null);

  // Calibration: draggable print area
  const defaults = defaultPrintAreas[placementId];
  const [areaPos, setAreaPos] = useState({ top: defaults.top, left: defaults.left, width: defaults.width, height: defaults.height });
  const [isDraggingArea, setIsDraggingArea] = useState(false);
  const areaDragRef = useRef<{ startX: number; startY: number; startTop: number; startLeft: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      onDesignChange({
        ...design,
        file: ev.target?.result as string,
        fileName: file.name,
        pos: { x: 0, y: 0 },
        scale: 1,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveDesign = () => {
    onDesignChange({
      file: null,
      fileName: "",
      pos: { x: 0, y: 0 },
      scale: 1,
      sizeCategory: "1-6",
    });
  };

  // Design drag handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragRef.current = { startX: e.clientX, startY: e.clientY, startPosX: design.pos.x, startPosY: design.pos.y };
  }, [design.pos]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
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
    onDesignChange({ ...design, pos: { x: dragRef.current.startPosX + dx, y: dragRef.current.startPosY + dy } });
  }, [isDragging, isDraggingArea, design, onDesignChange]);

  const handleMouseUp = useCallback(() => {
    if (isDraggingArea) {
      setIsDraggingArea(false);
      // Log final position for calibration
      console.log(`📐 Print area for "${placementId}":`, JSON.stringify({
        top: Math.round(areaPos.top),
        left: Math.round(areaPos.left),
        width: areaPos.width,
        height: areaPos.height,
      }));
    }
    setIsDragging(false);
    dragRef.current = null;
    areaDragRef.current = null;
  }, [isDraggingArea, placementId, areaPos]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    setIsDragging(true);
    dragRef.current = { startX: touch.clientX, startY: touch.clientY, startPosX: design.pos.x, startPosY: design.pos.y };
  }, [design.pos]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging || !dragRef.current) return;
    const touch = e.touches[0];
    const dx = touch.clientX - dragRef.current.startX;
    const dy = touch.clientY - dragRef.current.startY;
    onDesignChange({ ...design, pos: { x: dragRef.current.startPosX + dx, y: dragRef.current.startPosY + dy } });
  }, [isDragging, design, onDesignChange]);

  // Area drag start
  const handleAreaMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingArea(true);
    areaDragRef.current = { startX: e.clientX, startY: e.clientY, startTop: areaPos.top, startLeft: areaPos.left };
  }, [areaPos]);

  const printArea = { top: `${areaPos.top}%`, left: `${areaPos.left}%`, width: `${areaPos.width}%`, height: `${areaPos.height}%` };
  const mockupImage = mockupImages[placementId];
  const isSleeve = placementId.includes("Sleeve");

  return (
    <div>
      <h3 className="text-xl font-bold mb-4">{label}</h3>

      {/* Mockup with real hoodie image */}
      <div
        className="bg-card rounded-2xl card-shadow p-4 sm:p-6 relative select-none overflow-hidden"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleMouseUp}
      >
        <div className={`relative mx-auto ${isSleeve ? "max-w-[200px]" : "max-w-[280px]"}`}>
          {/* Hoodie image */}
          <img
            src={mockupImage}
            alt="Hoodie mockup"
            className="w-full h-auto object-contain"
            draggable={false}
          />

          {/* Print area overlay */}
          <div
            className="absolute border-2 border-dashed border-primary/40 rounded-sm pointer-events-none"
            style={printArea}
          />

          {/* Uploaded design */}
          {design.file && (
            <div className="absolute cursor-move" style={printArea}>
              <img
                src={design.file}
                alt="Design preview"
                className="w-full h-full object-contain"
                style={{
                  transform: `translate(${design.pos.x}px, ${design.pos.y}px) scale(${design.scale})`,
                  pointerEvents: "auto",
                }}
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
                draggable={false}
              />
            </div>
          )}
        </div>

        {design.file && (
          <>
            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Move size={14} />
              {lang === "da" ? "Træk og tilpas dit design" : "Drag and adjust your design"}
            </div>
            <div className="mt-2 flex items-center justify-center gap-4">
              <label className="text-xs text-muted-foreground">{lang === "da" ? "Størrelse" : "Size"}</label>
              <input
                type="range" min="0.3" max="2.5" step="0.1"
                value={design.scale}
                onChange={(e) => onDesignChange({ ...design, scale: parseFloat(e.target.value) })}
                className="w-32 accent-primary"
              />
            </div>
          </>
        )}
      </div>

      {/* File upload */}
      <div className="mt-4">
        {design.file ? (
          <div className="flex items-center justify-between bg-card rounded-xl card-shadow p-4">
            <div className="flex items-center gap-3 min-w-0">
              <img src={design.file} alt="" className="w-10 h-10 object-contain rounded bg-muted shrink-0" />
              <span className="text-sm text-muted-foreground truncate">{design.fileName}</span>
            </div>
            <button
              type="button"
              onClick={handleRemoveDesign}
              className="p-2 hover:bg-muted rounded-lg transition-colors shrink-0"
              title={lang === "da" ? "Fjern design" : "Remove design"}
            >
              <X size={18} className="text-muted-foreground" />
            </button>
          </div>
        ) : (
          <label className="flex items-center justify-center gap-2 bg-card rounded-xl card-shadow p-5 cursor-pointer hover:card-shadow-hover transition-all border-2 border-dashed border-border hover:border-primary/30">
            <Upload size={18} className="text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {lang === "da" ? "Klik for at uploade (PNG, SVG, AI)" : "Click to upload (PNG, SVG, AI)"}
            </span>
            <input type="file" accept=".png,.svg,.ai,image/png,image/svg+xml" onChange={handleFileUpload} className="hidden" />
          </label>
        )}
      </div>

      {/* Size category for pricing */}
      {design.file && (
        <div className="mt-4">
          <label className="block text-sm font-medium mb-2">
            {lang === "da" ? "Trykstørrelse" : "Print size"}
          </label>
          <div className="grid grid-cols-2 gap-2">
            {sizeOptions.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => onDesignChange({ ...design, sizeCategory: s.value })}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  design.sizeCategory === s.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-card card-shadow text-foreground hover:card-shadow-hover"
                }`}
              >
                {s[lang]}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PlacementStep;
