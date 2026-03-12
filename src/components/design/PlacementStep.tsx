import { useState, useRef, useCallback } from "react";
import { Upload, Move, X, Plus } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
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
  designs: PlacementDesign[];
  onDesignsChange: (designs: PlacementDesign[]) => void;
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

const mockupImages: Record<string, string> = {
  fullFront: hoodieFront,
  leftSleeve: hoodieSleeve,
  rightSleeve: hoodieSleeve,
  fullBack: hoodieBack,
};

export const emptyDesign = (): PlacementDesign => ({
  file: null,
  fileName: "",
  pos: { x: 0, y: 0 },
  scale: 1,
  sizeCategory: "1-6",
});

const PlacementStep = ({ placementId, label, designs, onDesignsChange }: PlacementStepProps) => {
  const { lang } = useLanguage();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; startPosX: number; startPosY: number } | null>(null);

  // Calibration state
  const defaults = defaultPrintAreas[placementId];
  const [areaPos, setAreaPos] = useState({ top: defaults.top, left: defaults.left, width: defaults.width, height: defaults.height });
  const [isDraggingArea, setIsDraggingArea] = useState(false);
  const areaDragRef = useRef<{ startX: number; startY: number; startTop: number; startLeft: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentDesign = designs[activeIndex] || emptyDesign();

  const updateDesign = (index: number, updated: PlacementDesign) => {
    const newDesigns = [...designs];
    newDesigns[index] = updated;
    onDesignsChange(newDesigns);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      updateDesign(activeIndex, {
        ...currentDesign,
        file: ev.target?.result as string,
        fileName: file.name,
        pos: { x: 0, y: 0 },
        scale: 1,
      });
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

  const handleAddDesign = () => {
    onDesignsChange([...designs, emptyDesign()]);
    setActiveIndex(designs.length);
  };

  // Design drag handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragRef.current = { startX: e.clientX, startY: e.clientY, startPosX: currentDesign.pos.x, startPosY: currentDesign.pos.y };
  }, [currentDesign.pos]);

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
    updateDesign(activeIndex, { ...currentDesign, pos: { x: dragRef.current.startPosX + dx, y: dragRef.current.startPosY + dy } });
  }, [isDragging, isDraggingArea, currentDesign, activeIndex]);

  const handleMouseUp = useCallback(() => {
    if (isDraggingArea) {
      setIsDraggingArea(false);
      console.log(`📐 Print area for "${placementId}":`, JSON.stringify({
        top: Math.round(areaPos.top), left: Math.round(areaPos.left),
        width: areaPos.width, height: areaPos.height,
      }));
    }
    setIsDragging(false);
    dragRef.current = null;
    areaDragRef.current = null;
  }, [isDraggingArea, placementId, areaPos]);

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
    updateDesign(activeIndex, { ...currentDesign, pos: { x: dragRef.current.startPosX + dx, y: dragRef.current.startPosY + dy } });
  }, [isDragging, currentDesign, activeIndex]);

  const handleAreaMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingArea(true);
    areaDragRef.current = { startX: e.clientX, startY: e.clientY, startTop: areaPos.top, startLeft: areaPos.left };
  }, [areaPos]);

  const printArea = { top: `${areaPos.top}%`, left: `${areaPos.left}%`, width: `${areaPos.width}%`, height: `${areaPos.height}%` };
  const mockupImage = mockupImages[placementId];
  const isSleeve = placementId.includes("Sleeve");
  const uploadedDesigns = designs.filter(d => d.file);

  return (
    <div>
      <h3 className="text-xl font-bold mb-4">{label}</h3>

      {/* Logo tabs when multiple */}
      {designs.length > 1 && (
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {designs.map((d, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                activeIndex === i
                  ? "bg-primary text-primary-foreground"
                  : d.file
                  ? "bg-primary/15 text-primary"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {lang === "da" ? `Logo ${i + 1}` : `Logo ${i + 1}`}
              {d.file && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
            </button>
          ))}
        </div>
      )}

      {/* Mockup */}
      <div
        className="bg-card rounded-2xl card-shadow p-4 sm:p-6 relative select-none overflow-hidden"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleMouseUp}
      >
        <div ref={containerRef} className={`relative mx-auto ${isSleeve ? "max-w-[200px]" : "max-w-[280px]"}`}>
          <img src={mockupImage} alt="Hoodie mockup" className="w-full h-auto object-contain" draggable={false} />

          {/* Print area overlay - draggable for calibration */}
          <div
            className="absolute border-2 border-dashed border-primary/60 rounded-sm cursor-move bg-primary/5 hover:bg-primary/10 transition-colors"
            style={printArea}
            onMouseDown={handleAreaMouseDown}
            title={`top: ${Math.round(areaPos.top)}%, left: ${Math.round(areaPos.left)}%`}
          >
            <span className="absolute -top-5 left-0 text-[10px] font-mono bg-primary text-primary-foreground px-1 rounded whitespace-nowrap">
              {Math.round(areaPos.top)}% / {Math.round(areaPos.left)}%
            </span>
          </div>

          {/* All uploaded designs rendered on mockup */}
          {uploadedDesigns.map((d, i) => (
            <div key={i} className="absolute" style={{ ...printArea, pointerEvents: "none" }}>
              <img
                src={d.file!}
                alt={`Design ${i + 1}`}
                className="w-full h-full object-contain"
                style={{
                  transform: `translate(${d.pos.x}px, ${d.pos.y}px) scale(${d.scale})`,
                  pointerEvents: designs.indexOf(d) === activeIndex ? "auto" : "none",
                  opacity: designs.indexOf(d) === activeIndex ? 1 : 0.5,
                }}
                onMouseDown={designs.indexOf(d) === activeIndex ? handleMouseDown : undefined}
                onTouchStart={designs.indexOf(d) === activeIndex ? handleTouchStart : undefined}
                draggable={false}
              />
            </div>
          ))}
        </div>

        {currentDesign.file && (
          <>
            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Move size={14} />
              {lang === "da" ? "Træk og tilpas dit design" : "Drag and adjust your design"}
            </div>
            <div className="mt-2 flex items-center justify-center gap-4">
              <label className="text-xs text-muted-foreground">{lang === "da" ? "Størrelse" : "Size"}</label>
              <input
                type="range" min="0.3" max="2.5" step="0.1"
                value={currentDesign.scale}
                onChange={(e) => updateDesign(activeIndex, { ...currentDesign, scale: parseFloat(e.target.value) })}
                className="w-32 accent-primary"
              />
            </div>
          </>
        )}
      </div>

      {/* File upload / current file */}
      <div className="mt-4">
        {currentDesign.file ? (
          <div className="flex items-center justify-between bg-card rounded-xl card-shadow p-4">
            <div className="flex items-center gap-3 min-w-0">
              <img src={currentDesign.file} alt="" className="w-10 h-10 object-contain rounded bg-muted shrink-0" />
              <span className="text-sm text-muted-foreground truncate">{currentDesign.fileName}</span>
            </div>
            <button
              type="button"
              onClick={() => handleRemoveDesign(activeIndex)}
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

      {/* Add extra logo button */}
      {currentDesign.file && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddDesign}
          className="mt-3 w-full"
        >
          <Plus size={16} className="mr-1.5" />
          {lang === "da" ? "Tilføj ekstra logo" : "Add extra logo"}
        </Button>
      )}

      {/* Size category for pricing */}
      {currentDesign.file && (
        <div className="mt-4">
          <label className="block text-sm font-medium mb-2">
            {lang === "da" ? "Trykstørrelse" : "Print size"}
            {designs.length > 1 && ` (Logo ${activeIndex + 1})`}
          </label>
          <div className="grid grid-cols-2 gap-2">
            {sizeOptions.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => updateDesign(activeIndex, { ...currentDesign, sizeCategory: s.value })}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  currentDesign.sizeCategory === s.value
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
