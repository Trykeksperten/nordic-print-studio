import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";
import { motion } from "framer-motion";
import Layout from "@/components/Layout";
import { productPricingById } from "@/lib/productPricing";
import { resolveAssetPath } from "@/components/design/PlacementStep";

const products = [
  {
    id: "basic-tshirt",
    da: { name: "Russell Basic T-shirt", desc: "Klassisk hverdags-t-shirt i blød bomuld. Perfekt til basistryk og events." },
    en: { name: "Russell Basic T-shirt", desc: "Classic everyday t-shirt in soft cotton. Perfect for basic prints and events." },
    sizes: ["XS", "S", "M", "L", "XL", "2XL", "3XL"],
  },
  {
    id: "heavyweight-tshirt",
    da: { name: "Russell Heavyweight T-shirt", desc: "Premium tungvægts-t-shirt med fremragende holdbarhed og komfort." },
    en: { name: "Russell Heavyweight T-shirt", desc: "Premium heavyweight t-shirt with excellent durability and comfort." },
    sizes: ["S", "M", "L", "XL", "2XL"],
  },
  {
    id: "authentic-sweat",
    da: { name: "Russell Authentic Sweat", desc: "Klassisk sweatshirt med blød komfort og ren overflade, ideel til tryk." },
    en: { name: "Russell Authentic Sweat", desc: "Classic sweatshirt with soft comfort and a clean surface, ideal for printing." },
    sizes: ["S", "M", "L", "XL", "2XL"],
  },
  {
    id: "standard-hoodie",
    da: { name: "Russell Basic Hoodie", desc: "Komfortabel hoodie i mellemvægt. Ideel til firmatøj og merchandise." },
    en: { name: "Russell Basic Hoodie", desc: "Comfortable mid-weight hoodie. Ideal for corporate wear and merchandise." },
    sizes: ["XS", "S", "M", "L", "XL", "2XL"],
  },
  {
    id: "premium-hoodie",
    da: { name: "Russell Hoodie Premium", desc: "Højkvalitets premium hoodie med tæt væv og blød indvendig fleece." },
    en: { name: "Russell Hoodie Premium", desc: "High-quality premium hoodie with dense weave and soft inner fleece." },
    sizes: ["S", "M", "L", "XL", "2XL"],
  },
  {
    id: "byb-oversized-acid-wash-tee",
    da: { name: "Build Your Brand Acid Wash Tee", desc: "Oversized acid wash t-shirt med moderne pasform og karakteristisk look." },
    en: { name: "Build Your Brand Acid Wash Tee", desc: "Oversized acid wash t-shirt with a modern fit and distinctive look." },
    sizes: ["S", "M", "L", "XL", "2XL"],
  },
  {
    id: "byb-ladies-fluffy-sweatpants",
    da: { name: "Build Your Brand, Ladies Fluffy Sweatpants", desc: "Bløde dame sweatpants i fluffy kvalitet med moderne pasform." },
    en: { name: "Build Your Brand, Ladies Fluffy Sweatpants", desc: "Soft ladies sweatpants in fluffy quality with a modern fit." },
    sizes: ["XS", "S", "M", "L", "XL"],
  },
  {
    id: "performance-tshirt",
    da: { name: "TriDri Performance T-shirt", desc: "Let og svedtransporterende performance t-shirt til sport og aktiv brug." },
    en: { name: "TriDri Performance T-shirt", desc: "Lightweight moisture-wicking performance t-shirt for sport and active use." },
    sizes: ["S", "M", "L", "XL", "2XL"],
  },
];

