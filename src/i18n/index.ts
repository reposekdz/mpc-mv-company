import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { rw } from "./locales/rw";
import { fr } from "./locales/fr";
import { en } from "./locales/en";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      rw: { translation: rw },
      fr: { translation: fr },
      en: { translation: en },
    },
    fallbackLng: "rw",
    lng: "rw",
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
    },
  });

export default i18n;
