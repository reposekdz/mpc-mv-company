import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const languages = [
  { code: "rw", label: "Ikinyarwanda", flag: "🇷🇼" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "en", label: "English", flag: "🇬🇧" },
] as const;

interface LanguageSwitcherProps {
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "icon";
  showLabel?: boolean;
  className?: string;
}

export function LanguageSwitcher({
  variant = "outline",
  size = "sm",
  showLabel = true,
  className = "",
}: LanguageSwitcherProps) {
  const { i18n } = useTranslation();

  const currentLang = languages.find((l) => l.code === i18n.language) || languages[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger key="lang-trigger" asChild>
        <Button variant={variant} size={size} className={`gap-2 ${className}`}>
          <Globe key="globe-icon" className="w-4 h-4" />
          {showLabel && (
            <span key="lang-label" className="hidden sm:inline">
              {currentLang.flag} {currentLang.label}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent key="lang-content" align="end" className="min-w-[180px]">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => i18n.changeLanguage(lang.code)}
            className={`gap-3 cursor-pointer ${
              i18n.language === lang.code ? "bg-steel/10 text-steel font-semibold" : ""
            }`}
          >
            <span className="text-lg">{lang.flag}</span>
            <span>{lang.label}</span>
            {i18n.language === lang.code && (
              <span className="ml-auto text-xs text-steel">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
