"use client";

import { useState, useEffect, useCallback } from "react";
import { formatCurrency, formatDate } from "@/lib/utils";
import ClassificationBadge from "./ClassificationBadge";
import { ChevronLeft, ChevronRight, Search, CheckSquare, Square, CheckCheck, X, Calendar } from "lucide-react";
import ReviewModal from "./ReviewModal";
import { useLanguage } from "@/contexts/language-context";

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
  companyId?: string;
  bulkMode?: boolean;
}

const BULK_ACTIONS = [
  { key: "deductible", label: "✅ İndirilebilir", color: "bg-green-600 hover:bg-green-700 text-white" },
  { key: "non_deductible", label: "❌ İndirilemez", color: "bg-red-600 hover:bg-red-700 text-white" },
  { key: "needs_review", label: "🔍 İnceleme", color: "bg-yellow-500 hover:bg-yellow-600 text-white" },
];

export default function InvoiceTable({ direction, riskyOnly, reviewOnly, companyId, bulkMode }: Props) {
  const { t } = useLanguage();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Invoice | null>(null);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkNote, setBulkNote] = useState("");
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const title = riskyOnly ? t.riskyTitle : reviewOnly ? t.reviewTitle
    : direction === "outgoing" ? t.outgoingTitle : t.incomingTitle;

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (direction) params.set("direction", direction);
    if (companyId) params.set("companyId", companyId);
    if (dateFrom) params.set("startDate", dateFrom);
    if (dateTo) params.set("endDate", dateTo);
    const res = await fetch(`/api/invoices?${params}`);
    if (res.ok) {
      const data = await res.json();
      let filtered: Invoice[] = data.invoices;
      if (riskyOnly) filtered = filtered.filter(i => {
        const c = i.classification?.accountantFinalDecision ?? i.classification?.classification;
        return c === "non_deductible" || c === "partially_deductible";
      });
      if (reviewOnly) filtered = filtered.filter(i => {
        const c = i.classification?.classification;
        const d = i.classification?.accountantFinalDecision;
        return c === "accountant_review_required" && !d;
      });
      setInvoices(filtered);
      setTotal(riskyOnly || reviewOnly ? filtered.length : data.total);
    }
    setLoading(false);
    setChecked(new Set());
  }, [page, direction, riskyOnly, reviewOnly, companyId, dateFrom, dateTo]);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

  const filtered = invoices.filter(i =>
    !search ||
    i.supplierName?.toLowerCase().includes(search.toLowerCase()) ||
    i.customerName?.toLowerCase().includes(search.toLowerCase()) ||
    i.invoiceNumber?.toLowerCase().includes(search.toLowerCase())
  );

  const allChecked = filtered.length > 0 && filtered.every(i => checked.has(i.id));

  function toggleAll() {
    if (allChecked) setChecked(new Set());
    else setChecked(new Set(filtered.map(i => i.id)));
  }

  function toggleOne(id: string) {
    setChecked(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function startBulkAction(action: string) {
    setPendingAction(action);
    setShowNoteInput(true);
  }

  async function applyBulkAction() {
    if (!pendingAction || checked.size === 0) return;
    setBulkLoading(true);
    await fetch("/api/invoices/bulk-classify", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invoiceIds: Array.from(checked), decision: pendingAction, note: bulkNote || undefined }),
    });
    setBulkLoading(false);
    setShowNoteInput(false);
    setPendingAction(null);
    setBulkNote("");
    setChecked(new Set());
    fetchInvoices();
  }

  const totalPages = Math.ceil(total / 20);

  return (
    <div>
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h1 className="text-xl font-bold text-gray-900">{title}</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
              className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-gray-400">—</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
              className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {(dateFrom || dateTo) && (
              <button onClick={() => { setDateFrom(""); setDateTo(""); setPage(1); }} className="text-gray-400 hover:text-gray-600 ml-1">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={t.search}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
            />
          </div>
        </div>
      </div>

      {/* Bulk action bar */}
      {bulkMode && checked.size > 0 && !showNoteInput && (
        <div className="flex items-center gap-2 mb-3 p-3 bg-blue-50 border border-blue-200 rounded-xl flex-wrap">
          <span className="text-sm font-medium text-blue-700 mr-1">
            <CheckCheck className="w-4 h-4 inline mr-1" />{checked.size} seçili
          </span>
          {BULK_ACTIONS.map(a => (
            <button key={a.key} onClick={() => startBulkAction(a.key)}
              className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${a.color}`}>
              {a.label}
            </button>
          ))}
          <button onClick={() => setChecked(new Set())}
            className="ml-auto text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Bulk note input */}
      {showNoteInput && (
        <div className="mb-3 p-3 bg-gray-50 border border-gray-200 rounded-xl">
          <p className="text-xs text-gray-500 mb-2">
            {checked.size} fatura için <strong>{BULK_ACTIONS.find(a => a.key === pendingAction)?.label}</strong> uygulanacak. İsteğe bağlı not:
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={bulkNote}
              onChange={e => setBulkNote(e.target.value)}
              placeholder="Muhasebeci notu (isteğe bağlı)"
              className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button onClick={applyBulkAction} disabled={bulkLoading}
              className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              {bulkLoading ? "..." : "Uygula"}
            </button>
            <button onClick={() => { setShowNoteInput(false); setPendingAction(null); }}
              className="text-gray-400 hover:text-gray-600 px-2">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {bulkMode && (
                  <th className="pl-4 py-3 w-8">
                    <button onClick={toggleAll} className="text-gray-400 hover:text-blue-600 transition-colors">
                      {allChecked ? <CheckSquare className="w-4 h-4 text-blue-600" /> : <Square className="w-4 h-4" />}
                    </button>
                  </th>
                )}
                <th className="text-left px-4 py-3 font-medium text-gray-500">{t.date}</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">{t.invoiceNo}</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">
                  {direction === "outgoing" ? t.customer : t.supplier}
                </th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">{t.netAmount}</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">{t.vat}</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">{t.grossAmount}</th>
                {direction !== "outgoing" && (
                  <th className="text-left px-4 py-3 font-medium text-gray-500">{t.classification}</th>
                )}
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={9} className="text-center py-12 text-gray-400">
                  <div className="flex justify-center"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" /></div>
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-12 text-gray-400">{t.noInvoices}</td></tr>
              ) : filtered.map((inv) => (
                <tr key={inv.id} className={`hover:bg-gray-50 transition-colors ${checked.has(inv.id) ? "bg-blue-50" : ""}`}>
                  {bulkMode && (
                    <td className="pl-4 py-3">
                      <button onClick={() => toggleOne(inv.id)} className="text-gray-400 hover:text-blue-600 transition-colors">
                        {checked.has(inv.id) ? <CheckSquare className="w-4 h-4 text-blue-600" /> : <Square className="w-4 h-4" />}
                      </button>
                    </td>
                  )}
                  <td className="px-4 py-3 text-gray-600">{formatDate(inv.invoiceDate)}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-700">{inv.invoiceNumber ?? "-"}</td>
                  <td className="px-4 py-3 text-gray-900 max-w-[180px] truncate">
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
                      <button onClick={() => setSelected(inv)} className="text-xs text-blue-600 hover:underline">
                        {t.review}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <p className="text-sm text-gray-500">{t.totalInvoices(total)}</p>
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
