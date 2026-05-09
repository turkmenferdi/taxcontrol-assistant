"use client";

import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/utils";

interface ProvisionalData {
  summary: {
    revenue: number;
    deductibleExpenses: number;
    estimatedProfit: number;
    taxRate: number;
    estimatedProvisionalTax: number;
  };
  year: number;
  quarter: number;
}

export default function GeciciVergiPage() {
  const [data, setData] = useState<ProvisionalData | null>(null);
  const [loading, setLoading] = useState(true);
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [quarter, setQuarter] = useState(Math.floor(now.getMonth() / 3) + 1);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/tax/provisional?year=${year}&quarter=${quarter}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [year, quarter]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Geçici Vergi Tahmini</h1>
        <div className="flex items-center gap-3">
          <select value={year} onChange={(e) => setYear(Number(e.target.value))}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            {[2024, 2025, 2026].map(y => <option key={y}>{y}</option>)}
          </select>
          <select value={quarter} onChange={(e) => setQuarter(Number(e.target.value))}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            {[1, 2, 3, 4].map(q => <option key={q} value={q}>{q}. Çeyrek</option>)}
          </select>
        </div>
      </div>

      <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
        ⚠️ Bu hesaplama tahmini bir ön kontrol aracıdır. Kesin geçici vergi beyanı ve yasal sorumluluk muhatap ve sertifikalı muhasebeciye aittir.
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
      ) : !data ? (
        <p className="text-gray-500">Veri bulunamadı.</p>
      ) : (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h2 className="font-semibold text-gray-700">
                {data.year} Yılı {data.quarter}. Çeyrek Geçici Vergi Tahmini
              </h2>
            </div>
            <div className="p-6 space-y-3">
              <Row label="Toplam Ciro (Satış Hasılatı)" value={formatCurrency(data.summary.revenue)} />
              <Row label="İndirilebilir Giderler" value={`- ${formatCurrency(data.summary.deductibleExpenses)}`} highlight="green" />
              <div className="border-t pt-3">
                <Row label="Tahmini Kâr (Matrah)" value={formatCurrency(data.summary.estimatedProfit)} highlight="blue" bold />
              </div>
              <div className="border-t pt-3">
                <Row label={`Geçici Vergi Oranı`} value={`%${(data.summary.taxRate * 100).toFixed(0)}`} />
                <Row label="Tahmini Geçici Vergi" value={formatCurrency(data.summary.estimatedProvisionalTax)} highlight="red" bold />
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
            <strong>Formül:</strong> Geçici Vergi = (Toplam Satış − İndirilebilir Giderler) × Vergi Oranı
            <br />
            Muhasebeci onayı bekleyen giderler bu hesaba dahil edilmemiştir. Vergi oranı şirket tipine ve yıla göre Ayarlar'dan güncellenebilir.
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, highlight, bold }: { label: string; value: string; highlight?: "blue" | "green" | "red"; bold?: boolean }) {
  const valueColor = highlight === "blue" ? "text-blue-700" : highlight === "green" ? "text-green-700" : highlight === "red" ? "text-red-700" : "text-gray-900";
  return (
    <div className={`flex justify-between items-center py-1.5 ${bold ? "font-bold text-base" : "text-sm"}`}>
      <span className="text-gray-600">{label}</span>
      <span className={valueColor}>{value}</span>
    </div>
  );
}
