"use client";

import { useState } from "react";
import { FileSpreadsheet, FileText, Download } from "lucide-react";

export default function RaporlarPage() {
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [year, setYear] = useState(new Date().getFullYear());
  const [quarter, setQuarter] = useState(Math.floor(new Date().getMonth() / 3) + 1);
  const [downloading, setDownloading] = useState<string | null>(null);

  async function download(type: string, params: Record<string, string>) {
    setDownloading(type);
    const qs = new URLSearchParams(params).toString();
    const res = await fetch(`/api/reports/${type}?${qs}`);
    if (res.ok) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = res.headers.get("content-disposition")?.split("filename=")[1] ?? `${type}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    }
    setDownloading(null);
  }

  const [y, m] = month.split("-");

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Raporlar</h1>

      <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
        Bu raporlar tahmini ön-kontrol raporlarıdır. Kesin vergi muamelesi ve beyan sorumluluğu mükellef ve sertifikalı muhasebeciye aittir.
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <ReportCard
          title="Gelen Fatura Listesi"
          description="Seçili aya ait tüm gelen faturalar ve sınıflandırmaları"
          icon={FileSpreadsheet}
          color="blue"
          controls={
            <input type="month" value={month} onChange={(e) => setMonth(e.target.value)}
              className="border border-gray-200 rounded px-2 py-1 text-sm" />
          }
          onDownload={() => download("invoices", { direction: "incoming", month: `${y}-${m}` })}
          loading={downloading === "invoices-incoming"}
        />

        <ReportCard
          title="Giden Fatura Listesi"
          description="Seçili aya ait tüm giden faturalar"
          icon={FileSpreadsheet}
          color="purple"
          controls={
            <input type="month" value={month} onChange={(e) => setMonth(e.target.value)}
              className="border border-gray-200 rounded px-2 py-1 text-sm" />
          }
          onDownload={() => download("invoices", { direction: "outgoing", month: `${y}-${m}` })}
          loading={downloading === "invoices-outgoing"}
        />

        <ReportCard
          title="Aylık KDV Özeti"
          description="Hesaplanan KDV, İndirilecek KDV ve Ödenecek KDV tahmini"
          icon={FileSpreadsheet}
          color="green"
          controls={
            <input type="month" value={month} onChange={(e) => setMonth(e.target.value)}
              className="border border-gray-200 rounded px-2 py-1 text-sm" />
          }
          onDownload={() => download("vat-summary", { month: `${y}-${m}` })}
          loading={downloading === "vat-summary"}
        />

        <ReportCard
          title="Geçici Vergi Tahmini"
          description="Çeyreklik ciro, gider ve tahmini geçici vergi raporu"
          icon={FileText}
          color="orange"
          controls={
            <div className="flex gap-2">
              <select value={year} onChange={(e) => setYear(Number(e.target.value))}
                className="border border-gray-200 rounded px-2 py-1 text-sm">
                {[2024, 2025, 2026].map(y => <option key={y}>{y}</option>)}
              </select>
              <select value={quarter} onChange={(e) => setQuarter(Number(e.target.value))}
                className="border border-gray-200 rounded px-2 py-1 text-sm">
                {[1, 2, 3, 4].map(q => <option key={q} value={q}>{q}. Çeyrek</option>)}
              </select>
            </div>
          }
          onDownload={() => download("provisional-tax", { year: String(year), quarter: String(quarter) })}
          loading={downloading === "provisional-tax"}
        />
      </div>
    </div>
  );
}

function ReportCard({ title, description, icon: Icon, color, controls, onDownload, loading }: {
  title: string; description: string; icon: typeof FileSpreadsheet;
  color: string; controls: React.ReactNode; onDownload: () => void; loading: boolean;
}) {
  const colorMap: Record<string, string> = {
    blue: "bg-blue-100 text-blue-600", purple: "bg-purple-100 text-purple-600",
    green: "bg-green-100 text-green-600", orange: "bg-orange-100 text-orange-600",
  };
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-start gap-4">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${colorMap[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-500 mt-0.5">{description}</p>
          <div className="mt-3">{controls}</div>
          <button onClick={onDownload} disabled={loading}
            className="mt-3 flex items-center gap-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60">
            <Download className="w-4 h-4" />
            {loading ? "İndiriliyor..." : "Excel İndir"}
          </button>
        </div>
      </div>
    </div>
  );
}
