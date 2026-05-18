"use client";

import InvoiceTable from "@/components/invoices/InvoiceTable";
import { useLanguage } from "@/contexts/language-context";
import { AlertTriangle, ClipboardCheck } from "lucide-react";

export default function RiskliGiderlerPage() {
  const { t } = useLanguage();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t.navRisky}</h1>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <p className="text-sm font-semibold text-red-700">{t.riskyCardTitle}</p>
          </div>
          <p className="text-xs text-red-600 leading-relaxed">{t.riskyCardDesc}</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <ClipboardCheck className="w-4 h-4 text-yellow-600" />
            <p className="text-sm font-semibold text-yellow-700">{t.reviewCardTitle}</p>
          </div>
          <p className="text-xs text-yellow-600 leading-relaxed">{t.reviewCardDesc}</p>
        </div>
      </div>

      <div>
        <h2 className="text-base font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-500" />
          {t.riskyTitle}
        </h2>
        <InvoiceTable direction="incoming" riskyOnly />
      </div>

      <div>
        <h2 className="text-base font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <ClipboardCheck className="w-4 h-4 text-yellow-600" />
          {t.reviewTitle}
        </h2>
        <InvoiceTable direction="incoming" reviewOnly />
      </div>
    </div>
  );
}
