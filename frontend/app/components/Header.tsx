import { Train } from 'lucide-react';

export default function Header() {
    return (
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
            <div className="max-w-5xl mx-auto px-4 h-16 flex items-center gap-3">
                <div className="bg-blue-600 p-2 rounded-lg text-white shadow-sm">
                    <Train size={24} />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-gray-800 tracking-tight">
                        Nagoya Subway
                    </h1>
                    <p className="text-xs text-gray-500 font-medium">地下鉄定期ルート検索</p>
                </div>
            </div>
        </header>
    );
}
