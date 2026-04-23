import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { rw } from "./locales/rw";
import { fr } from "./locales/fr";
import { en } from "./locales/en";

// Check if we're in browser environment
const isBrowser = typeof window !== 'undefined';

i18n
  .use(isBrowser ? LanguageDetector : undefined)
  .use(initReactI18next)
  .init({
    resources: {
      rw: { translation: rw },
      fr: { translation: fr },
      en: { translation: en },
    },
    fallbackLng: "rw",
    lng: isBrowser ? undefined : "rw", // Let detector handle it in browser
    interpolation: {
      escapeValue: false,
    },
    detection: isBrowser ? {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
    } : undefined,
  });

export default i18n;
