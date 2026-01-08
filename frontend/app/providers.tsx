'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import React, { useState, useEffect } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
    const [mounted, setMounted] = useState(false);

    // マウントされるまでレンダリングを待機（ハイドレーション・ミスマッチ防止）
    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <>{children}</>;
    }

    return (
        <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
            {children}
        </NextThemesProvider>
    );
}
