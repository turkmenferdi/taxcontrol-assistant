import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = "TRY"): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("tr-TR").format(new Date(date));
}

export function formatDateInput(date: Date | string): string {
  return new Date(date).toISOString().split("T")[0];
}

export function getQuarterDates(year: number, quarter: number) {
  const startMonth = (quarter - 1) * 3;
  const startDate = new Date(year, startMonth, 1);
  const endDate = new Date(year, startMonth + 3, 0);
  return { startDate, endDate };
}

export function getCurrentQuarter() {
  const now = new Date();
  const quarter = Math.floor(now.getMonth() / 3) + 1;
  return { year: now.getFullYear(), quarter };
}

export function classificationLabel(c: string): string {
  const map: Record<string, string> = {
    deductible: "İndirilebilir",
    non_deductible: "İndirilemez",
    partially_deductible: "Kısmen İndirilebilir",
    accountant_review_required: "Muhasebeci Onayı Gerekli",
  };
  return map[c] ?? c;
}

export function classificationColor(c: string): string {
  const map: Record<string, string> = {
    deductible: "green",
    non_deductible: "red",
    partially_deductible: "yellow",
    accountant_review_required: "orange",
  };
  return map[c] ?? "gray";
}
