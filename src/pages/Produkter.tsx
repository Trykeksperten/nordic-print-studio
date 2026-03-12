import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";
import { motion } from "framer-motion";
import Layout from "@/components/Layout";

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
    id: "standard-hoodie",
    da: { name: "Russell Hoodie Standard", desc: "Komfortabel hoodie i mellemvægt. Ideel til firmatøj og merchandise." },
    en: { name: "Russell Hoodie Standard", desc: "Comfortable mid-weight hoodie. Ideal for corporate wear and merchandise." },
    sizes: ["XS", "S", "M", "L", "XL", "2XL"],
  },
  {
    id: "premium-hoodie",
    da: { name: "Russell Hoodie Premium", desc: "Højkvalitets premium hoodie med tæt væv og blød indvendig fleece." },
    en: { name: "Russell Hoodie Premium", desc: "High-quality premium hoodie with dense weave and soft inner fleece." },
    sizes: ["S", "M", "L", "XL", "2XL"],
  },
  {
    id: "performance-tshirt",
    da: { name: "TriDri Performance T-shirt", desc: "Teknisk sports-t-shirt med fugttransporterende egenskaber." },
    en: { name: "TriDri Performance T-shirt", desc: "Technical sports t-shirt with moisture-wicking properties." },
    sizes: ["XS", "S", "M", "L", "XL", "2XL"],
  },
];

const Produkter = () => {
  const { lang } = useLanguage();
  const title = lang === "da" ? "Produkter" : "Products";
  const subtitle = lang === "da" ? "Udforsk vores udvalg af kvalitetsprodukter" : "Explore our selection of quality products";
  const sizesLabel = lang === "da" ? "Størrelser" : "Sizes";
  const ctaLabel = lang === "da" ? "Design og få tilbud" : "Design and Get Quote";

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
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{title}</h1>
            <p className="text-lg text-muted-foreground">{subtitle}</p>
          </motion.div>
        </div>
      </section>

      <section className="py-24">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.05, ease: [0.32, 0.72, 0, 1] as const }}
                className="bg-card rounded-2xl overflow-hidden card-shadow hover:card-shadow-hover transition-all duration-200 hover:-translate-y-1"
              >
                {/* Product image */}
                <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden">
                  {product.id === "basic-tshirt" ? (
                    <img
                      src="/russell-basic-tshirt.png"
                      alt={product[lang].name}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="text-6xl text-muted-foreground/20">
                      {product.id.includes("hoodie") ? "🧥" : "👕"}
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-bold mb-2">{product[lang].name}</h3>
                  <p className="text-muted-foreground text-sm mb-4">{product[lang].desc}</p>
                  <div className="mb-4">
                    <span className="text-xs font-medium text-muted-foreground">{sizesLabel}: </span>
                    <span className="text-xs text-muted-foreground">{product.sizes.join(", ")}</span>
                  </div>
                  <Link to="/design">
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