const productCardImages: Record<string, { front: string; back: string }> = {
  "basic-tshirt": {
    front: "/model-basic-tshirt-front.jpg",
    back: "/model-basic-tshirt-back.jpg",
  },
  "heavyweight-tshirt": {
    front: "/model-heavyweight-tshirt-front.jpg",
    back: "/model-heavyweight-tshirt-back.jpg",
  },
  "performance-tshirt": {
    front: "/model-tridri-front.jpg",
    back: "/model-tridri-back.jpg",
  },
  "byb-oversized-acid-wash-tee": {
    front: "/model-byb270-front.webp",
    back: "/model-by270-hover.webp",
  },
  "authentic-sweat": {
    front: "/model-262m-sweat-front.jpg",
    back: "/model-262m-sweat-back.jpg",
  },
  "standard-hoodie": {
    front: "/model-standard-hoodie-front.jpg",
    back: "/model-standard-hoodie-back.jpg",
  },
  "premium-hoodie": {
    front: "/model-premium-hoodie-front.jpg",
    back: "/model-premium-hoodie-back.jpg",
  },
  "byb-ladies-fluffy-sweatpants": {
    front: "/BY291_Mw1-14274 for.webp",
    back: "/BY291_Mw2-14274 bag.webp",
  },
};

const edgeFillScaleByProduct: Record<string, string> = {
  "basic-tshirt": "scale-[1.16]",
  "heavyweight-tshirt": "scale-[1.16]",
  "standard-hoodie": "scale-[1.14]",
  "premium-hoodie": "scale-[1.14]",
};

const Produkter = () => {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const title = lang === "da" ? "Produkter" : "Products";
  const subtitle = lang === "da" ? "Udforsk vores udvalg af kvalitetsprodukter" : "Explore our selection of quality products";
  const sizesLabel = lang === "da" ? "Størrelser" : "Sizes";
  const ctaLabel = lang === "da" ? "Design og få tilbud" : "Design and Get Quote";

  return (
    <Layout>
      <section className="py-1 md:py-2 bg-white">
        <div className="container mx-auto px-4 lg:px-8">
          <motion.div
            className="max-w-2xl"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] as const }}
          >
            <h1 className="text-lg md:text-xl font-bold mb-0">{title}</h1>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </motion.div>
        </div>
      </section>

      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.05, ease: [0.32, 0.72, 0, 1] as const }}
                className="group bg-white rounded-2xl overflow-hidden card-shadow hover:card-shadow-hover transition-all duration-200 hover:-translate-y-1 cursor-pointer"
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/tekstiltryk/setup/${product.id}`)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    navigate(`/tekstiltryk/setup/${product.id}`);
                  }
                }}
              >
                {/* Product image */}
                <Link to={`/tekstiltryk/setup/${product.id}`} className="block">
                  <div className="relative w-full aspect-[3/4] overflow-hidden rounded-t-2xl bg-white cursor-pointer">
                    <img
                      src={resolveAssetPath(productCardImages[product.id]?.front ?? "")}
                      alt={`${product[lang].name} front`}
                      className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 group-hover:opacity-0 ${
                        edgeFillScaleByProduct[product.id] ?? ""
                      }`}
                      loading="eager"
                      draggable={false}
                    />
                    <img
                      src={resolveAssetPath(productCardImages[product.id]?.back ?? "")}
                      alt={`${product[lang].name} back`}
                      className={`absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100 ${
                        edgeFillScaleByProduct[product.id] ?? ""
                      }`}
                      loading="eager"
                      draggable={false}
                    />
                  </div>
                </Link>
                <div className="p-6">
                  <h3 className="text-lg font-bold mb-2">{product[lang].name}</h3>
                  <p className="text-muted-foreground text-sm mb-4">{product[lang].desc}</p>
                  <p className="text-sm font-semibold mb-4">
                    {lang === "da" ? "Fra" : "From"} {productPricingById[product.id].from}
                  </p>
                  <div className="mb-4">
                    <span className="text-xs font-medium text-muted-foreground">{sizesLabel}: </span>
                    <span className="text-xs text-muted-foreground">{product.sizes.join(", ")}</span>
                  </div>
                  <Link to={`/tekstiltryk/setup/${product.id}`}>
                    <Button variant="default" size="sm" className="w-full">
                      {ctaLabel}
                    </Button>
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Produkter;
