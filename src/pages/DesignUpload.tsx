import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";
import { motion } from "framer-motion";
import Layout from "@/components/Layout";
import { CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import PlacementStep, { type PlacementDesign, emptyDesign } from "@/components/design/PlacementStep";
import PriceSummary from "@/components/design/PriceSummary";

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

const productOptions = [
  { value: "basic-tshirt", da: "Russell Basic T-shirt", en: "Russell Basic T-shirt" },
  { value: "heavyweight-tshirt", da: "Russell Heavyweight T-shirt", en: "Russell Heavyweight T-shirt" },
  { value: "standard-hoodie", da: "Russell Hoodie Standard", en: "Russell Hoodie Standard" },
  { value: "premium-hoodie", da: "Russell Hoodie Premium", en: "Russell Hoodie Premium" },
  { value: "performance-tshirt", da: "TriDri Performance T-shirt", en: "TriDri Performance T-shirt" },
];

const DesignUpload = () => {
  const { t, lang } = useLanguage();
  const [currentStep, setCurrentStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [quantity, setQuantity] = useState(10);
  const [designs, setDesigns] = useState<Record<string, PlacementDesign[]>>(() => {
    const init: Record<string, PlacementDesign[]> = {};
    steps.forEach((s) => { init[s.id] = [emptyDesign()]; });
    return init;
  });

  const totalSteps = steps.length;
  const isFormStep = currentStep >= totalSteps;

  // Count total uploaded designs across all placements
  const allActiveDesigns: { placementId: string; design: PlacementDesign }[] = [];
  Object.entries(designs).forEach(([id, list]) => {
    list.forEach((d) => { if (d.file) allActiveDesigns.push({ placementId: id, design: d }); });
  });

  const placementLabelsResolved = Object.fromEntries(
    Object.entries(stepLabels).map(([k, v]) => [k, v[lang]])
  );

  const handleDesignsChange = (id: string, newDesigns: PlacementDesign[]) => {
    setDesigns((prev) => ({ ...prev, [id]: newDesigns }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (allActiveDesigns.length === 0) {
      toast.error(lang === "da" ? "Upload mindst ét design" : "Upload at least one design");
      return;
    }
    setSubmitted(true);
    toast.success(t("designPage.success"));
  };

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
      <section className="py-24 bg-gradient-to-br from-accent/50 to-background">
        <div className="container mx-auto px-4 lg:px-8">
          <motion.div className="max-w-2xl" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] as const }}>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{t("designPage.title")}</h1>
            <p className="text-lg text-muted-foreground">{t("designPage.subtitle")}</p>
          </motion.div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4 lg:px-8">
          {/* Step indicators */}
          <div className="flex items-center justify-center gap-2 mb-10 flex-wrap">
            {steps.map((s, i) => {
              const hasDesign = designs[s.id].some(d => d.file !== null);
              const designCount = designs[s.id].filter(d => d.file !== null).length;
              return (
                <button
                  key={s.id}
                  onClick={() => setCurrentStep(i)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
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
                  {stepLabels[s.id][lang]}
                  {hasDesign && (
                    <span className="flex items-center gap-1">
                      <CheckCircle2 size={14} />
                      {designCount > 1 && <span className="text-xs">×{designCount}</span>}
                    </span>
                  )}
                </button>
              );
            })}
            <button
              onClick={() => setCurrentStep(totalSteps)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                isFormStep ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs bg-background/20">
                {totalSteps + 1}
              </span>
              {lang === "da" ? "Bestil" : "Order"}
            </button>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Left: Design / Form */}
            <motion.div key={currentStep} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
              {!isFormStep ? (
                <PlacementStep
                  placementId={steps[currentStep].id}
                  label={stepLabels[steps[currentStep].id][lang]}
                  designs={designs[steps[currentStep].id]}
                  onDesignsChange={(d) => handleDesignsChange(steps[currentStep].id, d)}
                />
              ) : (
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
                        type="number" min="10" value={quantity}
                        onChange={(e) => setQuantity(Math.max(10, parseInt(e.target.value) || 10))}
                        className="w-full h-11 bg-card rounded-lg px-3 text-sm ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2 outline-none card-shadow"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1.5">{t("designPage.notes")}</label>
                      <textarea rows={4} className="w-full bg-card rounded-lg px-3 py-2 text-sm ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2 outline-none resize-none card-shadow" />
                    </div>

                    <PriceSummary designs={designs} quantity={quantity} placementLabels={placementLabelsResolved} />

                    <Button type="submit" variant="hero" size="lg" className="w-full">
                      {t("designPage.submit")}
                    </Button>
                  </form>
                </div>
              )}
            </motion.div>

            {/* Right: Summary & navigation */}
            <div className="space-y-6">
              <div className="bg-card rounded-2xl card-shadow p-6">
                <h3 className="text-lg font-bold mb-4">
                  {lang === "da" ? "Dine designs" : "Your Designs"}
                </h3>
                {allActiveDesigns.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {lang === "da"
                      ? "Du har ikke uploadet noget design endnu. Upload mindst ét design for at fortsætte."
                      : "You haven't uploaded any design yet. Upload at least one design to continue."}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {allActiveDesigns.map(({ placementId, design }, i) => {
                      const placementDesigns = designs[placementId].filter(d => d.file);
                      const logoNum = placementDesigns.length > 1
                        ? ` – Logo ${designs[placementId].indexOf(design) + 1}`
                        : "";
                      return (
                        <div key={`${placementId}-${i}`} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                          <img src={design.file!} alt="" className="w-10 h-10 object-contain rounded" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{placementLabelsResolved[placementId]}{logoNum}</p>
                            <p className="text-xs text-muted-foreground truncate">{design.fileName}</p>
                          </div>
                          <CheckCircle2 size={16} className="text-primary shrink-0" />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Pricing info */}
              <div className="bg-card rounded-2xl card-shadow p-6">
                <h3 className="text-lg font-bold mb-3">
                  {lang === "da" ? "Prisstruktur" : "Pricing Structure"}
                </h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>
                    <span className="font-medium text-foreground">{lang === "da" ? "Opstart (første tryk):" : "Setup (first print):"}</span>{" "}
                    295 DKK
                  </p>
                  <p>
                    <span className="font-medium text-foreground">{lang === "da" ? "Opstart (ekstra tryk):" : "Setup (additional):"}</span>{" "}
                    150 DKK
                  </p>
                  <div className="border-t border-border pt-2 mt-2">
                    <p className="font-medium text-foreground mb-1">{lang === "da" ? "Trykpris pr. stk:" : "Print price per unit:"}</p>
                    <p>1–6 cm: 30 DKK</p>
                    <p>6–12 cm: 35 DKK</p>
                    <p>12–20 cm: 40 DKK</p>
                    <p>20–40 cm: 50 DKK</p>
                  </div>
                </div>
              </div>

              {/* Navigation buttons */}
              <div className="flex gap-3">
                {currentStep > 0 && (
                  <Button variant="outline" onClick={() => setCurrentStep((s) => s - 1)} className="flex-1">
                    <ChevronLeft size={16} />
                    {lang === "da" ? "Forrige" : "Previous"}
                  </Button>
                )}
                {currentStep < totalSteps && (
                  <Button
                    onClick={() => setCurrentStep((s) => s + 1)}
                    className="flex-1"
                  >
                    {currentStep < totalSteps - 1
                      ? (lang === "da" ? "Næste placering" : "Next Placement")
                      : (lang === "da" ? "Gå til bestilling" : "Go to Order")}
                    <ChevronRight size={16} />
                  </Button>
                )}
              </div>

              {!isFormStep && (
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

const FormField = ({ label, name, type = "text", required = false }: { label: string; name: string; type?: string; required?: boolean }) => (
  <div>
    <label className="block text-sm font-medium mb-1.5">{label}</label>
    <input
      type={type} name={name} required={required}
      className="w-full h-11 bg-card rounded-lg px-3 text-sm ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2 outline-none card-shadow"
    />
  </div>
);

export default DesignUpload;
