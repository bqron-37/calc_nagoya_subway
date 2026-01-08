
import { useMemo, useState } from 'react';
import { STATION_COORDINATES, SUBWAY_LINES } from '../data/mapData';
import { clsx } from 'clsx';
import { Check } from 'lucide-react';

type Props = {
    selectedStops: string[];
    onToggleStation: (station: string) => void;
    highlightPath?: string[]; // ハイライト表示するルート（駅名の配列）
};

export default function InteractiveMap({ selectedStops, onToggleStation, highlightPath }: Props) {
    // ホバー中の駅を管理
    const [hoveredStation, setHoveredStation] = useState<string | null>(null);

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
                    strokeWidth="16"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={clsx("transition-all duration-500", highlightPath ? "opacity-20 blur-[1px]" : "opacity-90")} // ハイライト時は他を薄くぼかす
                />
            );
        });
    }, [highlightPath]);

    return (
        <div className="w-full overflow-hidden bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 dark:border-gray-700 ring-1 ring-gray-200/50 dark:ring-white/5 transition-all hover:shadow-2xl hover:shadow-blue-500/10 dark:hover:shadow-blue-900/10">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-gray-50/50 to-white/50 dark:from-gray-900/50 dark:to-gray-800/50 flex justify-between items-center backdrop-blur-md transition-colors">
                <h2 className="font-bold text-gray-800 dark:text-gray-100 flex items-center gap-3">
                    <div className="p-2 bg-blue-100/50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl text-xl">🗺️</div>
                    <span className="text-lg tracking-tight">路線図から選択</span>
                    {highlightPath && (
                        <span className="text-xs font-bold bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-3 py-1 rounded-full animate-in fade-in ml-2 shadow-sm border border-red-200 dark:border-red-900/50">
                            ルート表示中
                        </span>
                    )}
                </h2>
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-white/80 dark:bg-gray-900/80 px-3 py-1.5 rounded-full shadow-sm border border-gray-200 dark:border-gray-700">
                    駅をクリックして選択
                </div>
            </div>

            <div className="w-full overflow-x-auto bg-grid-slate-100 dark:bg-gray-900 transition-colors">
                <div className="min-w-[1000px] p-8 md:p-12">
                    <svg viewBox={viewBox} className="w-full h-auto select-none overflow-visible">
                        <defs>
                            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                                <feGaussianBlur stdDeviation="4" result="blur" />
                                <feComposite in="SourceGraphic" in2="blur" operator="over" />
                            </filter>
                            <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                                <feDropShadow dx="2" dy="2" stdDeviation="3" floodOpacity="0.3" />
                            </filter>
                        </defs>

                        {/* 路線の描画 */}
                        <g style={{ filter: 'url(#shadow)' }}>
                            {lines}
                        </g>

                        {/* ハイライトルートの描画 */}
                        {highlightPolyline}

                        {/* 駅の描画 (円マーカー) */}
                        {Object.entries(STATION_COORDINATES).map(([name, coord]) => {
                            const isSelected = selectedStops.includes(name);
                            const isHighlight = highlightPath?.includes(name);

                            return (
                                <g
                                    key={`station-${name}`}
                                    onClick={() => onToggleStation(name)}
                                    onMouseEnter={() => setHoveredStation(name)}
                                    onMouseLeave={() => setHoveredStation(null)}
                                    className="cursor-pointer group transition-all duration-300 ease-out"
                                >
                                    {/* アタリ判定用の透明な円 */}
                                    <circle cx={coord.x} cy={coord.y} r="25" fill="transparent" />

                                    {/* 駅の円 (背景) */}
                                    {/* fill属性を削除し、クラスで色を指定 */}
                                    <circle
                                        cx={coord.x}
                                        cy={coord.y}
                                        r={isSelected || isHighlight ? 14 : 9}
                                        className="transition-all duration-300 fill-white dark:fill-gray-900"
                                        style={{ filter: 'url(#shadow)' }}
                                    />

                                    {/* 駅の円 (メイン) */}
                                    <circle
                                        cx={coord.x}
                                        cy={coord.y}
                                        r={isSelected || isHighlight ? 14 : 9}
                                        strokeWidth={isSelected ? 4 : isHighlight ? 5 : 3}
                                        className={clsx(
                                            "transition-colors duration-100",
                                            isSelected
                                                ? "fill-blue-500 stroke-white"
                                                : isHighlight
                                                    ? "fill-white dark:fill-gray-900 stroke-red-500"
                                                    : "fill-white dark:fill-gray-900 stroke-gray-500 dark:stroke-gray-400 group-hover:stroke-gray-900 dark:group-hover:stroke-white"
                                        )}
                                    />

                                    {/* 選択時のチェックマーク */}
                                    {isSelected && (
                                        <foreignObject
                                            x={coord.x - 12}
                                            y={coord.y - 12}
                                            width="24"
                                            height="24"
                                            className="pointer-events-none"
                                        >
                                            <div className="flex items-center justify-center w-full h-full bg-blue-500 rounded-full shadow-lg border-2 border-white">
                                                <Check size={16} className="text-white" strokeWidth={4} />
                                            </div>
                                        </foreignObject>
                                    )}
                                </g>
                            );
                        })}

                        {/* 駅名ラベル (最前面レイヤー) */}
                        {Object.entries(STATION_COORDINATES).map(([name, coord]) => {
                            const isSelected = selectedStops.includes(name);
                            const isHighlight = highlightPath?.includes(name);
                            const isHovered = hoveredStation === name;

                            return (
                                <g
                                    key={`label-${name}`}
                                    className="pointer-events-none"
                                >
                                    <text
                                        x={coord.x}
                                        y={coord.y}
                                        dy={
                                            coord.labelAlign === 'top' ? -25 :
                                                coord.labelAlign === 'bottom' ? 32 :
                                                    6
                                        }
                                        dx={
                                            coord.labelAlign === 'left' ? -25 :
                                                coord.labelAlign === 'right' ? 25 :
                                                    0
                                        }
                                        textAnchor={
                                            coord.labelAlign === 'left' ? 'end' :
                                                coord.labelAlign === 'right' ? 'start' :
                                                    'middle'
                                        }
                                        // stroke属性を削除し、クラスで制御
                                        strokeWidth="5"
                                        paintOrder="stroke"
                                        className={clsx(
                                            "text-[14px] sm:text-[16px] font-black transition-all duration-200 select-none",
                                            "stroke-white dark:stroke-gray-900", // 縁取り色
                                            (isSelected || isHighlight || isHovered)
                                                ? "opacity-100 z-50 text-[16px] sm:text-[18px]"
                                                : "opacity-0",
                                            isSelected
                                                ? "fill-blue-700 dark:fill-blue-400"
                                                : isHighlight
                                                    ? "fill-red-600 dark:fill-red-400"
                                                    : "fill-gray-900 dark:fill-white"
                                        )}
                                        style={{
                                            fontWeight: 900,
                                        }}
                                    >
                                        {name}
                                    </text>
                                </g>
                            );
                        })}
                    </svg>
                </div>
            </div>

            <div className="px-6 py-3 bg-gray-50/80 dark:bg-gray-800/80 backdrop-blur text-center text-xs font-medium text-gray-400 dark:text-gray-500 border-t border-gray-100 dark:border-gray-700 transition-colors">
                Map Graphic © 2026 Nagoya Subway Calc
            </div>
        </div>
    );
}
