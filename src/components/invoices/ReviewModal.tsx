"use client";

import { useState } from "react";
import { formatCurrency, formatDate, classificationLabel } from "@/lib/utils";
import { X } from "lucide-react";

const CLASSIFICATION_OPTIONS = [
  { value: "deductible", label: "İndirilebilir" },
  { value: "non_deductible", label: "İndirilemez" },
  { value: "partially_deductible", label: "Kısmen İndirilebilir" },
  { value: "accountant_review_required", label: "Muhasebeci Onayı Gerekli" },
];

interface Invoice {
  id: string;
  invoiceNumber?: string;
  invoiceDate: string;
  supplierName?: string;
  netAmount: number;
  vatAmount: number;
  grossAmount: number;
  classification?: {
    classification: string;
    accountantFinalDecision?: string;
    reason?: string;
    category?: string;
    confidenceScore?: number;
    accountantNote?: string;
  } | null;
}

interface Props {
  invoice: Invoice;
  onClose: () => void;
  onSaved: () => void;
}

export default function ReviewModal({ invoice, onClose, onSaved }: Props) {
  const [decision, setDecision] = useState(
    invoice.classification?.accountantFinalDecision ?? ""
  );
  const [note, setNote] = useState(invoice.classification?.accountantNote ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await fetch(`/api/invoices/${invoice.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accountantFinalDecision: decision || null, accountantNote: note }),
    });
    setSaving(false);
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="font-semibold text-gray-900">Fatura İnceleme</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-gray-500">Tedarikçi</p>
              <p className="font-medium">{invoice.supplierName ?? "-"}</p>
            </div>
            <div>
              <p className="text-gray-500">Tarih</p>
              <p className="font-medium">{formatDate(invoice.invoiceDate)}</p>
            </div>
            <div>
              <p className="text-gray-500">Net Tutar</p>
              <p className="font-medium">{formatCurrency(invoice.netAmount)}</p>
            </div>
            <div>
              <p className="text-gray-500">Brüt Tutar</p>
              <p className="font-medium">{formatCurrency(invoice.grossAmount)}</p>
            </div>
          </div>

          {invoice.classification && (
            <div className="bg-blue-50 rounded-lg p-3 text-sm">
              <p className="font-medium text-blue-800 mb-1">
                Sistem Değerlendirmesi: {classificationLabel(invoice.classification.classification)}
                {invoice.classification.confidenceScore
                  ? ` (%${Math.round(invoice.classification.confidenceScore * 100)} güven)`
                  : ""}
              </p>
              {invoice.classification.category && (
                <p className="text-blue-700 text-xs mb-1">Kategori: {invoice.classification.category}</p>
              )}
              {invoice.classification.reason && (
                <p className="text-blue-600 text-xs leading-relaxed">{invoice.classification.reason}</p>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Muhasebeci Kararı
            </label>
            <select
              value={decision}
              onChange={(e) => setDecision(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">— Sistem kararını kullan —</option>
              {CLASSIFICATION_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Not</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="İsteğe bağlı not ekleyin..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-5 border-t">
          <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2">İptal</button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors disabled:opacity-60"
          >
            {saving ? "Kaydediliyor..." : "Kaydet"}
          </button>
        </div>
      </div>
    </div>
  );
}
