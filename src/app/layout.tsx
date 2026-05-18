import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/contexts/language-context";
import { Toaster } from "@/components/ui/Toast";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });

export const metadata: Metadata = {
  title: "TaxControl - Fatura & Vergi Kontrol Asistanı",
  description: "KOBİ'ler için e-fatura, KDV ve geçici vergi ön kontrol asistanı",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className={`${geist.variable} h-full`}>
      <body className="h-full bg-gray-50 text-gray-900 antialiased">
        <LanguageProvider>{children}<Toaster /></LanguageProvider>
      </body>
    </html>
  );
}
