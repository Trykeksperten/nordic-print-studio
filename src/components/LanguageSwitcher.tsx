import { useLanguage } from "@/i18n/LanguageContext";

const LanguageSwitcher = () => {
  const { lang, setLang } = useLanguage();

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => setLang("da")}
        className={`text-lg transition-opacity duration-200 hover:opacity-100 ${
          lang === "da" ? "opacity-100" : "opacity-50"
        }`}
        aria-label="Dansk"
        title="Dansk"
      >
        🇩🇰
      </button>
      <button
        onClick={() => setLang("en")}
        className={`text-lg transition-opacity duration-200 hover:opacity-100 ${
          lang === "en" ? "opacity-100" : "opacity-50"
        }`}
        aria-label="English"
        title="English"
      >
        🇬🇧
      </button>
    </div>
  );
};

export default LanguageSwitcher;
