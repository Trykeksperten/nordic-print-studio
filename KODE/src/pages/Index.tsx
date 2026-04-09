import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, MapPin, Printer, Shirt, Sparkles } from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";

const fadeUp = {
  initial: { opacity: 0, y: 14 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5, ease: [0.32, 0.72, 0, 1] as const },
};

const Index = () => {
  const { lang } = useLanguage();
  const isDa = lang === "da";
  const apparelButtonLogoSrc = `${import.meta.env.BASE_URL}knapper/toj-knap.png`;
  const printButtonLogoSrc = `${import.meta.env.BASE_URL}knapper/print-knap.png`;
  const [showDesignChoices, setShowDesignChoices] = useState(false);

  useEffect(() => {
    const title = isDa
      ? "Trykeksperten | Tekstiltryk, Storformatprint og Firmatøj i København"
      : "Trykeksperten | Textile Printing, Large Format Print and Corporate Wear in Copenhagen";
    const description = isDa
      ? "Trykeksperten leverer tekstiltryk, storformatprint og designproduktion i høj kvalitet for virksomheder, foreninger og events i København og hele Danmark."
      : "Trykeksperten delivers premium textile printing, large format print, and design production for companies, associations, and events in Copenhagen and across Denmark.";

    document.title = title;
    const descriptionTag = document.querySelector('meta[name="description"]');
    if (descriptionTag) descriptionTag.setAttribute("content", description);
  }, [isDa]);

  return (
    <Layout>
      <section className="relative overflow-hidden bg-[linear-gradient(180deg,#f4f8f6_0%,#ffffff_100%)] py-16 md:py-24">
        <div className="absolute -top-20 -left-20 h-56 w-56 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute -bottom-16 -right-14 h-56 w-56 rounded-full bg-emerald-200/60 blur-3xl" />
        <div className="container relative mx-auto px-4 lg:px-8">
          <motion.div {...fadeUp} className="max-w-5xl mx-auto text-center">
            <div className="mb-5 flex flex-wrap justify-center gap-2">
              <span className="rounded-full border border-primary/25 bg-background/85 px-4 py-1.5 text-xs font-medium text-primary">
                {isDa ? "Kreativ produktion" : "Creative production"}
              </span>
              <span className="rounded-full border border-primary/25 bg-background/85 px-4 py-1.5 text-xs font-medium text-primary">
                {isDa ? "Hurtig levering" : "Fast delivery"}
              </span>
              <span className="rounded-full border border-primary/25 bg-background/85 px-4 py-1.5 text-xs font-medium text-primary">
                {isDa ? "Top kvalitet" : "Top quality"}
              </span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight text-foreground">
              {isDa ? "Lad os gøre din idé synlig" : "Let us make your idea visible"}
            </h1>
            <p className="mt-5 text-base md:text-xl text-muted-foreground max-w-3xl mx-auto">
              {isDa ? "Vælg en retning og kom i gang på under ét minut." : "Pick a direction and get started in under a minute."}
            </p>

            <div className="mt-10 flex flex-col items-center gap-4">
              <Button size="lg" className="text-base px-8" onClick={() => setShowDesignChoices((prev) => !prev)}>
                {isDa ? "Start design" : "Start design"}
              </Button>

              {showDesignChoices && (
                <div className="grid w-full max-w-2xl grid-cols-1 sm:grid-cols-2 gap-3">
                  <Link
                    to="/tekstiltryk/produkter"
                    className="group rounded-2xl border border-border bg-background/90 p-4 text-left transition hover:border-primary/40 hover:bg-primary/5"
                  >
                    <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <img src={apparelButtonLogoSrc} alt="" className="h-5 w-5 object-contain" draggable={false} />
                    </div>
                    <div className="text-lg font-semibold">{isDa ? "Tøj" : "Apparel"}</div>
                    <p className="text-sm text-muted-foreground">
                      {isDa ? "T-shirts, hoodies og firmatøj" : "T-shirts, hoodies and workwear"}
                    </p>
                  </Link>
                  <Link
                    to="/storformatprint"
                    className="group rounded-2xl border border-border bg-background/90 p-4 text-left transition hover:border-primary/40 hover:bg-primary/5"
                  >
                    <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <img src={printButtonLogoSrc} alt="" className="h-5 w-5 object-contain" draggable={false} />
                    </div>
                    <div className="text-lg font-semibold">{isDa ? "Print" : "Print"}</div>
                    <p className="text-sm text-muted-foreground">
                      {isDa ? "Bannere, skilte og plakater" : "Banners, signs and posters"}
                    </p>
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Shirt,
                title: isDa ? "Tekstiltryk" : "Textile Printing",
                body: isDa
                  ? "T-shirts, hoodies, sweatshirts og firmatøj med professionel rådgivning om placering, farver og trykmetode."
                  : "T-shirts, hoodies, sweatshirts, and corporate wear with professional guidance on placement, colors, and print method.",
              },
              {
                icon: Printer,
                title: isDa ? "Storformatprint" : "Large Format Print",
                body: isDa
                  ? "Bannere, plakater, skilte og eventmaterialer i skarp kvalitet til butikker, messer og kampagner."
                  : "Banners, posters, signs, and event materials in sharp quality for stores, trade shows, and campaigns.",
              },
              {
                icon: Sparkles,
                title: isDa ? "Brandkvalitet" : "Brand Quality",
                body: isDa
                  ? "Vi arbejder med høj finish, præcise leverancer og løsninger, der styrker dit visuelle udtryk."
                  : "We deliver high finish, precise execution, and solutions that strengthen your visual identity.",
              },
            ].map((item) => (
              <motion.article key={item.title} {...fadeUp} className="rounded-2xl border border-border bg-card p-7 card-shadow">
                <item.icon size={28} className="text-primary mb-3" />
                <h2 className="text-xl font-bold mb-2">{item.title}</h2>
                <p className="text-muted-foreground">{item.body}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20 bg-muted/40">
        <div className="container mx-auto px-4 lg:px-8">
          <motion.div {...fadeUp} className="max-w-4xl">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {isDa ? "Et trykkeri med fokus på formål, kvalitet og autenticitet" : "A print studio built on purpose, quality, and authenticity"}
            </h2>
            <p className="text-muted-foreground text-lg">
              {isDa
                ? "Hos Trykeksperten kombinerer vi moderne produktion med personlig sparring. Vores mål er at gøre det nemt for dig at få produkter, der føles rigtige for dit brand, holder i brug, og fremstår professionelt."
                : "At Trykeksperten, we combine modern production with hands-on guidance. Our goal is to make it easy for you to get products that feel right for your brand, last in use, and look professional."}
            </p>
          </motion.div>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              isDa ? "Kvalitetskontrol i hele processen" : "Quality control throughout the process",
              isDa ? "Skalerbare løsninger fra små til store oplag" : "Scalable solutions from small to large production runs",
              isDa ? "Rådgivning om materialer, tryk og visuel effekt" : "Guidance on materials, print methods, and visual impact",
              isDa ? "Effektiv levering til virksomheder og events" : "Efficient delivery for companies and events",
            ].map((point) => (
              <motion.div key={point} {...fadeUp} className="rounded-xl border border-border bg-background p-4 flex items-center gap-3">
                <CheckCircle2 size={18} className="text-primary shrink-0" />
                <span className="text-sm md:text-base">{point}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4 lg:px-8">
          <motion.div {...fadeUp} className="max-w-4xl">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {isDa ? "Lokal forankring i København, levering i hele Danmark" : "Rooted in Copenhagen, delivering across Denmark"}
            </h2>
            <p className="text-muted-foreground text-lg">
              {isDa
                ? "Vi holder til i København og samarbejder med kunder i hele landet. Uanset om du har brug for profilbeklædning, merchandise eller storformatprint, får du en løsning, der matcher din branche, målgruppe og visuelle identitet."
                : "We are based in Copenhagen and support clients across Denmark. Whether you need branded apparel, merchandise, or large format print, you get a solution aligned with your industry, audience, and visual identity."}
            </p>
          </motion.div>
          <motion.div {...fadeUp} className="mt-6 inline-flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin size={16} />
            <span>{isDa ? "Raffinaderivej 10E, 2300 København S" : "Raffinaderivej 10E, 2300 Copenhagen S"}</span>
          </motion.div>
        </div>
      </section>

    </Layout>
  );
};

export default Index;
