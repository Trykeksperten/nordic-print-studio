import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";
import { motion } from "framer-motion";
import Layout from "@/components/Layout";
import { Mail, Phone, MapPin, Upload, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

const ease = [0.32, 0.72, 0, 1] as const;
const fadeUp = {
  initial: { opacity: 0, y: 12 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5, ease },
};

const Kontakt = () => {
  const { t, lang } = useLanguage();
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    toast.success(t("contactPage.success"));
  };

  return (
    <Layout>
      <section className="py-24 bg-gradient-to-br from-accent/50 to-background">
        <div className="container mx-auto px-4 lg:px-8">
          <motion.div className="max-w-2xl" {...fadeUp}>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{t("contactPage.title")}</h1>
            <p className="text-lg text-muted-foreground">{t("contactPage.subtitle")}</p>
          </motion.div>
        </div>
      </section>

      <section className="py-24">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Form */}
            <motion.div {...fadeUp}>
              {submitted ? (
                <div className="text-center py-12">
                  <CheckCircle2 size={48} className="text-primary mx-auto mb-4" />
                  <p className="text-lg font-medium">{t("contactPage.success")}</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">{t("contactPage.name")}</label>
                    <input required type="text" className="w-full h-11 bg-card rounded-lg px-3 text-sm ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2 outline-none card-shadow" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">{t("contactPage.email")}</label>
                    <input required type="email" className="w-full h-11 bg-card rounded-lg px-3 text-sm ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2 outline-none card-shadow" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">{t("contactPage.phone")}</label>
                    <input type="tel" className="w-full h-11 bg-card rounded-lg px-3 text-sm ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2 outline-none card-shadow" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">{t("contactPage.message")}</label>
                    <textarea required rows={5} className="w-full bg-card rounded-lg px-3 py-2 text-sm ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2 outline-none resize-none card-shadow" />
                  </div>
                  <Button type="submit" variant="hero" size="lg" className="w-full">
                    {t("contactPage.send")}
                  </Button>
                </form>
              )}
            </motion.div>

            {/* Contact info */}
            <motion.div {...fadeUp} transition={{ delay: 0.1 }}>
              <div className="bg-card rounded-2xl p-8 card-shadow mb-8">
                <h3 className="text-xl font-bold mb-6">{t("contactPage.info")}</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <MapPin size={20} className="text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium">Trykeksperten ApS</p>
                      <p className="text-muted-foreground text-sm">Raffinaderivej 10E</p>
                      <p className="text-muted-foreground text-sm">2300 København S</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone size={20} className="text-primary shrink-0" />
                    <span className="text-sm">+45 27822277</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail size={20} className="text-primary shrink-0" />
                    <span className="text-sm">kontakt@trykeksperten.dk</span>
                  </div>
                </div>
              </div>

              <Link to="/design">
                <Button variant="default" size="lg" className="w-full">
                  <Upload size={18} />
                  {lang === "da" ? "Upload dit design" : "Upload Your Design"}
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Kontakt;
