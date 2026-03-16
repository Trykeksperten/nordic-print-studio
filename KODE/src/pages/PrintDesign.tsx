import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Layout from "@/components/Layout";
import { motion } from "framer-motion";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

type PrintProductId = "banner" | "rollup" | "poster" | "sign" | "trade-show";

type PrintProductConfig = {
  id: PrintProductId;
  da: string;
  en: string;
  sizes: string[];
};

const printProducts: PrintProductConfig[] = [
  { id: "banner", da: "Bannere", en: "Banners", sizes: ["100x200 cm", "200x300 cm", "300x500 cm"] },
  { id: "rollup", da: "Roll-ups", en: "Roll-ups", sizes: ["85x200 cm", "100x200 cm", "120x200 cm"] },
  { id: "poster", da: "Plakater", en: "Posters", sizes: ["A1", "A2", "A3", "A4", "50x70 cm", "70x100 cm"] },
  { id: "sign", da: "Skilte", en: "Signs", sizes: ["30x50 cm", "50x70 cm", "70x100 cm"] },
  { id: "trade-show", da: "Messemateriale", en: "Trade Show Materials", sizes: ["Standard", "Large", "Custom"] },
];

const PrintDesign = () => {
  const { lang } = useLanguage();
  const [searchParams] = useSearchParams();
  const requestedProduct = searchParams.get("product");
  const defaultProduct = printProducts.some((p) => p.id === requestedProduct)
    ? (requestedProduct as PrintProductId)
    : "banner";

  const [selectedProduct] = useState<PrintProductId>(defaultProduct);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [bannerWidthCm, setBannerWidthCm] = useState("100");
  const [bannerHeightCm, setBannerHeightCm] = useState("200");
  const [bannerMaterial, setBannerMaterial] = useState<"PVC" | "Mesh" | "Tekstil">("PVC");
  const [hasEyelets, setHasEyelets] = useState(false);
  const [hasEdgeReinforcement, setHasEdgeReinforcement] = useState(false);
  const [hasSiliconeEdge, setHasSiliconeEdge] = useState(false);
  const [siliconeEdgePlacement, setSiliconeEdgePlacement] = useState<"top" | "bottom" | "both">("both");
  const [hasBottomWeightBar, setHasBottomWeightBar] = useState(false);
  const [uploadedPreview, setUploadedPreview] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState("");

  const selectedProductConfig = useMemo(
    () => printProducts.find((p) => p.id === selectedProduct) ?? printProducts[0],
    [selectedProduct]
  );

  useEffect(() => {
    setSelectedSize(selectedProductConfig.sizes[0] ?? "");
  }, [selectedProductConfig]);

  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedPreview((e.target?.result as string) ?? null);
      setUploadedFileName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const title = lang === "da" ? "Design dit printprodukt" : "Design your print product";
  const subtitle =
    lang === "da"
      ? "Upload din fil, vælg størrelse og tilpas produktet visuelt."
      : "Upload your file, choose size, and customize your product visually.";
  const parsedWidth = Number(bannerWidthCm.replace(",", "."));
  const parsedHeight = Number(bannerHeightCm.replace(",", "."));
  const hasValidBannerDimensions = Number.isFinite(parsedWidth) && parsedWidth > 0 && Number.isFinite(parsedHeight) && parsedHeight > 0;

  return (
    <Layout>
      <section className="py-20 bg-gradient-to-br from-accent/50 to-background">
        <div className="container mx-auto px-4 lg:px-8">
          <motion.div
            className="max-w-2xl"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] as const }}
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{title}</h1>
            <p className="text-lg text-muted-foreground">{subtitle}</p>
          </motion.div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-10 items-start">
            <div className="space-y-5">
              <div className="bg-card rounded-2xl card-shadow p-6">
                <h2 className="text-lg font-bold mb-4">{lang === "da" ? "Produkt" : "Product"}</h2>
                <p className="text-base font-medium">{selectedProductConfig[lang]}</p>
              </div>

              <div className="bg-card rounded-2xl card-shadow p-6 space-y-4">
                <h2 className="text-lg font-bold">{lang === "da" ? "Upload fil" : "Upload file"}</h2>
                <label className="flex items-center justify-center gap-2 bg-card rounded-xl card-shadow p-5 cursor-pointer hover:card-shadow-hover transition-all border-2 border-dashed border-border hover:border-primary/30">
                  <Upload size={18} />
                  <span className="text-sm text-muted-foreground">
                    {lang === "da" ? "Klik for at uploade fil (PNG, JPG, PDF)" : "Click to upload file (PNG, JPG, PDF)"}
                  </span>
                  <input
                    type="file"
                    accept=".png,.jpg,.jpeg,.pdf,image/png,image/jpeg,application/pdf"
                    onChange={handleUpload}
                    className="hidden"
                  />
                </label>
                {uploadedFileName && (
                  <p className="text-sm text-muted-foreground">
                    {lang === "da" ? "Valgt fil:" : "Selected file:"} {uploadedFileName}
                  </p>
                )}
              </div>

              <div className="bg-card rounded-2xl card-shadow p-6 space-y-4">
                <h2 className="text-lg font-bold">{lang === "da" ? "Tilpasning" : "Customization"}</h2>
                {selectedProduct === "banner" && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium mb-1.5">
                          {lang === "da" ? "Bredde (cm)" : "Width (cm)"}
                        </label>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={bannerWidthCm}
                          onChange={(e) => setBannerWidthCm(e.target.value.replace(/[^0-9.,]/g, ""))}
                          className="w-full h-11 rounded-lg px-3 text-sm border border-input bg-background outline-none focus:ring-2 focus:ring-ring"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1.5">
                          {lang === "da" ? "Højde (cm)" : "Height (cm)"}
                        </label>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={bannerHeightCm}
                          onChange={(e) => setBannerHeightCm(e.target.value.replace(/[^0-9.,]/g, ""))}
                          className="w-full h-11 rounded-lg px-3 text-sm border border-input bg-background outline-none focus:ring-2 focus:ring-ring"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">{lang === "da" ? "Materiale" : "Material"}</label>
                      <div className="grid grid-cols-3 gap-2">
                        {(["PVC", "Mesh", "Tekstil"] as const).map((material) => (
                          <button
                            key={material}
                            type="button"
                            onClick={() => setBannerMaterial(material)}
                            className={`h-10 rounded-lg border text-sm ${
                              bannerMaterial === material ? "border-primary bg-primary/10" : "border-border"
                            }`}
                          >
                            {material}
                          </button>
                        ))}
                      </div>
                    </div>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={hasEyelets}
                        onChange={(e) => setHasEyelets(e.target.checked)}
                      />
                      {lang === "da" ? "Øksener" : "Eyelets"}
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={hasEdgeReinforcement}
                        onChange={(e) => setHasEdgeReinforcement(e.target.checked)}
                      />
                      {lang === "da" ? "Kantforstærkning" : "Edge reinforcement"}
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={hasSiliconeEdge}
                        onChange={(e) => setHasSiliconeEdge(e.target.checked)}
                      />
                      {lang === "da" ? "Siliconekant / silikonebånd til aluskinne" : "Silicone edge / silicone strip for aluminum rail"}
                    </label>
                    {hasSiliconeEdge && (
                      <div>
                        <label className="block text-sm font-medium mb-1.5">
                          {lang === "da" ? "Placering af siliconekant" : "Silicone edge placement"}
                        </label>
                        <select
                          value={siliconeEdgePlacement}
                          onChange={(e) => setSiliconeEdgePlacement(e.target.value as "top" | "bottom" | "both")}
                          className="w-full h-11 bg-card rounded-lg px-3 text-sm ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2 outline-none card-shadow"
                        >
                          <option value="top">{lang === "da" ? "Kun top" : "Top only"}</option>
                          <option value="bottom">{lang === "da" ? "Kun bund" : "Bottom only"}</option>
                          <option value="both">{lang === "da" ? "Både top og bund" : "Top and bottom"}</option>
                        </select>
                      </div>
                    )}
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={hasBottomWeightBar}
                        onChange={(e) => setHasBottomWeightBar(e.target.checked)}
                      />
                      {lang === "da" ? "Vægtstang i bunden" : "Bottom weight bar"}
                    </label>
                  </div>
                )}

                {selectedProduct !== "banner" && (
                  <div>
                    <label className="block text-sm font-medium mb-2">{lang === "da" ? "Størrelse" : "Size"}</label>
                    <select
                      value={selectedSize}
                      onChange={(e) => setSelectedSize(e.target.value)}
                      className="w-full h-11 bg-card rounded-lg px-3 text-sm ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2 outline-none card-shadow"
                    >
                      {selectedProductConfig.sizes.map((size) => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <Button className="w-full">
                  {lang === "da" ? "Gem designvalg" : "Save design options"}
                </Button>
              </div>
            </div>

            <div className="bg-card rounded-2xl card-shadow p-6">
              <h2 className="text-lg font-bold mb-3">{lang === "da" ? "Forhåndsvisning" : "Preview"}</h2>
              <p className="text-sm text-muted-foreground mb-5">
                {selectedProductConfig[lang]} • {selectedSize}
              </p>

              {selectedProduct === "banner" && (
                <div className="rounded-xl border border-border bg-white p-4">
                  <div className="aspect-[3/2] rounded-lg bg-muted/60 overflow-hidden flex items-center justify-center">
                    {uploadedPreview ? (
                      <img src={uploadedPreview} alt="" className="w-full h-full object-contain" />
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        {lang === "da" ? "Upload fil for at se banner-preview" : "Upload file to preview banner"}
                      </span>
                    )}
                  </div>
                  <div className="mt-3 text-xs text-muted-foreground space-y-1">
                    <p>
                      {lang === "da" ? "Mål:" : "Size:"}{" "}
                      {hasValidBannerDimensions ? `${bannerWidthCm} x ${bannerHeightCm} cm` : (lang === "da" ? "Indtast gyldige mål" : "Enter valid dimensions")}
                    </p>
                    <p>{lang === "da" ? "Materiale:" : "Material:"} {bannerMaterial}</p>
                    <p>{lang === "da" ? "Øksener:" : "Eyelets:"} {hasEyelets ? (lang === "da" ? "Ja" : "Yes") : (lang === "da" ? "Nej" : "No")}</p>
                    <p>
                      {lang === "da" ? "Kantforstærkning:" : "Edge reinforcement:"}{" "}
                      {hasEdgeReinforcement ? (lang === "da" ? "Ja" : "Yes") : (lang === "da" ? "Nej" : "No")}
                    </p>
                    <p>
                      {lang === "da" ? "Siliconekant:" : "Silicone edge:"}{" "}
                      {!hasSiliconeEdge
                        ? (lang === "da" ? "Nej" : "No")
                        : siliconeEdgePlacement === "top"
                        ? (lang === "da" ? "Kun top" : "Top only")
                        : siliconeEdgePlacement === "bottom"
                        ? (lang === "da" ? "Kun bund" : "Bottom only")
                        : (lang === "da" ? "Både top og bund" : "Top and bottom")}
                    </p>
                    <p>
                      {lang === "da" ? "Vægtstang i bund:" : "Bottom weight bar:"}{" "}
                      {hasBottomWeightBar ? (lang === "da" ? "Ja" : "Yes") : (lang === "da" ? "Nej" : "No")}
                    </p>
                  </div>
                </div>
              )}

              {selectedProduct === "rollup" && (
                <div className="rounded-xl border border-border bg-white p-4">
                  <div className="mx-auto w-full max-w-[260px]">
                    <div className="aspect-[2/5] rounded-t-md border border-border bg-muted/60 overflow-hidden">
                      {uploadedPreview ? (
                        <img src={uploadedPreview} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground">
                          {lang === "da" ? "Upload design til roll-up" : "Upload design for roll-up"}
                        </div>
                      )}
                    </div>
                    <div className="h-3 rounded-b-full bg-foreground/80" />
                  </div>
                </div>
              )}

              {selectedProduct === "poster" && (
                <div className="rounded-xl border border-border bg-white p-4">
                  <div className="mx-auto w-full max-w-[360px] border-8 border-muted rounded-md bg-muted/30 overflow-hidden aspect-[3/4]">
                    {uploadedPreview ? (
                      <img src={uploadedPreview} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground">
                        {lang === "da" ? "Upload billede til plakat" : "Upload image for poster"}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 text-center">{lang === "da" ? "Valgt størrelse" : "Selected size"}: {selectedSize}</p>
                </div>
              )}

              {(selectedProduct === "sign" || selectedProduct === "trade-show") && (
                <div className="rounded-xl border border-border bg-white p-4">
                  <div className="aspect-[4/3] rounded-lg bg-muted/60 overflow-hidden flex items-center justify-center">
                    {uploadedPreview ? (
                      <img src={uploadedPreview} alt="" className="w-full h-full object-contain" />
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        {lang === "da" ? "Upload fil for at se forhåndsvisning" : "Upload file to see preview"}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default PrintDesign;
