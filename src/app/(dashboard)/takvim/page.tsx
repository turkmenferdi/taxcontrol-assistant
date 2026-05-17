"use client";

import { useLanguage } from "@/contexts/language-context";
import { Calendar, AlertCircle, CheckCircle2 } from "lucide-react";
import type { translations } from "@/lib/i18n";

type TranslationKey = keyof (typeof translations)["tr"];

interface Deadline {
  key: string;
  titleKey: TranslationKey;
  descKey: TranslationKey;
  day: number;
  month?: number; // fixed month (1-12), undefined = every month
  quarter?: number[]; // which months (1,4,7,10)
  type: "kdv" | "muhtasar" | "gecici" | "kurumlar" | "stopaj";
  color: string;
}

const DEADLINES: Deadline[] = [
  { key: "kdv-monthly", titleKey: "calKdvMonthlyTitle", descKey: "calKdvMonthlyDesc", day: 26, type: "kdv", color: "blue" },
  { key: "muhtasar", titleKey: "calMuhtasarTitle", descKey: "calMuhtasarDesc", day: 26, type: "muhtasar", color: "purple" },
  { key: "gecici-q1", titleKey: "calGeciciQ1Title", descKey: "calGeciciDesc", day: 17, month: 5, type: "gecici", color: "orange" },
  { key: "gecici-q2", titleKey: "calGeciciQ2Title", descKey: "calGeciciDesc", day: 17, month: 8, type: "gecici", color: "orange" },
  { key: "gecici-q3", titleKey: "calGeciciQ3Title", descKey: "calGeciciDesc", day: 17, month: 11, type: "gecici", color: "orange" },
  { key: "gecici-q4", titleKey: "calGeciciQ4Title", descKey: "calGeciciDesc", day: 17, month: 2, type: "gecici", color: "orange" },
  { key: "kurumlar", titleKey: "calKurumlarTitle", descKey: "calKurumlarDesc", day: 30, month: 4, type: "kurumlar", color: "red" },
];

const TYPE_LABELS: Record<string, string> = {
  kdv: "KDV",
  muhtasar: "Muhtasar",
  gecici: "Geçici Vergi",
  kurumlar: "Kurumlar",
  stopaj: "Stopaj",
};

const COLOR_CLASSES: Record<string, { bg: string; text: string; border: string; badge: string }> = {
  blue: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", badge: "bg-blue-100 text-blue-700" },
  purple: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", badge: "bg-purple-100 text-purple-700" },
  orange: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", badge: "bg-orange-100 text-orange-700" },
  red: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", badge: "bg-red-100 text-red-700" },
  green: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200", badge: "bg-green-100 text-green-700" },
  gray: { bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-200", badge: "bg-gray-100 text-gray-600" },
};

function getNextDeadlines() {
  const now = new Date();
  const upcoming: Array<{ key: string; deadline: Deadline; date: Date; daysLeft: number }> = [];

  for (const dl of DEADLINES) {
    if (dl.month) {
      // Fixed annual deadline
      const year = now.getMonth() + 1 > dl.month || (now.getMonth() + 1 === dl.month && now.getDate() > dl.day)
        ? now.getFullYear() + 1
        : now.getFullYear();
      const date = new Date(year, dl.month - 1, dl.day);
      const daysLeft = Math.ceil((date.getTime() - now.getTime()) / 86400000);
      upcoming.push({ key: dl.key, deadline: dl, date, daysLeft });
    } else {
      // Monthly: next 3 months
      for (let i = 0; i < 3; i++) {
        const m = new Date(now.getFullYear(), now.getMonth() + i, 1);
        const date = new Date(m.getFullYear(), m.getMonth(), dl.day);
        if (date > now) {
          const daysLeft = Math.ceil((date.getTime() - now.getTime()) / 86400000);
          upcoming.push({ key: `${dl.key}-${m.getMonth()}`, deadline: dl, date, daysLeft });
          break;
        }
      }
    }
  }

  return upcoming.sort((a, b) => a.date.getTime() - b.date.getTime());
}

export default function TakvimPage() {
  const { t } = useLanguage();
  const upcoming = getNextDeadlines();

  const urgent = upcoming.filter((d) => d.daysLeft <= 7);
  const normal = upcoming.filter((d) => d.daysLeft > 7);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-800">{t.calendarTitle}</h1>
        <p className="text-sm text-gray-500 mt-1">{t.calendarDesc}</p>
      </div>

      {urgent.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <span className="text-sm font-semibold text-red-600">{t.calUrgent} ({urgent.length})</span>
          </div>
          <div className="space-y-2">
            {urgent.map((item) => {
              const c = COLOR_CLASSES[item.deadline.color] ?? COLOR_CLASSES.gray;
              return (
                <div key={item.key} className={`rounded-xl border ${c.border} ${c.bg} p-4 flex items-center justify-between`}>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${c.badge}`}>
                        {TYPE_LABELS[item.deadline.type]}
                      </span>
                      <span className={`text-sm font-semibold ${c.text}`}>{t[item.deadline.titleKey] as string}</span>
                    </div>
                    <p className="text-xs text-gray-500">{t[item.deadline.descKey] as string}</p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-xs text-gray-400">{item.date.toLocaleDateString("tr-TR")}</p>
                    <p className="text-sm font-bold text-red-600">{item.daysLeft} {t.calDaysLeft}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-semibold text-gray-600">{t.calUpcoming}</span>
        </div>
        <div className="space-y-2">
          {normal.map((item) => {
            const c = COLOR_CLASSES[item.deadline.color] ?? COLOR_CLASSES.gray;
            const isPast = item.daysLeft <= 0;
            return (
              <div key={item.key} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between shadow-sm">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${c.badge}`}>
                      {TYPE_LABELS[item.deadline.type]}
                    </span>
                    <span className="text-sm font-semibold text-gray-700">{t[item.deadline.titleKey] as string}</span>
                  </div>
                  <p className="text-xs text-gray-400">{t[item.deadline.descKey] as string}</p>
                </div>
                <div className="text-right ml-4">
                  <p className="text-xs text-gray-400">{item.date.toLocaleDateString("tr-TR")}</p>
                  {isPast ? (
                    <span className="flex items-center gap-1 text-xs text-green-600">
                      <CheckCircle2 className="w-3 h-3" /> {t.calCompleted}
                    </span>
                  ) : (
                    <p className={`text-sm font-bold ${item.daysLeft <= 14 ? "text-orange-500" : "text-gray-500"}`}>
                      {item.daysLeft} {t.calDaysLeft}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
        <p className="text-xs font-semibold text-gray-500 mb-2">{t.calLegend}</p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(TYPE_LABELS).map(([type, label]) => {
            const dl = DEADLINES.find((d) => d.type === type);
            const c = dl ? (COLOR_CLASSES[dl.color] ?? COLOR_CLASSES.gray) : COLOR_CLASSES.gray;
            return (
              <span key={type} className={`text-xs px-2 py-1 rounded-full ${c.badge}`}>{label}</span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
