import type { Metadata } from "next";
import Script from "next/script";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Providers } from "./providers";
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
    <html lang="ja" suppressHydrationWarning>
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
        <Providers>
          {children}
          {/* RES: Real Experience Score */}
          <SpeedInsights />
        </Providers>
      </body>
    </html>
  );
}