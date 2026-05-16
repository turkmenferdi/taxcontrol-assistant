"use client";

import { useState, useRef } from "react";
import { X, Upload, FileSpreadsheet, AlertCircle, CheckCircle } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import { parseInvoiceFile, ParsedInvoiceRow } from "@/lib/invoice-parser";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Props {
  direction: "incoming" | "outgoing";
  onClose: () => void;
  onImported: () => void;
}

type Step = "upload" | "preview" | "done";

interface ImportResult {
  created: number;
  skipped: number;
  errors: number;
  warnings: string[];
  total: number;
}

export default function ImportModal({ direction, onClose, onImported }: Props) {
  const { t } = useLanguage();
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>("upload");
  const [preview, setPreview] = useState<ParsedInvoiceRow[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [parseError, setParseError] = useState("");

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setParseError("");

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const buf = ev.target?.result as ArrayBuffer;
        const { rows, warnings: w } = parseInvoiceFile(buf);
        if (rows.length === 0) {
          setParseError(t.importNoRows);
          return;
        }
        setPreview(rows.slice(0, 5));
        setWarnings(w);
        setStep("preview");
      } catch {
        setParseError(t.importParseError);
      }
    };
    reader.readAsArrayBuffer(f);
  }

  async function handleImport() {
    if (!file) return;
    setImporting(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("direction", direction);
    const res = await fetch("/api/invoices/import", { method: "POST", body: fd });
    const data = await res.json();
    setResult(data);
    setStep("done");
    setImporting(false);
    onImported();
  }

  const templateHeaders = direction === "incoming"
    ? "Fatura No,Tarih,Gönderen Adı,Gönderen VKN,Matrah,KDV,Toplam Tutar"
    : "Fatura No,Tarih,Alıcı Adı,Alıcı VKN,Matrah,KDV,Toplam Tutar";

  function downloadTemplate() {
    const csv = templateHeaders + "\n";
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `taxcontrol-${direction}-template.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b flex-shrink-0">
          <h2 className="font-semibold text-gray-900">
            {direction === "incoming" ? t.importIncomingTitle : t.importOutgoingTitle}
          </h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1">
          {/* Step: Upload */}
          {step === "upload" && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">{t.importDesc}</p>

              <div
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
              >
                <FileSpreadsheet className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-700">{t.importDropzone}</p>
                <p className="text-xs text-gray-400 mt-1">.xlsx, .xls, .csv</p>
                {parseError && (
                  <p className="text-sm text-red-600 mt-2 flex items-center justify-center gap-1">
                    <AlertCircle className="w-4 h-4" /> {parseError}
                  </p>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={handleFileChange}
              />

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
                <p className="font-medium mb-1">{t.importSupportedHeaders}</p>
                <p className="text-xs text-blue-600 font-mono">{templateHeaders}</p>
              </div>

              <button
                onClick={downloadTemplate}
                className="text-sm text-blue-600 hover:underline flex items-center gap-1"
              >
                <Upload className="w-3.5 h-3.5" /> {t.importDownloadTemplate}
              </button>
            </div>
          )}

          {/* Step: Preview */}
          {step === "preview" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FileSpreadsheet className="w-4 h-4 text-green-600" />
                <span className="font-medium text-gray-900">{file?.name}</span>
              </div>

              {warnings.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700">
                  {warnings.map((w, i) => (
                    <p key={i} className="flex items-start gap-1">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /> {w}
                    </p>
                  ))}
                </div>
              )}

              <p className="text-sm text-gray-500">{t.importPreviewNote}</p>

              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left px-3 py-2 font-medium text-gray-500">{t.date}</th>
                      <th className="text-left px-3 py-2 font-medium text-gray-500">{t.invoiceNo}</th>
                      <th className="text-left px-3 py-2 font-medium text-gray-500">
                        {direction === "incoming" ? t.supplier : t.customer}
                      </th>
                      <th className="text-right px-3 py-2 font-medium text-gray-500">{t.netAmount}</th>
                      <th className="text-right px-3 py-2 font-medium text-gray-500">{t.grossAmount}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {preview.map((row, i) => (
                      <tr key={i}>
                        <td className="px-3 py-2 text-gray-600">
                          {row.invoiceDate ? formatDate(row.invoiceDate.toISOString()) : "-"}
                        </td>
                        <td className="px-3 py-2 font-mono">{row.invoiceNumber ?? "-"}</td>
                        <td className="px-3 py-2 max-w-[160px] truncate">
                          {(direction === "incoming" ? row.supplierName : row.customerName) ?? "-"}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {row.netAmount != null ? formatCurrency(row.netAmount) : "-"}
                        </td>
                        <td className="px-3 py-2 text-right font-medium">
                          {row.grossAmount != null ? formatCurrency(row.grossAmount) : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-gray-400">{t.importPreviewOnly}</p>
            </div>
          )}

          {/* Step: Done */}
          {step === "done" && result && (
            <div className="text-center py-6 space-y-4">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
              <h3 className="font-semibold text-gray-900 text-lg">{t.importDone}</h3>
              <div className="inline-grid grid-cols-3 gap-6 text-center">
                <div>
                  <p className="text-2xl font-bold text-green-600">{result.created}</p>
                  <p className="text-xs text-gray-500">{t.importCreated}</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-400">{result.skipped}</p>
                  <p className="text-xs text-gray-500">{t.importSkipped}</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-400">{result.errors}</p>
                  <p className="text-xs text-gray-500">{t.importErrors}</p>
                </div>
              </div>
              {result.warnings?.length > 0 && (
                <div className="text-left bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700">
                  {result.warnings.map((w, i) => <p key={i}>{w}</p>)}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-5 border-t flex-shrink-0">
          {step === "upload" && (
            <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2">
              {t.close}
            </button>
          )}
          {step === "preview" && (
            <>
              <button
                onClick={() => { setStep("upload"); setPreview([]); setFile(null); }}
                className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2"
              >
                {t.close}
              </button>
              <button
                onClick={handleImport}
                disabled={importing}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors disabled:opacity-60"
              >
                {importing ? t.importingLabel : t.importBtn}
              </button>
            </>
          )}
          {step === "done" && (
            <button
              onClick={onClose}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2 rounded-lg"
            >
              {t.close}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
