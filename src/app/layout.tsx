import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Mirror-AI | 人人可用的 AI 投资平台",
  description: "1 美金起投 · 免税交易 · AI 驱动 · 基于 Hyperliquid",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" className="dark">
      <body className={`${inter.className} bg-bg-primary text-white antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
