import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";
import { motion } from "framer-motion";
import Layout from "@/components/Layout";
import { Upload } from "lucide-react";

const ease = [0.32, 0.72, 0, 1] as const;
const fadeUp = {
  initial: { opacity: 0, y: 12 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5, ease },
};

const Storformatprint = () => {
  const { lang } = useLanguage();

  const items = [
    { da: { title: "Bannere", desc: "Holdbare bannere til indendørs og udendørs brug i alle størrelser." }, en: { title: "Banners", desc: "Durable banners for indoor and outdoor use in all sizes." } },
    { da: { title: "Roll-ups", desc: "Portable roll-up displays til messer og events. Let at transportere." }, en: { title: "Roll-ups", desc: "Portable roll-up displays for trade shows and events. Easy to transport." } },
    { da: { title: "Plakater", desc: "Højtopløselige plakater i alle størrelser med skarpe farver." }, en: { title: "Posters", desc: "High-resolution posters in all sizes with sharp colors." } },
    { da: { title: "Skilte", desc: "Professionelle skilte til din virksomhed i forskellige materialer." }, en: { title: "Signs", desc: "Professional signs for your business in various materials." } },
    { da: { title: "Messemateriale", desc: "Alt til din næste messe eller event - fra bannere til displays." }, en: { title: "Trade Show Materials", desc: "Everything for your next trade show or event - from banners to displays." } },
  ];

  const title = lang === "da" ? "Storformatprint" : "Large Format Print";
  const subtitle = lang === "da" ? "Professionelle printløsninger i stort format" : "Professional large format print solutions";
  const ctaText = lang === "da" ? "Få et tilbud" : "Get a Quote";

  return (
    <Layout>
      <section className="py-24 bg-gradient-to-br from-accent/50 to-background">
        <div className="container mx-auto px-4 lg:px-8">
          <motion.div className="max-w-2xl" {...fadeUp}>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{title}</h1>
            <p className="text-lg text-muted-foreground">{subtitle}</p>
          </motion.div>
        </div>
      </section>

      <section className="py-24">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {items.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.05, ease }}
                className="bg-card rounded-2xl p-8 card-shadow hover:card-shadow-hover transition-all duration-200 hover:-translate-y-1"
              >
                <h3 className="text-xl font-bold mb-3">{item[lang].title}</h3>
                <p className="text-muted-foreground">{item[lang].desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-muted/50">
        <div className="container mx-auto px-4 lg:px-8 text-center">
          <motion.div {...fadeUp}>
            <Link to="/design">
              <Button variant="hero" size="lg">
                <Upload size={18} />
                {ctaText}
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default Storformatprint;
