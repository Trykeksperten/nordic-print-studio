import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";
import { motion } from "framer-motion";
import Layout from "@/components/Layout";

const ease = [0.32, 0.72, 0, 1] as const;
const fadeUp = {
  initial: { opacity: 0, y: 12 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5, ease },
};

const Storformatprint = () => {
  const { t, lang } = useLanguage();

  const items = [
    {
      id: "banner",
      image: "/print-facadebanner.png",
      da: {
        title: "Bannere",
        desc: "Holdbare bannere til indendørs og udendørs brug i alle størrelser.",
      },
      en: {
        title: "Banners",
        desc: "Durable banners for indoor and outdoor use in all sizes.",
      },
    },
    {
      id: "rollup",
      image: "/print-rollup2.png",
      da: {
        title: "Roll-ups",
        desc: "Portable roll-up displays til messer og events. Let at transportere.",
      },
      en: {
        title: "Roll-ups",
        desc: "Portable roll-up displays for trade shows and events. Easy to transport.",
      },
    },
    {
      id: "poster",
      image: "/print-plakat.png",
      da: {
        title: "Plakater",
        desc: "Højtopløselige plakater i alle størrelser med skarpe farver.",
      },
      en: {
        title: "Posters",
        desc: "High-resolution posters in all sizes with sharp colors.",
      },
    },
    {
      id: "sign",
      image: "/print-banner.svg",
      da: {
        title: "Skilte",
        desc: "Professionelle skilte til din virksomhed i forskellige materialer.",
      },
      en: {
        title: "Signs",
        desc: "Professional signs for your business in various materials.",
      },
    },
    {
      id: "trade-show",
      image: "/print-tradeshow.svg",
      da: {
        title: "Messemateriale",
        desc: "Alt til din næste messe eller event - fra bannere til displays.",
      },
      en: {
        title: "Trade Show Materials",
        desc: "Everything for your next trade show or event - from banners to displays.",
      },
    },
  ];

  return (
    <Layout>
      <section className="py-1 md:py-2 bg-white">
        <div className="container mx-auto px-4 lg:px-8">
          <motion.div className="max-w-2xl" {...fadeUp}>
            <h1 className="text-lg md:text-xl font-bold mb-0">{t("largeFormatPage.title")}</h1>
            <p className="text-xs text-muted-foreground">{t("largeFormatPage.subtitle")}</p>
          </motion.div>
        </div>
      </section>

      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {items.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.05, ease }}
                className="bg-card rounded-2xl p-10 card-shadow hover:card-shadow-hover transition-all duration-200 hover:-translate-y-1 h-full"
              >
                <div className="h-full flex flex-col">
                  <div className={`mb-6 overflow-hidden rounded-xl border border-border ${item.id === "rollup" ? "bg-white" : "bg-muted/30"}`}>
                    <img
                      src={item.image}
                      alt={item[lang].title}
                      className={`w-full ${item.id === "rollup" ? "aspect-[16/10] object-contain p-2" : "aspect-[16/9] object-cover"}`}
                      loading="lazy"
                      draggable={false}
                    />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{item[lang].title}</h3>
                  <p className="text-muted-foreground mb-8 text-[1.05rem] leading-relaxed">{item[lang].desc}</p>
                  <Link to={`/print/design?product=${item.id}`} className="block mt-auto">
                    <Button size="lg" className="w-full text-base font-semibold">
                      {lang === "da" ? "Vælg et produkt" : "Select a product"}
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

export default Storformatprint;
