import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ModalProvider } from "@/lib/modal-context";
import { CartFeedbackProvider } from "@/lib/cart-feedback";
import { COMPANY } from "@/lib/data";

const inter = Inter({
  subsets:  ["latin", "cyrillic"],
  weight:   ["400", "500", "600", "700", "800"],
  variable: "--font-inter",
  display:  "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://finnice.ru"),
  title: `${COMPANY.name} — Честная рассрочка в Грозном`,
  description: `${COMPANY.legalName} предоставляет жителям Чеченской Республики товарную рассрочку по нормам Ислама. ${COMPANY.slogan}`,
  keywords:    `рассрочка, ${COMPANY.city}, ${COMPANY.region}, исламская рассрочка, халяль, по нормам ислама`,
  alternates:  { canonical: "/" },
  openGraph: {
    title:       `${COMPANY.name} — Честная рассрочка в Грозном`,
    description: COMPANY.slogan,
    url:         "https://finnice.ru",
    siteName:    COMPANY.name,
    locale:      "ru_RU",
    type:        "website",
  },
  twitter: {
    card:        "summary_large_image",
    title:       `${COMPANY.name} — Честная рассрочка в Грозном`,
    description: COMPANY.slogan,
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={inter.variable}>
      <body>
        <ModalProvider>
          <CartFeedbackProvider>
            <SiteHeader />
            {children}
            <SiteFooter />
          </CartFeedbackProvider>
        </ModalProvider>
      </body>
    </html>
  );
}
