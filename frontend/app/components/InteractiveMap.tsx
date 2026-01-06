
import { useMemo } from 'react';
import { STATION_COORDINATES, SUBWAY_LINES } from '../data/mapData';
import { clsx } from 'clsx';
import { Check } from 'lucide-react';

type Props = {
    selectedStops: string[];
    onToggleStation: (station: string) => void;
    highlightPath?: string[]; // ハイライト表示するルート（駅名の配列）
};

export default function InteractiveMap({ selectedStops, onToggleStation, highlightPath }: Props) {
    // SVGのビューボックス定義
    const width = 1100;
    const height = 900;
    const viewBox = `0 0 ${width} ${height}`;

    // ハイライトルートの描画データ生成
    const highlightPolyline = useMemo(() => {
        if (!highlightPath || highlightPath.length < 2) return null;

        const points = highlightPath.map(st => {
            const coord = STATION_COORDINATES[st];
            if (!coord) return null;
            return `${coord.x},${coord.y} `;
        }).filter(Boolean).join(' ');

        return (
            <g className="animate-in fade-in duration-500">
                {/* 外側の太い縁取り（視認性向上） */}
                <polyline
                    points={points}
                    fill="none"
                    stroke="white"
                    strokeWidth="16"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="opacity-80 drop-shadow-md"
                />
                {/* メインのハイライト線 */}
                <polyline
                    points={points}
                    fill="none"
                    stroke="#ef4444" // red-500
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="animate-pulse" // 点滅させて強調
                    strokeDasharray="10 5" // 破線にしてみる？いや、実線でいいか。
                />

                {/* 始点と終点のマーカー */}
                {(() => {
                    const start = STATION_COORDINATES[highlightPath[0]];
                    const end = STATION_COORDINATES[highlightPath[highlightPath.length - 1]];
                    if (!start || !end) return null;
                    return (
                        <>
                            <circle cx={start.x} cy={start.y} r="12" fill="#ef4444" stroke="white" strokeWidth="3" />
                            <circle cx={end.x} cy={end.y} r="12" fill="#ef4444" stroke="white" strokeWidth="3" />
                        </>
                    );
                })()}
            </g>
        );
    }, [highlightPath]);

    // 線の描画データ生成
    const lines = useMemo(() => {
        return SUBWAY_LINES.map(line => {
            // 実際には SUBWAY_LINES にある sakuradori_fixed を使う
            if (line.id === 'sakuradori') return null; // 除外

            const points = line.stations.map(st => {
                const coord = STATION_COORDINATES[st];
                if (!coord) return null;
                return `${coord.x},${coord.y} `;
            }).filter(Boolean).join(' ');

            return (
                <polyline
                    key={line.id}
                    points={points}
                    fill="none"
                    stroke={line.color}
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={clsx("transition-opacity duration-300", highlightPath ? "opacity-30" : "opacity-80")} // ハイライト時は薄くする
                />
            );
        });
    }, [highlightPath]);

    return (
        <div className="w-full overflow-hidden bg-white rounded-2xl shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                <h2 className="font-bold text-gray-800 flex items-center gap-2">
                    <span className="text-xl">🗺️</span> 路線図
                    {highlightPath && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full ml-2">ルート表示中</span>}
                </h2>
                <div className="text-xs text-gray-500">
                    駅をクリック・タップして選択
                </div>
            </div>

            <div className="w-full overflow-x-auto">
                <div className="min-w-[800px] p-4">
                    <svg viewBox={viewBox} className="w-full h-auto select-none">
                        {/* 背景のグリッド（デバッグ用、本番では薄くするか消す） */}
                        {/* <defs>
              <pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse">
                <path d="M 100 0 L 0 0 0 100" fill="none" stroke="gray" strokeWidth="0.5" opacity="0.1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" /> */}

                        {/* 路線の描画 */}
                        <g className="filter drop-shadow-sm">
                            {lines}
                        </g>

                        {/* ハイライトルートの描画 (路線の手前、駅の後ろ？いや一番手前がいいか) */}
                        {/* 駅より手前にすると文字が消えるので、路線の直後に描画 */}
                        {highlightPolyline}

                        {/* 駅の描画 */}
                        {Object.entries(STATION_COORDINATES).map(([name, coord]) => {
                            const isSelected = selectedStops.includes(name);
                            // ルートに含まれる駅かどうか
                            const isHighlight = highlightPath?.includes(name);

                            return (
                                <g
                                    key={name}
                                    onClick={() => onToggleStation(name)}
                                    className="cursor-pointer group hover:opacity-80 transition-all duration-200"
                                >
                                    {/* アタリ判定用の透明な円（クリックしやすくする） */}
                                    <circle cx={coord.x} cy={coord.y} r="20" fill="transparent" />

                                    {/* 駅の円 */}
                                    <circle
                                        cx={coord.x}
                                        cy={coord.y}
                                        r={isSelected || isHighlight ? 10 : 6}
                                        fill={isSelected ? "#2563eb" : isHighlight ? "white" : "white"}
                                        stroke={isSelected ? "#ffffff" : isHighlight ? "#ef4444" : "#4b5563"}
                                        strokeWidth={isSelected ? 3 : isHighlight ? 4 : 2}
                                        className="transition-all duration-300 ease-out"
                                    />

                                    {/* 選択時のチェックマーク */}
                                    {isSelected && (
                                        <foreignObject x={coord.x - 8} y={coord.y - 8} width="16" height="16" className="pointer-events-none">
                                            <Check size={16} className="text-white" strokeWidth={4} />
                                        </foreignObject>
                                    )}

                                    {/* 駅名ラベル */}
                                    <text
                                        x={coord.x}
                                        y={coord.y}
                                        dy={
                                            coord.labelAlign === 'top' ? -15 :
                                                coord.labelAlign === 'bottom' ? 20 :
                                                    3
                                        }
                                        dx={
                                            coord.labelAlign === 'left' ? -15 :
                                                coord.labelAlign === 'right' ? 15 :
                                                    0
                                        }
                                        textAnchor={
                                            coord.labelAlign === 'left' ? 'end' :
                                                coord.labelAlign === 'right' ? 'start' :
                                                    'middle'
                                        }
                                        className={clsx(
                                            "text-[10px] sm:text-[12px] font-bold pointer-events-none transition-colors",
                                            isSelected ? "fill-blue-700 text-lg" : isHighlight ? "fill-red-600" : "fill-gray-700 group-hover:fill-black",
                                            highlightPath && !isHighlight && !isSelected && "opacity-40" // ハイライト時、他の駅は薄く
                                        )}
                                        style={{ fontWeight: isSelected || isHighlight ? 800 : 500 }}
                                    >
                                        {name}
                                    </text>
                                </g>
                            );
                        })}
                    </svg>
                </div>
            </div>

            <div className="px-4 py-2 bg-gray-50 text-center text-xs text-gray-400 border-t border-gray-100">
                ※ 実際の地形とは異なります（概略図）
            </div>
        </div>
    );
}
