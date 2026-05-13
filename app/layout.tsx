import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ModalProvider } from "@/lib/modal-context";
import { COMPANY } from "@/lib/data";

const inter = Inter({
  subsets:  ["latin", "cyrillic"],
  weight:   ["400", "500", "600", "700", "800"],
  variable: "--font-inter",
  display:  "swap",
});

export const metadata: Metadata = {
  title: `${COMPANY.name} — Честная рассрочка в Грозном`,
  description: `${COMPANY.legalName} предоставляет жителям Чеченской Республики товарную рассрочку по нормам Ислама. ${COMPANY.slogan}`,
  keywords:    `рассрочка, ${COMPANY.city}, ${COMPANY.region}, исламская рассрочка, без процентов, халяль`,
  openGraph: {
    title:       `${COMPANY.name} — Честная рассрочка в Грозном`,
    description: COMPANY.slogan,
    locale:      "ru_RU",
    type:        "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={inter.variable}>
      <body>
        <ModalProvider>
          <SiteHeader />
          {children}
          <SiteFooter />
        </ModalProvider>
      </body>
    </html>
  );
}
