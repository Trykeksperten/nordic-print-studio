import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";
import { motion } from "framer-motion";
import Layout from "@/components/Layout";
import { Upload, CheckCircle2, Move } from "lucide-react";
import { toast } from "sonner";

const placements = [
  { id: "fullFront", position: { top: "20%", left: "25%", width: "50%", height: "35%" } },
  { id: "fullBack", position: { top: "20%", left: "25%", width: "50%", height: "35%" } },
  { id: "leftSleeve", position: { top: "15%", left: "5%", width: "18%", height: "20%" } },
  { id: "rightSleeve", position: { top: "15%", left: "77%", width: "18%", height: "20%" } },
  { id: "smallChest", position: { top: "22%", left: "50%", width: "20%", height: "15%" } },
  { id: "smallBack", position: { top: "25%", left: "35%", width: "25%", height: "18%" } },
];

const productOptions = [
  { value: "basic-tshirt", da: "Russell Basic T-shirt", en: "Russell Basic T-shirt" },
  { value: "heavyweight-tshirt", da: "Russell Heavyweight T-shirt", en: "Russell Heavyweight T-shirt" },
  { value: "standard-hoodie", da: "Russell Hoodie Standard", en: "Russell Hoodie Standard" },
  { value: "premium-hoodie", da: "Russell Hoodie Premium", en: "Russell Hoodie Premium" },
  { value: "performance-tshirt", da: "TriDri Performance T-shirt", en: "TriDri Performance T-shirt" },
];

