"use client";

import { useEffect, useState } from "react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";

interface VatData {
  summary: {
    outgoingNetTotal: number;
    outgoingVatTotal: number;
    incomingNetTotal: number;
    deductibleVatTotal: number;
    nonDeductibleVatTotal: number;
    estimatedPayableVat: number;
    estimatedCarryForwardVat: number;
  };
  startDate: string;
  endDate: string;
}

export default function KdvOzetiPage() {
  const { t } = useLanguage();
  const [data, setData] = useState<VatData | null>(null);
  const [loading, setLoading] = useState(true);
  const now = new Date();
  const [month, setMonth] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);

  useEffect(() => {
    const [year, m] = month.split("-").map(Number);
    const start = new Date(year, m - 1, 1).toISOString();
    const end = new Date(year, m, 0).toISOString();
    setLoading(true);
    fetch(`/api/tax/vat?startDate=${start}&endDate=${end}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [month]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t.vatTitle}</h1>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
        {t.vatWarning}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
      ) : !data ? (
        <p className="text-gray-500">{t.vatNoData}</p>
      ) : (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h2 className="font-semibold text-gray-700">
                {t.vatPeriod(formatDate(data.startDate), formatDate(data.endDate))}
              </h2>
            </div>
            <div className="p-6 space-y-3">
              <Row label={t.vatSalesBase} value={formatCurrency(data.summary.outgoingNetTotal)} />
              <Row label={t.vatCalculated} value={formatCurrency(data.summary.outgoingVatTotal)} highlight="blue" />
              <div className="border-t pt-3">
                <Row label={t.vatPurchaseBase} value={formatCurrency(data.summary.incomingNetTotal)} />
                <Row label={t.vatDeductible} value={formatCurrency(data.summary.deductibleVatTotal)} highlight="green" />
                <Row label={t.vatNonDeductible} value={formatCurrency(data.summary.nonDeductibleVatTotal)} highlight="red" />
              </div>
              <div className="border-t border-gray-300 pt-3 mt-2">
                {data.summary.estimatedPayableVat > 0 ? (
                  <Row label={t.vatPayable} value={formatCurrency(data.summary.estimatedPayableVat)} highlight="red" bold />
                ) : (
                  <Row label={t.vatCarryForward} value={formatCurrency(data.summary.estimatedCarryForwardVat)} highlight="green" bold />
                )}
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
            <strong>{t.vatFormula}</strong>
            <br />
            {t.vatNote}
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
