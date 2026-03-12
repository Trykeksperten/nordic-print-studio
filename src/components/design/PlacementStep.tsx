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

// Print areas for each placement (relative coordinates in %)
const printAreas: Record<string, { top: string; left: string; width: string; height: string }> = {
  fullFront: { top: "22%", left: "30%", width: "40%", height: "30%" },
  leftSleeve: { top: "40%", left: "12%", width: "22%", height: "18%" },
  rightSleeve: { top: "40%", left: "66%", width: "22%", height: "18%" },
  fullBack: { top: "22%", left: "30%", width: "40%", height: "35%" },
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

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragRef.current = { startX: e.clientX, startY: e.clientY, startPosX: design.pos.x, startPosY: design.pos.y };
  }, [design.pos]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    onDesignChange({ ...design, pos: { x: dragRef.current.startPosX + dx, y: dragRef.current.startPosY + dy } });
  }, [isDragging, design, onDesignChange]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    dragRef.current = null;
  }, []);

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

  const printArea = printAreas[placementId];
  const mockupImage = mockupImages[placementId];
  const isSleeve = placementId.includes("Sleeve");

  return (
    <div>
      <h3 className="text-xl font-bold mb-4">{label}</h3>

      {/* Mockup */}
      <div
        className="bg-card rounded-2xl card-shadow p-6 relative select-none"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleMouseUp}
      >
        <div className="relative aspect-[3/4] max-w-xs mx-auto">
          <svg viewBox="0 0 300 380" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M75 50 L40 80 L20 140 L60 150 L75 100 L75 350 L225 350 L225 100 L240 150 L280 140 L260 80 L225 50 L195 30 C185 50 165 60 150 60 C135 60 115 50 105 30 L75 50Z"
              fill="hsl(220, 15%, 92%)" stroke="hsl(220, 10%, 80%)" strokeWidth="1.5"
            />
            <path
              d="M105 30 C115 50 135 60 150 60 C165 60 185 50 195 30"
              fill="none" stroke="hsl(220, 10%, 80%)" strokeWidth="1.5"
            />
            {isBack && (
              <text x="150" y="370" textAnchor="middle" fontSize="10" fill="hsl(220, 10%, 70%)">
                {lang === "da" ? "BAGSIDE" : "BACK"}
              </text>
            )}
          </svg>

          {/* Print area */}
          <div
            className="absolute border-2 border-dashed border-primary/30 rounded-lg pointer-events-none"
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
            <div className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Move size={14} />
              {lang === "da" ? "Træk og tilpas dit design" : "Drag and adjust your design"}
            </div>
            <div className="mt-2 flex items-center justify-center gap-4">
              <label className="text-xs text-muted-foreground">{lang === "da" ? "Størrelse" : "Size"}</label>
              <input
                type="range" min="0.3" max="2" step="0.1"
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
        <label className="flex items-center justify-center gap-2 bg-card rounded-xl card-shadow p-5 cursor-pointer hover:card-shadow-hover transition-all border-2 border-dashed border-border hover:border-primary/30">
          <Upload size={18} className="text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {design.fileName || (lang === "da" ? "Klik for at uploade (PNG, SVG, AI)" : "Click to upload (PNG, SVG, AI)")}
          </span>
          <input type="file" accept=".png,.svg,.ai,image/png,image/svg+xml" onChange={handleFileUpload} className="hidden" />
        </label>
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
