import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script"; // Scriptコンポーネントをインポート
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// アプリ用のタイトル設定に変更
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
    // 言語を日本語(ja)に変更
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* AdSenseコード */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3492276242312732"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        
        {children}
      </body>
    </html>
  );
}