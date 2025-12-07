import type { Metadata } from "next";
import Script from "next/script";
import { SpeedInsights } from "@vercel/speed-insights/next"; // ★追加 1
import "./globals.css";

export const metadata: Metadata = {
  title: "地下鉄定期ルート検索",
  description: "名古屋市営地下鉄の定期券ルートを計算します",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <head>
        {/* AdSenseコード */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3492276242312732"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>
      <body>
        {children}
        
        {/* RES: Real Experience Score */}
        <SpeedInsights />
      </body>
    </html>
  );
}