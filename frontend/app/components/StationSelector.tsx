import { useState } from 'react';
import { StationData } from '../types';
import { ChevronDown, ChevronUp, MapPin, Check } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

type Props = {
    stationData: StationData;
    selectedStops: string[];
    onToggleStation: (station: string) => void;
    onClearAll: () => void;
};

// 路線ごとのテーマカラー定義
const LINE_THEMES: { [key: string]: { bg: string; border: string; text: string; badge: string } } = {
    "東山線": {
        bg: "bg-yellow-50 dark:bg-yellow-900/20",
        border: "border-yellow-200 dark:border-yellow-700/50",
        text: "text-yellow-900 dark:text-yellow-200",
        badge: "bg-yellow-400 dark:bg-yellow-600"
    },
    "名城線": {
        bg: "bg-purple-50 dark:bg-purple-900/20",
        border: "border-purple-200 dark:border-purple-700/50",
        text: "text-purple-900 dark:text-purple-200",
        badge: "bg-purple-400 dark:bg-purple-600"
    },
    "名港線": {
        bg: "bg-purple-50/50 dark:bg-purple-900/10",
        border: "border-purple-200 dark:border-purple-700/50",
        text: "text-purple-800 dark:text-purple-300",
        badge: "bg-purple-300 dark:bg-purple-500"
    },
    "鶴舞線": {
        bg: "bg-blue-50 dark:bg-blue-900/20",
        border: "border-blue-200 dark:border-blue-700/50",
        text: "text-blue-900 dark:text-blue-200",
        badge: "bg-blue-400 dark:bg-blue-600"
    },
    "桜通線": {
        bg: "bg-red-50 dark:bg-red-900/20",
        border: "border-red-200 dark:border-red-700/50",
        text: "text-red-900 dark:text-red-200",
        badge: "bg-red-400 dark:bg-red-600"
    },
    "上飯田線": {
        bg: "bg-pink-50 dark:bg-pink-900/20",
        border: "border-pink-200 dark:border-pink-700/50",
        text: "text-pink-900 dark:text-pink-200",
        badge: "bg-pink-400 dark:bg-pink-600"
    },
};

export default function StationSelector({ stationData, selectedStops, onToggleStation, onClearAll }: Props) {
    // 初期状態は全ての路線を開いておくか、あるいは一部だけ開くか。
    // ここでは全て開いた状態をデフォルトとする。
    const [openLines, setOpenLines] = useState<string[]>(Object.keys(stationData));

    const toggleLine = (line: string) => {
        if (openLines.includes(line)) {
            setOpenLines(openLines.filter(l => l !== line));
        } else {
            setOpenLines([...openLines, line]);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-700/50">
                <div className="flex items-center gap-2">
                    <MapPin size={18} className="text-gray-500 dark:text-gray-400" />
                    <h2 className="font-bold text-gray-800 dark:text-gray-200">駅を選択</h2>
                    <span className="bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-bold px-2 py-0.5 rounded-full">
                        {selectedStops.length}
                    </span>
                </div>

                {selectedStops.length > 0 && (
                    <button
                        onClick={onClearAll}
                        className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium hover:bg-red-50 dark:hover:bg-red-900/20 px-2 py-1 rounded transition"
                    >
                        全て解除
                    </button>
                )}
            </div>

            <div className="p-4 space-y-3">
                {selectedStops.length === 0 && (
                    <div className="text-center py-6 text-gray-400 dark:text-gray-500 text-sm border-2 border-dashed border-gray-100 dark:border-gray-700 rounded-xl">
                        リストから駅を選択してください
                    </div>
                )}

                {/* 選択中の駅表示エリア */}
                {selectedStops.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4 p-3 bg-blue-50/50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-900/30">
                        {selectedStops.map((stop) => (
                            <button
                                key={stop}
                                onClick={() => onToggleStation(stop)}
                                className="group flex items-center gap-1.5 bg-white dark:bg-gray-700 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200 pl-3 pr-2 py-1.5 rounded-lg text-sm font-medium shadow-sm hover:border-red-200 dark:hover:border-red-900/50 hover:text-red-600 dark:hover:text-red-400 transition-all"
                            >
                                {stop}
                                <div className="text-gray-300 dark:text-gray-500 group-hover:text-red-400 dark:group-hover:text-red-400">×</div>
                            </button>
                        ))}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Object.keys(stationData).map((lineName) => {
                        const theme = LINE_THEMES[lineName] || {
                            bg: "bg-gray-50 dark:bg-gray-800", border: "border-gray-200 dark:border-gray-700", text: "text-gray-700 dark:text-gray-300", badge: "bg-gray-400 dark:bg-gray-600"
                        };
                        const isOpen = openLines.includes(lineName);
                        const stations = stationData[lineName];
                        const selectedCount = stations.filter(s => selectedStops.includes(s)).length;

                        return (
                            <div
                                key={lineName}
                                className={clsx(
                                    "rounded-xl border transition-all duration-200",
                                    theme.bg, theme.border,
                                    isOpen ? "shadow-sm" : "opacity-80 hover:opacity-100"
                                )}
                            >
                                <button
                                    onClick={() => toggleLine(lineName)}
                                    className="w-full flex items-center justify-between p-3 text-left"
                                >
                                    <div className="flex items-center gap-2">
                                        <span className={clsx("w-2 h-8 rounded-full", theme.badge)}></span>
                                        <span className={clsx("font-bold text-sm", theme.text)}>{lineName}</span>
                                        {selectedCount > 0 && (
                                            <span className="bg-white/80 dark:bg-gray-800/80 px-2 py-0.5 rounded text-xs font-bold text-gray-600 dark:text-gray-300 shadow-sm">
                                                {selectedCount}選択中
                                            </span>
                                        )}
                                    </div>
                                    <div className={clsx(theme.text)}>
                                        {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                    </div>
                                </button>

                                {isOpen && (
                                    <div className="px-3 pb-3 pt-0">
                                        <div className="flex flex-wrap gap-1.5">
                                            {stations.map((station) => {
                                                const isSelected = selectedStops.includes(station);
                                                return (
                                                    <button
                                                        key={`${lineName}-${station}`}
                                                        onClick={() => onToggleStation(station)}
                                                        className={twMerge(
                                                            "px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 border",
                                                            isSelected
                                                                ? "bg-white dark:bg-gray-700 border-blue-500 text-blue-700 dark:text-blue-300 shadow-md transform scale-105 ring-1 ring-blue-500/20"
                                                                : "bg-white/60 dark:bg-gray-700/30 border-transparent text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700 hover:shadow-sm hover:border-gray-200 dark:hover:border-gray-600"
                                                        )}
                                                    >
                                                        <div className="flex items-center gap-1">
                                                            {isSelected && <Check size={12} strokeWidth={3} />}
                                                            {station}
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
