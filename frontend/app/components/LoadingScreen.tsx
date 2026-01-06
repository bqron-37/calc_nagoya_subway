import { Loader2, ServerCrash } from 'lucide-react';

type LoadingScreenProps = {
    bootTime: number;
    errorMsg?: string;
};

export default function LoadingScreen({ bootTime, errorMsg }: LoadingScreenProps) {
    if (errorMsg) {
        return (
            <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-300">
                <div className="bg-red-50 p-4 rounded-full mb-4">
                    <ServerCrash className="w-12 h-12 text-red-500" />
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">接続エラー</h2>
                <p className="text-gray-600 mb-6">{errorMsg}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
                >
                    再読み込み
                </button>
            </div>
        );
    }

    const isLongWait = bootTime > 3;

    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
            <div className="relative mb-8">
                <div className="absolute inset-0 bg-blue-100 rounded-full blur-xl opacity-50 animate-pulse"></div>
                <div className="relative bg-white p-4 rounded-2xl shadow-xl ring-1 ring-gray-100">
                    <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                </div>
            </div>

            <h2 className="text-xl font-bold text-gray-800 mb-2">
                {isLongWait ? "サーバーを起動しています" : "データを読み込んでいます"}
            </h2>

            {isLongWait && (
                <div className="max-w-xs mx-auto space-y-2 text-sm text-gray-500 animate-in slide-in-from-bottom-2 fade-in duration-500 delay-150">
                    <p>
                        現在、スリープ状態から復帰中です。<br />
                        <span className="font-bold text-blue-600">最大1分程度</span> お待ちいただく場合があります。
                    </p>
                    <div className="w-full bg-gray-100 rounded-full h-1 mt-4 overflow-hidden">
                        <div className="bg-blue-500 h-1 rounded-full animate-progress-indeterminate"></div>
                    </div>
                </div>
            )}
        </div>
    );
}
