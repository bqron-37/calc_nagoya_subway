'use client';

import { Train, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export default function Header() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 transition-colors duration-300">
            <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-600 p-2 rounded-lg text-white shadow-sm">
                        <Train size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-800 dark:text-white tracking-tight">
                            Nagoya Subway
                        </h1>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">地下鉄定期ルート検索</p>
                    </div>
                </div>

                {mounted && (
                    <button
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors"
                        aria-label="Toggle theme"
                    >
                        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                    </button>
                )}
            </div>
        </header>
    );
}
