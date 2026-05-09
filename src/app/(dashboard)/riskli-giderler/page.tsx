"use client";

import InvoiceTable from "@/components/invoices/InvoiceTable";

export default function RiskliGiderlerPage() {
  return (
    <div>
      <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-700">
        Bu sayfada sistem tarafından riskli, kısmen indirilebilir veya muhasebeci onayı gerektiren olarak işaretlenen gelen faturalar listelenmektedir.
      </div>
      <InvoiceTable direction="incoming" riskyOnly title="Riskli Giderler" />
      <div className="mt-4">
        <h2 className="text-lg font-semibold mb-2">Muhasebeci Onayı Bekleyenler</h2>
        <InvoiceTable direction="incoming" reviewOnly title="" />
      </div>
    </div>
  );
}
