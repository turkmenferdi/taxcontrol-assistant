"use client";

import { useState, useEffect, useCallback } from "react";
import { formatCurrency, formatDate, classificationLabel } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";
import ClassificationBadge from "@/components/invoices/ClassificationBadge";
import { CheckCircle, XCircle, X, Filter } from "lucide-react";

interface PendingInvoice {
  id: string;
  invoiceNumber?: string;
  invoiceDate: string;
  supplierName?: string;
  netAmount: number;
  vatAmount: number;
  grossAmount: number;
  companyId: string;
  companyName: string;
  classification?: {
    classification: string;
    accountantFinalDecision?: string | null;
    reason?: string;
    category?: string;
    accountantNote?: string | null;
  } | null;
}

export default function TopluIncelemePage() {
  const { t } = useLanguage();
  const [tab, setTab] = useState<"review" | "risky">("review");
  const [invoices, setInvoices] = useState<PendingInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [applying, setApplying] = useState(false);
  const [msg, setMsg] = useState("");
  const [filterCompany, setFilterCompany] = useState("");
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    setSelected(new Set());
    setMsg("");
    const res = await fetch(`/api/accountant/all-pending?type=${tab}`);
    if (res.ok) {
      const data = await res.json();
      setInvoices(data.invoices ?? []);
    }
    setLoading(false);
  }, [tab]);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

  const companies = Array.from(
    new Map(invoices.map((inv) => [inv.companyId, inv.companyName])).entries()
  );

  const filtered = filterCompany
    ? invoices.filter((inv) => inv.companyId === filterCompany)
    : invoices;

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === filtered.length && filtered.length > 0) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((inv) => inv.id)));
    }
  }

  async function applyBulk(decision: string) {
    if (selected.size === 0) return;
    setApplying(true);
    const res = await fetch("/api/accountant/bulk-decision", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invoiceIds: Array.from(selected), decision }),
    });
    const data = await res.json();
    if (res.ok) {
      setMsg(t.bulkApplyOk(data.updated));
      fetchInvoices();
    }
    setApplying(false);
  }

  const reviewing = reviewingId ? invoices.find((inv) => inv.id === reviewingId) ?? null : null;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t.bulkReviewTitle}</h1>
        <p className="text-sm text-gray-500 mt-1">{t.bulkReviewDesc}</p>
      </div>

      {/* Tab selector */}
      <div className="flex gap-2 mb-5">
        <button
          onClick={() => setTab("review")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === "review"
              ? "bg-yellow-100 text-yellow-800 border border-yellow-300"
              : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
          }`}
        >
          {t.bulkReviewTabReview}
        </button>
        <button
          onClick={() => setTab("risky")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === "risky"
              ? "bg-red-100 text-red-800 border border-red-300"
              : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
          }`}
        >
          {t.bulkReviewTabRisky}
        </button>
      </div>

      {/* Company filter */}
      {companies.length > 1 && (
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <select
            value={filterCompany}
            onChange={(e) => {
              setFilterCompany(e.target.value);
              setSelected(new Set());
            }}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">{t.bulkAllCompanies(invoices.length)}</option>
            {companies.map(([id, name]) => (
              <option key={id} value={id}>
                {name} ({invoices.filter((inv) => inv.companyId === id).length})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <span className="text-sm font-medium text-blue-800 flex-1">
            {t.bulkActionBar(selected.size)}
          </span>
          <button
            onClick={() => applyBulk("deductible")}
            disabled={applying}
            className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            {t.bulkApproveDeductible}
          </button>
          <button
            onClick={() => applyBulk("non_deductible")}
            disabled={applying}
            className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60"
          >
            <XCircle className="w-3.5 h-3.5" />
            {t.bulkMarkNonDeductible}
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {msg && (
        <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 text-sm text-green-700">
          {msg}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-400 text-sm">{t.bulkReviewEmpty}</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.size === filtered.length && filtered.length > 0}
                      onChange={toggleAll}
                      className="rounded"
                    />
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 whitespace-nowrap">
                    {t.bulkReviewCompany}
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 whitespace-nowrap">
                    {t.date}
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 whitespace-nowrap">
                    {t.supplier}
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600 whitespace-nowrap">
                    {t.netAmount}
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600 whitespace-nowrap">
                    {t.grossAmount}
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 whitespace-nowrap">
                    {t.classification}
                  </th>
                  <th className="w-20 px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((inv) => (
                  <tr
                    key={inv.id}
                    className={`hover:bg-gray-50 transition-colors ${
                      selected.has(inv.id) ? "bg-blue-50 hover:bg-blue-50" : ""
                    }`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.has(inv.id)}
                        onChange={() => toggleSelect(inv.id)}
                        className="rounded"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-900 whitespace-nowrap">
                        {inv.companyName}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {formatDate(inv.invoiceDate)}
                    </td>
                    <td className="px-4 py-3 text-gray-700 max-w-[180px]">
                      <span className="block truncate">{inv.supplierName ?? "-"}</span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900 whitespace-nowrap">
                      {formatCurrency(inv.netAmount)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600 whitespace-nowrap">
                      {formatCurrency(inv.grossAmount)}
                    </td>
                    <td className="px-4 py-3">
                      <ClassificationBadge
                        classification={inv.classification?.classification}
                        accountantFinalDecision={inv.classification?.accountantFinalDecision}
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setReviewingId(inv.id)}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium whitespace-nowrap"
                      >
                        {t.review}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
            {t.totalInvoices(filtered.length)}
          </div>
        </div>
      )}

      {reviewing && (
        <ReviewModal
          invoice={reviewing}
          onClose={() => setReviewingId(null)}
          onSaved={() => {
            setReviewingId(null);
            fetchInvoices();
          }}
        />
      )}
    </div>
  );
}

function ReviewModal({
  invoice,
  onClose,
  onSaved,
}: {
  invoice: PendingInvoice;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useLanguage();
  const [decision, setDecision] = useState(
    invoice.classification?.accountantFinalDecision ?? ""
  );
  const [note, setNote] = useState(invoice.classification?.accountantNote ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await fetch(`/api/accountant/invoice/${invoice.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accountantFinalDecision: decision || null,
        accountantNote: note,
      }),
    });
    setSaving(false);
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between p-5 border-b">
          <div>
            <h2 className="font-semibold text-gray-900">{t.invoiceDetail}</h2>
            <p className="text-xs text-gray-500 mt-0.5">{invoice.companyName}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-gray-500">{t.supplier}</p>
              <p className="font-medium">{invoice.supplierName ?? "-"}</p>
            </div>
            <div>
              <p className="text-gray-500">{t.date}</p>
              <p className="font-medium">{formatDate(invoice.invoiceDate)}</p>
            </div>
            <div>
              <p className="text-gray-500">{t.netAmount}</p>
              <p className="font-medium">{formatCurrency(invoice.netAmount)}</p>
            </div>
            <div>
              <p className="text-gray-500">{t.grossAmount}</p>
              <p className="font-medium">{formatCurrency(invoice.grossAmount)}</p>
            </div>
          </div>

          {invoice.classification && (
            <div className="bg-blue-50 rounded-lg p-3 text-sm">
              <p className="font-medium text-blue-800 mb-1">
                {classificationLabel(invoice.classification.classification)}
              </p>
              {invoice.classification.category && (
                <p className="text-blue-700 text-xs mb-1">{invoice.classification.category}</p>
              )}
              {invoice.classification.reason && (
                <p className="text-blue-600 text-xs leading-relaxed">
                  {invoice.classification.reason}
                </p>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.finalDecision}
            </label>
            <select
              value={decision}
              onChange={(e) => setDecision(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{t.decisionNone}</option>
              <option value="deductible">{t.decisionDeductible}</option>
              <option value="non_deductible">{t.decisionNonDeductible}</option>
              <option value="partially_deductible">{t.decisionPartial}</option>
              <option value="accountant_review_required">{t.decisionReview}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.accountantNote}
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-5 border-t">
          <button
            onClick={onClose}
            className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2"
          >
            {t.close}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors disabled:opacity-60"
          >
            {saving ? t.saving : t.save}
          </button>
        </div>
      </div>
    </div>
  );
}
