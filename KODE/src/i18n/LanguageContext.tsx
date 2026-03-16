import React, { createContext, useContext, useState, useCallback } from "react";
import { Language, translations } from "./translations";

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (path: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLang] = useState<Language>("da");

  const t = useCallback(
    (path: string): string => {
      const keys = path.split(".");
      let current: any = translations;
      for (const key of keys) {
        if (current[key] === undefined) return path;
        current = current[key];
      }
      if (typeof current === "object" && current[lang] !== undefined) {
        return current[lang];
      }
      if (typeof current === "string") return current;
      return path;
    },
    [lang]
  );

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
};
