"use client";

import { useState, useEffect, useCallback } from "react";
import { formatCurrency, formatDate } from "@/lib/utils";
import ClassificationBadge from "./ClassificationBadge";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import ReviewModal from "./ReviewModal";

interface Invoice {
  id: string;
  invoiceNumber?: string;
  invoiceDate: string;
  invoiceDirection: string;
  supplierName?: string;
  customerName?: string;
  netAmount: number;
  vatAmount: number;
  grossAmount: number;
  currency: string;
  classification?: {
    classification: string;
    accountantFinalDecision?: string;
    reason?: string;
    category?: string;
    accountantNote?: string;
  } | null;
}

interface Props {
  direction?: string;
  riskyOnly?: boolean;
  reviewOnly?: boolean;
  title: string;
}

export default function InvoiceTable({ direction, riskyOnly, reviewOnly, title }: Props) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Invoice | null>(null);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (direction) params.set("direction", direction);
    const res = await fetch(`/api/invoices?${params}`);
    if (res.ok) {
      const data = await res.json();
      let filtered: Invoice[] = data.invoices;
      if (riskyOnly) {
        filtered = filtered.filter((i) => {
          const c = i.classification?.accountantFinalDecision ?? i.classification?.classification;
          return c === "non_deductible" || c === "partially_deductible";
        });
      }
      if (reviewOnly) {
        filtered = filtered.filter((i) => {
          const c = i.classification?.classification;
          const d = i.classification?.accountantFinalDecision;
          return c === "accountant_review_required" && !d;
        });
      }
      setInvoices(filtered);
      setTotal(riskyOnly || reviewOnly ? filtered.length : data.total);
    }
    setLoading(false);
  }, [page, direction, riskyOnly, reviewOnly]);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

  const filtered = invoices.filter((i) =>
    !search ||
    i.supplierName?.toLowerCase().includes(search.toLowerCase()) ||
    i.customerName?.toLowerCase().includes(search.toLowerCase()) ||
    i.invoiceNumber?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(total / 20);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-medium text-gray-500">Tarih</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Fatura No</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">
                  {direction === "outgoing" ? "Müşteri" : "Tedarikçi"}
                </th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Net Tutar</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">KDV</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Brüt Tutar</th>
                {direction !== "outgoing" && (
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Sınıflandırma</th>
                )}
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-400">
                    <div className="flex justify-center"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" /></div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-400">Fatura bulunamadı.</td>
                </tr>
              ) : (
                filtered.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-600">{formatDate(inv.invoiceDate)}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-700">{inv.invoiceNumber ?? "-"}</td>
                    <td className="px-4 py-3 text-gray-900 max-w-[200px] truncate">
                      {inv.invoiceDirection === "outgoing" ? inv.customerName : inv.supplierName}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">{formatCurrency(inv.netAmount)}</td>
                    <td className="px-4 py-3 text-right text-gray-500">{formatCurrency(inv.vatAmount)}</td>
                    <td className="px-4 py-3 text-right font-semibold">{formatCurrency(inv.grossAmount)}</td>
                    {direction !== "outgoing" && (
                      <td className="px-4 py-3">
                        <ClassificationBadge
                          classification={inv.classification?.classification}
                          accountantFinalDecision={inv.classification?.accountantFinalDecision}
                        />
                      </td>
                    )}
                    <td className="px-4 py-3">
                      {inv.invoiceDirection === "incoming" && (
                        <button
                          onClick={() => setSelected(inv)}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          İncele
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <p className="text-sm text-gray-500">Toplam {total} fatura</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1 rounded hover:bg-gray-100 disabled:opacity-40">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm">{page} / {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1 rounded hover:bg-gray-100 disabled:opacity-40">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {selected && (
        <ReviewModal
          invoice={selected}
          onClose={() => setSelected(null)}
          onSaved={() => { setSelected(null); fetchInvoices(); }}
        />
      )}
    </div>
  );
}
