import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import i18n from "@/i18n"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format currency in Rwandan Francs
export function formatCurrency(amount: number): string {
  const language = i18n.language || 'rw'
  
  // Format based on language
  const formatMap: Record<string, Intl.NumberFormatOptions> = {
    rw: { style: 'currency', currency: 'RWF', maximumFractionDigits: 0 },
    en: { style: 'currency', currency: 'RWF', maximumFractionDigits: 0 },
    fr: { style: 'currency', currency: 'RWF', maximumFractionDigits: 0 }
  }

  return new Intl.NumberFormat(language === 'fr' ? 'fr-RW' : 'en-RW', formatMap[language] || formatMap.rw).format(amount)
}

// Format large numbers with appropriate suffix
export function formatNumber(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`
  }
  return value.toLocaleString()
}
