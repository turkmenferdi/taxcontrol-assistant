"use client";

import InvoiceTable from "@/components/invoices/InvoiceTable";
import { useLanguage } from "@/contexts/language-context";

export default function RiskliGiderlerPage() {
  const { t } = useLanguage();
  return (
    <div>
      <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-700">
        {t.navRisky}
      </div>
      <InvoiceTable direction="incoming" riskyOnly />
      <div className="mt-4">
        <h2 className="text-lg font-semibold mb-2">{t.reviewTitle}</h2>
        <InvoiceTable direction="incoming" reviewOnly />
      </div>
    </div>
  );
}
