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
        bg: "bg-yellow-50",
        border: "border-yellow-200",
        text: "text-yellow-900",
        badge: "bg-yellow-400"
    },
    "名城線": {
        bg: "bg-purple-50",
        border: "border-purple-200",
        text: "text-purple-900",
        badge: "bg-purple-400"
    },
    "名港線": {
        bg: "bg-purple-50/50",
        border: "border-purple-200",
        text: "text-purple-800",
        badge: "bg-purple-300"
    },
    "鶴舞線": {
        bg: "bg-blue-50",
        border: "border-blue-200",
        text: "text-blue-900",
        badge: "bg-blue-400"
    },
    "桜通線": {
        bg: "bg-red-50",
        border: "border-red-200",
        text: "text-red-900",
        badge: "bg-red-400"
    },
    "上飯田線": {
        bg: "bg-pink-50",
        border: "border-pink-200",
        text: "text-pink-900",
        badge: "bg-pink-400"
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
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div className="flex items-center gap-2">
                    <MapPin size={18} className="text-gray-500" />
                    <h2 className="font-bold text-gray-800">駅を選択</h2>
                    <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">
                        {selectedStops.length}
                    </span>
                </div>

                {selectedStops.length > 0 && (
                    <button
                        onClick={onClearAll}
                        className="text-xs text-red-600 hover:text-red-700 font-medium hover:bg-red-50 px-2 py-1 rounded transition"
                    >
                        全て解除
                    </button>
                )}
            </div>

            <div className="p-4 space-y-3">
                {selectedStops.length === 0 && (
                    <div className="text-center py-6 text-gray-400 text-sm border-2 border-dashed border-gray-100 rounded-xl">
                        リストから駅を選択してください
                    </div>
                )}

                {/* 選択中の駅表示エリア */}
                {selectedStops.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4 p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                        {selectedStops.map((stop) => (
                            <button
                                key={stop}
                                onClick={() => onToggleStation(stop)}
                                className="group flex items-center gap-1.5 bg-white border border-blue-200 text-blue-800 pl-3 pr-2 py-1.5 rounded-lg text-sm font-medium shadow-sm hover:border-red-200 hover:text-red-600 transition-all"
                            >
                                {stop}
                                <div className="text-gray-300 group-hover:text-red-400">×</div>
                            </button>
                        ))}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Object.keys(stationData).map((lineName) => {
                        const theme = LINE_THEMES[lineName] || {
                            bg: "bg-gray-50", border: "border-gray-200", text: "text-gray-700", badge: "bg-gray-400"
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
                                            <span className="bg-white/80 px-2 py-0.5 rounded text-xs font-bold text-gray-600 shadow-sm">
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
                                                                ? "bg-white border-blue-500 text-blue-700 shadow-md transform scale-105 ring-1 ring-blue-500/20"
                                                                : "bg-white/60 border-transparent text-gray-600 hover:bg-white hover:shadow-sm hover:border-gray-200"
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
