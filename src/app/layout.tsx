import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: "Mirror-AI | 人人可用的 AI 投资平台",
  description: "1 美金起投 · 免税交易 · AI 驱动量化策略 · 基于 Hyperliquid 构建",
  keywords: ["AI投资", "量化交易", "Hyperliquid", "DeFi", "加密货币"],
  authors: [{ name: "TAKI" }],
  openGraph: {
    title: "Mirror-AI | AI 投资平台",
    description: "人人可用的 AI 投资平台，1 美金起投",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#020617',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" className="dark">
      <body className={`${inter.variable} font-sans bg-[hsl(220,20%,4%)] text-white antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
