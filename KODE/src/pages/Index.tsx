import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";
import { motion } from "framer-motion";
import { Upload, Package, Printer, Truck, Star, ArrowRight, Sparkles } from "lucide-react";
import Layout from "@/components/Layout";

const ease = [0.32, 0.72, 0, 1] as const;
const fadeUp = {
  initial: { opacity: 0, y: 12 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5, ease },
};

const stagger = {
  initial: { opacity: 0, y: 12 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
};

const Index = () => {
  const { t, lang } = useLanguage();

  const processSteps = [
    { icon: Upload, ...getProcessStep(0, lang) },
    { icon: Package, ...getProcessStep(1, lang) },
    { icon: Printer, ...getProcessStep(2, lang) },
    { icon: Truck, ...getProcessStep(3, lang) },
  ];

  const aboutIntro =
    lang === "da"
      ? "Trykeksperten er et moderne trykkeri i København med speciale i tekstiltryk, t-shirt tryk, firmatøj og storformatprint. Vi hjælper virksomheder, foreninger og events med at få deres brand ud i verden – på alt fra tøj og merchandise til bannere, plakater og skilte."
      : t("about.description");

  const aboutSections =
    lang === "da"
      ? [
          {
            title: "En stærk start",
            text: "Trykeksperten blev startet for tre år siden som et nyt lokalt trykkeri i København. Allerede fra begyndelsen fik vi en stærk start med en aftale med Danmarks førende padel-tennis kæde. Her har vi produceret tusindvis af stykker sportstøj med tryk samt leveret udskåret folie og wayfinding til deres centre.",
          },
          {
            title: "Fra små idéer til store produktioner",
            text: "Siden da har flere velkendte virksomheder valgt at samarbejde med Trykeksperten. I dag arbejder vi med både små og store opgaver – fra enkelte t-shirts til større produktioner af firmatøj, merchandise og eventmaterialer.",
          },
          {
            title: "Mere end bare tryk",
            text: "Hos os handler det ikke kun om at trykke et logo på et produkt. Vi rådgiver også om valg af tøj og materialer, placering og størrelse på trykket samt den bedste løsning til dit brand eller event.",
          },
          {
            title: "Klar til næste projekt",
            text: "Har du en idé, et projekt eller en virksomhed der skal bruge tøj med tryk, merchandise eller storformatprint, så står vi klar til at hjælpe. Ring eller skriv til os – vi er sikre på, at vi kan skabe noget rigtig godt sammen.",
          },
        ]
      : [];

  return (
    <Layout>
      {/* Hero */}
      <section className="min-h-[72svh] flex items-center relative overflow-hidden bg-[#f2f3f1]">
        <div className="absolute inset-0 bg-[linear-gradient(110deg,#f5f6f4_0%,#eef0ee_52%,#eaedeb_100%)]" />
        <div className="absolute inset-y-0 right-0 w-[62%] hero-right-art" />
        <div className="absolute inset-y-0 right-0 w-[62%] hero-fabric-texture opacity-45" />
        <div className="absolute inset-y-0 right-0 w-[62%] hero-foil-gloss opacity-90" />
        <div className="absolute inset-y-0 left-0 w-full bg-[linear-gradient(94deg,rgba(242,243,241,.95)_0%,rgba(242,243,241,.84)_38%,rgba(242,243,241,.42)_70%,rgba(242,243,241,.18)_100%)]" />
        <div className="container mx-auto px-4 lg:px-8 py-24 relative z-10">
          <motion.div className="max-w-2xl" {...fadeUp}>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-foreground leading-tight mb-6">
              {t("hero.headline")}
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-lg">
              {t("hero.subheadline")}
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/design">
                <Button variant="hero" size="lg">
                  <Upload size={18} />
                  {t("hero.uploadBtn")}
                </Button>
              </Link>
              <Link to="/tekstiltryk/produkter">
                <Button variant="heroSecondary" size="lg">
                  {t("hero.productsBtn")}
                  <ArrowRight size={18} />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* About */}
      <section className="py-24">
        <div className="container mx-auto px-4 lg:px-8">
          <motion.div className="max-w-3xl mx-auto text-center" {...fadeUp}>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">{t("about.title")}</h2>
            <p className="text-muted-foreground text-lg leading-relaxed">{aboutIntro}</p>
          </motion.div>
          {aboutSections.length > 0 && (
            <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-8">
              {aboutSections.map((section, i) => (
                <motion.div
                  key={section.title}
                  {...stagger}
                  transition={{ duration: 0.5, delay: i * 0.08, ease }}
                  className="bg-card rounded-2xl p-8 card-shadow"
                >
                  <h3 className="text-xl font-bold mb-3">{section.title}</h3>
                  <p className="text-muted-foreground">{section.text}</p>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Services */}
      <section className="py-24 bg-muted/50">
        <div className="container mx-auto px-4 lg:px-8">
          <motion.h2 className="text-3xl md:text-4xl font-bold text-center mb-16" {...fadeUp}>
            {t("services.title")}
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { key: "textile", icon: Printer, link: "/tekstiltryk" },
              { key: "largeFormat", icon: Package, link: "/storformatprint" },
              { key: "special", icon: Sparkles, link: "/design" },
            ].map((service, i) => (
              <motion.div
                key={service.key}
                {...stagger}
                transition={{ duration: 0.5, delay: i * 0.1, ease }}
              >
                <Link to={service.link}>
                  <div className="bg-card rounded-2xl p-8 card-shadow hover:card-shadow-hover transition-all duration-200 hover:-translate-y-1 h-full">
                    <service.icon size={32} className="text-primary mb-4" />
                    <h3 className="text-xl font-bold mb-2">{t(`services.${service.key}.title`)}</h3>
                    <p className="text-muted-foreground">{t(`services.${service.key}.desc`)}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-24">
        <div className="container mx-auto px-4 lg:px-8">
          <motion.h2 className="text-3xl md:text-4xl font-bold text-center mb-16" {...fadeUp}>
            {t("process.title")}
          </motion.h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {processSteps.map((step, i) => (
              <motion.div
                key={i}
                {...stagger}
                transition={{ duration: 0.5, delay: i * 0.1, ease }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <step.icon size={28} className="text-accent-foreground" />
                </div>
                <div className="text-sm font-semibold text-primary mb-2">0{i + 1}</div>
                <h3 className="text-lg font-bold mb-2">{step.title}</h3>
                <p className="text-muted-foreground text-sm">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-muted/50">
        <div className="container mx-auto px-4 lg:px-8">
          <motion.h2 className="text-3xl md:text-4xl font-bold text-center mb-16" {...fadeUp}>
            {t("testimonials.title")}
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                {...stagger}
                transition={{ duration: 0.5, delay: i * 0.1, ease }}
                className="bg-card rounded-2xl p-8 card-shadow"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} size={16} className="fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-6 italic">
                  "{getTestimonial(i, lang)}"
                </p>
                <div>
                  <div className="font-semibold text-sm">{getTestimonialName(i)}</div>
                  <div className="text-muted-foreground text-xs">{getTestimonialCompany(i)}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="container mx-auto px-4 lg:px-8">
          <motion.div className="bg-primary rounded-3xl p-12 md:p-16 text-center" {...fadeUp}>
            <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
              {t("cta.title")}
            </h2>
            <p className="text-primary-foreground/80 text-lg mb-8 max-w-md mx-auto">
              {t("cta.desc")}
            </p>
            <Link to="/design">
              <Button variant="heroSecondary" size="lg">
                <Upload size={18} />
                {t("cta.btn")}
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

// Helper functions to access translations array data
function getProcessStep(index: number, lang: "da" | "en") {
  const steps = [
    { da: { title: "Upload dit design", desc: "Send os dit logo eller design i PNG, SVG eller AI-format." }, en: { title: "Upload Your Design", desc: "Send us your logo or design in PNG, SVG or AI format." } },
    { da: { title: "Vælg produkter", desc: "Vælg blandt vores udvalg af kvalitetsprodukter." }, en: { title: "Choose Products", desc: "Choose from our selection of quality products." } },
    { da: { title: "Modtag tilbud", desc: "Vi sender dig et uforpligtende tilbud inden for 24 timer." }, en: { title: "Receive Quote", desc: "We send you a no-obligation quote within 24 hours." } },
    { da: { title: "Levering", desc: "Dit færdige produkt leveres til døren inden for 5-7 hverdage." }, en: { title: "Delivery", desc: "Your finished product is delivered to your door within 5-7 business days." } },
  ];
  return steps[index][lang];
}

function getTestimonial(index: number, lang: "da" | "en") {
  const items = [
    { da: "Fantastisk service og kvalitet. Trykeksperten leverede vores event t-shirts på rekordtid.", en: "Fantastic service and quality. Trykeksperten delivered our event t-shirts in record time." },
    { da: "Vi har brugt Trykeksperten til alt vores firmatøj i over 2 år. Altid tilfredse.", en: "We've used Trykeksperten for all our corporate wear for over 2 years. Always satisfied." },
    { da: "Professionelt, hurtigt og altid høj kvalitet. Kan varmt anbefales.", en: "Professional, fast and always high quality. Highly recommended." },
  ];
  return items[index][lang];
}

function getTestimonialName(index: number) {
  return ["Maria Jensen", "Thomas Nielsen", "Louise Andersen"][index];
}

function getTestimonialCompany(index: number) {
  return ["EventPro ApS", "Nordic Tech A/S", "GreenWave Marketing"][index];
}

export default Index;
