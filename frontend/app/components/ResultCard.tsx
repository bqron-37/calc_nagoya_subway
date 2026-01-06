import { RouteCandidate } from '../types';
import { ArrowRight, AlertTriangle, Clock, Map } from 'lucide-react';

type Props = {
    candidate: RouteCandidate;
    rank: number;
    isBestPrice?: boolean;
    isLeastTransfers?: boolean;
    onShowMap?: () => void; // 地図表示用のコールバック
};

export default function ResultCard({ candidate, rank, isBestPrice, isLeastTransfers, onShowMap }: Props) {
    return (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300 relative overflow-hidden group">

            {/* ラベル */}
            <div className="absolute top-0 right-0 flex z-20">
                {onShowMap && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onShowMap();
                        }}
                        className="bg-blue-100/50 hover:bg-blue-100 text-blue-600 text-[10px] font-bold px-3 py-1 rounded-bl-xl border-l border-b border-blue-200 transition-colors flex items-center gap-1 mr-1"
                    >
                        <Map size={12} />
                        地図で見る
                    </button>
                )}
                {isBestPrice && (
                    <div className="bg-orange-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl shadow-sm">
                        最安
                    </div>
                )}
                {isLeastTransfers && (
                    <div className="bg-blue-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl shadow-sm ml-px">
                        楽々
                    </div>
                )}
            </div>

            {candidate.exceeds_five_station_rule && (
                <div className="mb-4 bg-yellow-50 text-yellow-800 px-3 py-2 rounded-lg text-xs flex items-center gap-2 border border-yellow-200">
                    <AlertTriangle size={14} className="shrink-0" />
                    <span>乗換駅・特定駅の合計が5駅を超えています（窓口確認推奨）</span>
                </div>
            )}

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="bg-gray-800 text-white text-xs font-bold px-2 py-0.5 rounded-md">
                            #{rank}
                        </span>
                        <span className="text-gray-500 text-sm font-medium flex items-center gap-1">
                            <Map size={14} /> {candidate.distance}km / {candidate.zone}
                        </span>
                    </div>
                    <div className="flex items-baseline gap-1 text-gray-800">
                        <h3 className="text-2xl font-bold tracking-tight">
                            {candidate.price_1m.toLocaleString()}
                            <span className="text-sm font-normal ml-0.5">円</span>
                        </h3>
                        <span className="text-xs text-gray-400 font-medium">/ 1ヶ月</span>
                    </div>
                </div>

                <div className="text-right md:text-right hidden md:block">
                    <div className="text-sm text-gray-500">6ヶ月定期</div>
                    <div className="font-bold text-gray-700">{candidate.price_6m.toLocaleString()}円</div>
                </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div className="flex flex-wrap items-center gap-y-2 text-sm font-medium text-gray-700 leading-relaxed">
                    {candidate.full_path.map((station, i) => {
                        const isLast = i === candidate.full_path.length - 1;
                        return (
                            <div key={`${station}-${i}`} className="flex items-center group/station">
                                <span className={`
                   relative z-10 
                   ${i === 0 || isLast ? 'font-bold text-gray-900 bg-white px-2 py-0.5 rounded border border-gray-200 shadow-sm' : ''}
                `}>
                                    {station}
                                </span>
                                {!isLast && (
                                    <ArrowRight size={14} className="mx-1 text-gray-300 group-hover/station:text-blue-500 transition-colors" />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="mt-3 flex gap-4 text-xs text-gray-400 font-medium px-1">
                <div className="flex items-center gap-1">
                    <Clock size={12} />
                    <span>乗換 {candidate.transfers}回</span>
                </div>
            </div>

        </div>
    );
}
