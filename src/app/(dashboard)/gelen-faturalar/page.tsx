"use client";

import { useState } from "react";
import InvoiceTable from "@/components/invoices/InvoiceTable";
import ImportModal from "@/components/invoices/ImportModal";
import { useLanguage } from "@/contexts/language-context";
import { Upload } from "lucide-react";

export default function GelenFaturalarPage() {
  const { t } = useLanguage();
  const [showImport, setShowImport] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowImport(true)}
          className="flex items-center gap-2 text-sm bg-white border border-gray-200 hover:border-blue-400 hover:text-blue-600 text-gray-600 px-4 py-2 rounded-lg transition-colors shadow-sm"
        >
          <Upload className="w-4 h-4" />
          {t.importBtnLabel}
        </button>
      </div>

      <InvoiceTable key={refreshKey} direction="incoming" />

      {showImport && (
        <ImportModal
          direction="incoming"
          onClose={() => setShowImport(false)}
          onImported={() => { setShowImport(false); setRefreshKey(k => k + 1); }}
        />
      )}
    </div>
  );
}
