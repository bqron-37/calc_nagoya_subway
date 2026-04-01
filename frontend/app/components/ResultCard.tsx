import { RouteCandidate } from "../types";
import { Clock, RefreshCw, Wallet, Train } from "lucide-react";

type Props = {
    candidate: RouteCandidate;
    rank: number;
    isBestPrice: boolean;
    isLeastTransfers: boolean;
};

export default function ResultCard({ candidate, rank, isBestPrice, isLeastTransfers }: Props) {
    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY" }).format(price);
    };

    return (
        <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border transition-all duration-300 overflow-hidden border-gray-200 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-500/30`}>
            <div className="p-4 sm:p-5">
                <div className="flex justify-between items-start gap-4">

                    {/* 左側: ランクと基本情報 */}
                    <div className="flex-1 min-w-0">
                        {/* ランクバッジ等はそのまま */}
                        <div className="flex items-center gap-3 mb-2">
                            <div className={`flex items-center justify-center w-8 h-8 rounded-full font-black font-mono text-lg transition-colors
                  ${rank === 1 ? "bg-yellow-400 text-yellow-900 dark:bg-yellow-500/20 dark:text-yellow-400" :
                                    rank === 2 ? "bg-gray-300 text-gray-800 dark:bg-gray-700 dark:text-gray-300" :
                                        rank === 3 ? "bg-orange-300 text-orange-900 dark:bg-orange-500/20 dark:text-orange-400" : "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"}
                `}>
                                {rank}
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {isBestPrice && <span className="px-2 py-0.5 text-xs font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full border border-green-200 dark:border-green-500/30">最安</span>}
                                {isLeastTransfers && <span className="px-2 py-0.5 text-xs font-bold bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 rounded-full border border-orange-200 dark:border-orange-500/30">{candidate.transfers === 0 ? "乗換なし" : "乗換最少"}</span>}
                            </div>
                        </div>

                        {/* メイン情報 */}
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
                                {formatPrice(candidate.price_1m)}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-3">
                                <div className="flex items-center gap-1">
                                    <RefreshCw size={14} /> 乗換: {candidate.transfers}回
                                </div>
                                <div className="flex items-center gap-1">
                                    <Train size={14} /> 距離: {candidate.distance.toFixed(1)}km
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 経路詳細（テキスト） */}
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                        {candidate.full_path.map((stop, i) => (
                            <div key={i} className="flex items-center">
                                <span className="font-bold text-gray-700 dark:text-gray-300">{stop}</span>
                                {i < candidate.full_path.length - 1 && (
                                    <span className="mx-2 text-gray-300 dark:text-gray-600 text-xs">▶</span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
