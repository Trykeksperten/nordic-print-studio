import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";
import { motion } from "framer-motion";
import Layout from "@/components/Layout";
import { Upload, CheckCircle } from "lucide-react";

const ease = [0.32, 0.72, 0, 1] as const;
const fadeUp = {
  initial: { opacity: 0, y: 12 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5, ease },
};

const Tekstiltryk = () => {
  const { t, lang } = useLanguage();

  const products = lang === "da"
    ? ["T-shirts", "Hoodies", "Arbejdstøj", "Merchandise", "Firmatøj"]
    : ["T-shirts", "Hoodies", "Workwear", "Merchandise", "Corporate Wear"];

  const placements = lang === "da"
    ? ["Hel front", "Hel ryg", "Venstre ærme", "Højre ærme", "Lille brysttryk", "Lille tryk bagpå"]
    : ["Full Front", "Full Back", "Left Sleeve", "Right Sleeve", "Small Chest Print", "Small Back Print"];

  return (
    <Layout>
      {/* Hero */}
      <section className="py-24 bg-gradient-to-br from-accent/50 to-background">
        <div className="container mx-auto px-4 lg:px-8">
          <motion.div className="max-w-2xl" {...fadeUp}>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{t("textilePage.title")}</h1>
            <p className="text-lg text-muted-foreground">{t("textilePage.subtitle")}</p>
          </motion.div>
        </div>
      </section>

      {/* Products */}
      <section className="py-24">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid md:grid-cols-2 gap-16">
            <motion.div {...fadeUp}>
              <h2 className="text-2xl font-bold mb-6">{t("textilePage.products.title")}</h2>
              <div className="space-y-3">
                {products.map((p) => (
                  <div key={p} className="flex items-center gap-3">
                    <CheckCircle size={20} className="text-primary shrink-0" />
                    <span className="text-foreground">{p}</span>
                  </div>
                ))}
              </div>
            </motion.div>
            <motion.div {...fadeUp} transition={{ delay: 0.1 }}>
              <h2 className="text-2xl font-bold mb-6">{t("textilePage.placements.title")}</h2>
              <div className="space-y-3">
                {placements.map((p) => (
                  <div key={p} className="flex items-center gap-3">
                    <CheckCircle size={20} className="text-primary shrink-0" />
                    <span className="text-foreground">{p}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Info */}
      <section className="py-24 bg-muted/50">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8">
            <motion.div {...fadeUp} className="bg-card rounded-2xl p-8 card-shadow">
              <h3 className="text-xl font-bold mb-3">{t("textilePage.minimum.title")}</h3>
              <p className="text-muted-foreground">{t("textilePage.minimum.desc")}</p>
            </motion.div>
            <motion.div {...fadeUp} transition={{ delay: 0.1 }} className="bg-card rounded-2xl p-8 card-shadow">
              <h3 className="text-xl font-bold mb-3">{t("textilePage.delivery.title")}</h3>
              <p className="text-muted-foreground">{t("textilePage.delivery.desc")}</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="container mx-auto px-4 lg:px-8 text-center">
          <motion.div {...fadeUp}>
            <Link to="/design">
              <Button variant="hero" size="lg">
                <Upload size={18} />
                {t("hero.uploadBtn")}
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default Tekstiltryk;
