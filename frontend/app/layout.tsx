import type { Metadata } from "next";
import Script from "next/script";
import { Noto_Sans_JP } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next"; // ★追加 1
import "./globals.css";

const notoSansJp = Noto_Sans_JP({
  weight: ["400", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-noto-sans-jp",
});

export const metadata: Metadata = {
  title: "名古屋市営地下鉄 定期ルート計算",
  description: "名古屋市営地下鉄の定期券ルートを計算します",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={notoSansJp.variable}>
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