const DesignUpload = () => {
  const { t, lang } = useLanguage();
  const [designFile, setDesignFile] = useState<string | null>(null);
  const [designFileName, setDesignFileName] = useState("");
  const [selectedPlacement, setSelectedPlacement] = useState("fullFront");
  const [submitted, setSubmitted] = useState(false);
  const [designPos, setDesignPos] = useState({ x: 0, y: 0 });
  const [designScale, setDesignScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; startPosX: number; startPosY: number } | null>(null);
  const mockupRef = useRef<HTMLDivElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setDesignFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setDesignFile(ev.target?.result as string);
      setDesignPos({ x: 0, y: 0 });
      setDesignScale(1);
    };
    reader.readAsDataURL(file);
  };

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragRef.current = { startX: e.clientX, startY: e.clientY, startPosX: designPos.x, startPosY: designPos.y };
  }, [designPos]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setDesignPos({ x: dragRef.current.startPosX + dx, y: dragRef.current.startPosY + dy });
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    dragRef.current = null;
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    setIsDragging(true);
    dragRef.current = { startX: touch.clientX, startY: touch.clientY, startPosX: designPos.x, startPosY: designPos.y };
  }, [designPos]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging || !dragRef.current) return;
    const touch = e.touches[0];
    const dx = touch.clientX - dragRef.current.startX;
    const dy = touch.clientY - dragRef.current.startY;
    setDesignPos({ x: dragRef.current.startPosX + dx, y: dragRef.current.startPosY + dy });
  }, [isDragging]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    toast.success(t("designPage.success"));
  };

  const currentPlacement = placements.find((p) => p.id === selectedPlacement)!;
  const quantity = 10;
  const estimatedPrice = `${(quantity * 89).toLocaleString("da-DK")} DKK`;

  if (submitted) {
    return (
      <Layout>
        <section className="py-24">
          <div className="container mx-auto px-4 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
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
      <section className="py-24 bg-gradient-to-br from-accent/50 to-background">
        <div className="container mx-auto px-4 lg:px-8">
          <motion.div
            className="max-w-2xl"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] as const }}
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{t("designPage.title")}</h1>
            <p className="text-lg text-muted-foreground">{t("designPage.subtitle")}</p>
          </motion.div>
        </div>
      </section>

      <section className="py-24">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Mockup tool */}
            <div>
              <h2 className="text-2xl font-bold mb-6">{t("designPage.mockupTitle")}</h2>

              {/* T-shirt mockup */}
              <div
                ref={mockupRef}
                className="bg-card rounded-2xl card-shadow p-8 relative select-none"
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleMouseUp}
              >
                <div className="relative aspect-[3/4] max-w-sm mx-auto">
                  {/* T-shirt SVG */}
                  <svg viewBox="0 0 300 380" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M75 50 L40 80 L20 140 L60 150 L75 100 L75 350 L225 350 L225 100 L240 150 L280 140 L260 80 L225 50 L195 30 C185 50 165 60 150 60 C135 60 115 50 105 30 L75 50Z" 
                      fill="hsl(220, 15%, 92%)" stroke="hsl(220, 10%, 80%)" strokeWidth="1.5"/>
                    {/* Collar */}
                    <path d="M105 30 C115 50 135 60 150 60 C165 60 185 50 195 30" 
                      fill="none" stroke="hsl(220, 10%, 80%)" strokeWidth="1.5"/>
                  </svg>
                  
                  {/* Print area indicator */}
                  <div
                    className="absolute border-2 border-dashed border-primary/30 rounded-lg pointer-events-none"
                    style={{
                      top: currentPlacement.position.top,
                      left: currentPlacement.position.left,
                      width: currentPlacement.position.width,
                      height: currentPlacement.position.height,
                    }}
                  />

                  {/* Uploaded design */}
                  {designFile && (
                    <div
                      className="absolute cursor-move"
                      style={{
                        top: currentPlacement.position.top,
                        left: currentPlacement.position.left,
                        width: currentPlacement.position.width,
                        height: currentPlacement.position.height,
                      }}
                    >
                      <img
                        src={designFile}
                        alt="Design preview"
                        className="w-full h-full object-contain"
                        style={{
                          transform: `translate(${designPos.x}px, ${designPos.y}px) scale(${designScale})`,
                          pointerEvents: "auto",
                        }}
                        onMouseDown={handleMouseDown}
                        onTouchStart={handleTouchStart}
                        draggable={false}
                      />
                    </div>
                  )}
                </div>

                {designFile && (
                  <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <Move size={14} />
                    {t("designPage.dragHint")}
                  </div>
                )}

                {designFile && (
                  <div className="mt-3 flex items-center justify-center gap-4">
                    <label className="text-xs text-muted-foreground">
                      {lang === "da" ? "Størrelse" : "Size"}
                    </label>
                    <input
                      type="range"
                      min="0.3"
                      max="2"
                      step="0.1"
                      value={designScale}
                      onChange={(e) => setDesignScale(parseFloat(e.target.value))}
                      className="w-32 accent-primary"
                    />
                  </div>
                )}
              </div>

              {/* File upload */}
              <div className="mt-6">
                <label className="block text-sm font-medium mb-2">{t("designPage.uploadFile")}</label>
                <label className="flex items-center justify-center gap-2 bg-card rounded-xl card-shadow p-6 cursor-pointer hover:card-shadow-hover transition-all border-2 border-dashed border-border hover:border-primary/30">
                  <Upload size={20} className="text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {designFileName || (lang === "da" ? "Klik for at uploade" : "Click to upload")}
                  </span>
                  <input
                    type="file"
                    accept=".png,.svg,.ai,image/png,image/svg+xml"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Placement selection */}
              <div className="mt-6">
                <label className="block text-sm font-medium mb-3">{t("designPage.placement")}</label>
                <div className="grid grid-cols-2 gap-2">
                  {placements.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setSelectedPlacement(p.id);
                        setDesignPos({ x: 0, y: 0 });
                      }}
                      className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        selectedPlacement === p.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-card card-shadow text-foreground hover:card-shadow-hover"
                      }`}
                    >
                      {t(`placements.${p.id}`)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Form */}
            <div>
              <h2 className="text-2xl font-bold mb-6">{t("designPage.formTitle")}</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <FormField label={t("designPage.name")} name="name" required />
                <FormField label={t("designPage.company")} name="company" />
                <FormField label={t("designPage.address")} name="address" />
                <FormField label={t("designPage.email")} name="email" type="email" required />
                <FormField label={t("designPage.phone")} name="phone" type="tel" />

                <div>
                  <label className="block text-sm font-medium mb-1.5">{t("designPage.product")}</label>
                  <select className="w-full h-11 bg-card rounded-lg px-3 text-sm ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2 outline-none card-shadow">
                    {productOptions.map((p) => (
                      <option key={p.value} value={p.value}>{p[lang]}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">{t("designPage.quantity")}</label>
                  <input
                    type="number"
                    min="10"
                    defaultValue="10"
                    className="w-full h-11 bg-card rounded-lg px-3 text-sm ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2 outline-none card-shadow"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">{t("designPage.notes")}</label>
                  <textarea
                    rows={4}
                    className="w-full bg-card rounded-lg px-3 py-2 text-sm ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2 outline-none resize-none card-shadow"
                  />
                </div>

                <div className="bg-accent rounded-xl p-4 flex justify-between items-center">
                  <span className="text-sm font-medium">{t("designPage.estimatedPrice")}</span>
                  <span className="text-lg font-bold text-accent-foreground">{estimatedPrice}</span>
                </div>

                <Button type="submit" variant="hero" size="lg" className="w-full">
                  {t("designPage.submit")}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

const FormField = ({ label, name, type = "text", required = false }: { label: string; name: string; type?: string; required?: boolean }) => (
  <div>
    <label className="block text-sm font-medium mb-1.5">{label}</label>
    <input
      type={type}
      name={name}
      required={required}
      className="w-full h-11 bg-card rounded-lg px-3 text-sm ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2 outline-none card-shadow"
    />
  </div>
);

export default DesignUpload;
