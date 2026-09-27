import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Geist_Mono } from "next/font/google";
import { siteAssets } from "@/lib/assets";
import { copy } from "@/lib/content/copy";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

const TITLE = "Deus Conosco — Assinatura";
const TITLE_TEMPLATE = `%s — ${copy.brand}`;
const DESCRIPTION =
  "Todos os dias, existe um momento para estar presente. Assine o Deus Conosco, da Editora Santuário, e receba a Palavra de cada dia em casa.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: TITLE, template: TITLE_TEMPLATE },
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    locale: "pt_BR",
    type: "website",
    images: [
      {
        url: siteAssets.share.src,
        width: siteAssets.share.width,
        height: siteAssets.share.height,
        alt: siteAssets.share.alt,
      },
    ],
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      className={`${bricolage.variable} ${geistMono.variable} h-full antialiased`}
      lang="pt-BR"
    >
      <body className="min-h-full" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
