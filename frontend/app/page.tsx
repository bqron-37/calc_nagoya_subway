"use client";
import { useState, useEffect } from "react";

// === 型定義 ===
type RouteCandidate = {
  route_str: string;
  distance: number;
  zone: string;
  price_1m: number;
  price_6m: number;
  full_path: string[];
  transfers: number;
  exceeds_five_station_rule: boolean;
};

type StationData = {
  [lineName: string]: string[];
};

// 路線ごとのテーマカラー定義
const LINE_STYLES: { [key: string]: string } = {
  "東山線": "border-l-4 border-yellow-400 bg-yellow-50",
  "名城線": "border-l-4 border-purple-400 bg-purple-50",
  "名港線": "border-l-4 border-purple-300 bg-purple-50", // 名城線と同系色
  "鶴舞線": "border-l-4 border-blue-400 bg-blue-50",
  "桜通線": "border-l-4 border-red-400 bg-red-50",
  "上飯田線": "border-l-4 border-pink-400 bg-pink-50",
};

export default function Home() {
  const [stationData, setStationData] = useState<StationData>({});
  
  // 選択された駅のリスト（順不同）
  const [selectedStops, setSelectedStops] = useState<string[]>([]);
  
  const [candidates, setCandidates] = useState<RouteCandidate[]>([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [sortMode, setSortMode] = useState<"price" | "transfers">("price");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/stations")
      .then((res) => res.json())
      .then((data) => {
        setStationData(data.stations);
      })
      .catch((err) => console.error(err));
  }, []);

  // 駅をクリックしたときのトグル処理
  const toggleStation = (stationName: string) => {
    if (selectedStops.includes(stationName)) {
      setSelectedStops(selectedStops.filter((s) => s !== stationName));
    } else {
      setSelectedStops([...selectedStops, stationName]);
    }
  };

  // 計算実行
  const handleCalculate = async () => {
    setErrorMsg("");
    setCandidates([]);
    
    // 重複除去（念のため）
    const uniqueStops = Array.from(new Set(selectedStops));
    if (uniqueStops.length < 2) {
      setErrorMsg("異なる駅を2つ以上選んでください");
      return;
    }

    setIsLoading(true);

    try {
      const params = new URLSearchParams();
      uniqueStops.forEach((st) => params.append("stops", st));
      
      const res = await fetch(`http://127.0.0.1:8000/calculate?${params.toString()}`);
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.detail || "計算エラー");
      
      setCandidates(data.candidates);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const sortedCandidates = [...candidates].sort((a, b) => {
    if (sortMode === "price") {
      if (a.distance !== b.distance) return a.distance - b.distance;
      return a.transfers - b.transfers;
    } else {
      if (a.transfers !== b.transfers) return a.transfers - b.transfers;
      return a.distance - b.distance;
    }
  });

  return (
    <main className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6"> {/* 横幅を広げました */}
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold mb-4 text-center text-blue-600">地下鉄定期ルート検索</h1>
          
          {/* === 選択状況表示エリア === */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h2 className="text-sm font-bold text-gray-500 mb-2">選択中の駅 ({selectedStops.length}駅):</h2>
            {selectedStops.length === 0 ? (
              <p className="text-gray-400 text-sm">下のリストから駅を選んでください</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {selectedStops.map((stop) => (
                  <button
                    key={stop}
                    onClick={() => toggleStation(stop)}
                    className="bg-blue-600 text-white text-sm px-3 py-1 rounded-full flex items-center gap-1 hover:bg-blue-700 transition"
                  >
                    {stop}
                    <span className="text-blue-200 text-xs ml-1">×</span>
                  </button>
                ))}
                {selectedStops.length >= 2 && (
                  <button 
                    onClick={() => setSelectedStops([])}
                    className="text-xs text-red-500 underline ml-2 self-center"
                  >
                    全解除
                  </button>
                )}
              </div>
            )}
          </div>

          {/* === 計算ボタン === */}
          <div className="mb-8 text-center">
            <button 
              onClick={handleCalculate} 
              disabled={isLoading || selectedStops.length < 2}
              className={`w-full md:w-1/2 py-3 rounded-lg font-bold transition shadow-md flex justify-center items-center gap-2 mx-auto
                ${(isLoading || selectedStops.length < 2) ? "bg-gray-300 cursor-not-allowed text-gray-500" : "bg-blue-600 text-white hover:bg-blue-700 hover:scale-105"}
              `}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                  計算中...
                </>
              ) : (
                "ルートを検索する"
              )}
            </button>
            {errorMsg && <div className="mt-2 text-red-500 text-sm font-bold">{errorMsg}</div>}
          </div>

          {/* === 駅一覧エリア（路線ごと） === */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.keys(stationData).map((lineName) => (
              <div key={lineName} className={`p-4 rounded-lg shadow-sm ${LINE_STYLES[lineName] || "bg-gray-50"}`}>
                <h3 className="font-bold text-gray-700 mb-3 border-b border-gray-200 pb-1">{lineName}</h3>
                <div className="flex flex-wrap gap-2">
                  {stationData[lineName].map((station) => {
                    const isSelected = selectedStops.includes(station);
                    return (
                      <button
                        key={`${lineName}-${station}`}
                        onClick={() => toggleStation(station)}
                        className={`
                          px-3 py-1.5 rounded text-sm transition border
                          ${isSelected 
                            ? "bg-blue-600 text-white border-blue-600 font-bold shadow-md transform scale-105" 
                            : "bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:bg-blue-50"
                          }
                        `}
                      >
                        {station}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* === 結果表示エリア === */}
        {candidates.length > 0 && (
          <div className="space-y-4 pb-10">
            <div className="flex justify-between items-end px-2">
              <h2 className="text-xl font-bold text-gray-700">検索結果 ({candidates.length}件)</h2>
              <div className="flex bg-white rounded-lg shadow-sm border overflow-hidden">
                <button
                  onClick={() => setSortMode("price")}
                  className={`px-4 py-2 text-sm font-bold transition ${sortMode === "price" ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
                >
                  安い順
                </button>
                <button
                  onClick={() => setSortMode("transfers")}
                  className={`px-4 py-2 text-sm font-bold transition ${sortMode === "transfers" ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
                >
                  乗換少ない順
                </button>
              </div>
            </div>

            {sortedCandidates.map((cand, i) => (
              <div key={i} className="bg-white p-5 rounded-lg shadow-md border-l-4 border-blue-500 animate-fade-in">
                {cand.exceeds_five_station_rule && (
                  <div className="mb-4 bg-yellow-50 border border-yellow-200 text-yellow-800 p-3 rounded-lg flex items-start gap-2">
                    <span className="text-xl">⚠️</span>
                    <div className="text-sm">
                      <strong>注意: 判別駅制限の確認が必要です</strong><br/>
                      乗換駅と特定駅の合計が5駅を超えているため、窓口で発売できない可能性があります。
                    </div>
                  </div>
                )}

                <div className="mb-2 flex justify-between items-center">
                  <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded">
                    候補 {i + 1}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 text-sm font-mono">{cand.distance} km ({cand.zone})</span>
                    <span className={`text-xs px-2 py-1 rounded font-bold ${cand.transfers === 0 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      乗換 {cand.transfers}回
                    </span>
                  </div>
                </div>
                
                <div className="text-lg font-bold text-gray-800 mb-3 break-words">{cand.route_str}</div>

                <div className="bg-gray-50 p-3 rounded mb-4 text-sm text-gray-600">
                  <div className="font-bold text-gray-400 text-xs mb-1">詳細ルート:</div>
                  <div className="leading-relaxed">
                    {cand.full_path.map((st, idx) => (
                      <span key={idx}>
                        <span className={selectedStops.includes(st) ? "font-bold text-blue-600" : "text-black"}>{st}</span>
                        {idx < cand.full_path.length - 1 && <span className="text-gray-400 mx-1">→</span>}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between items-center bg-blue-50 p-3 rounded border border-blue-100">
                  <div className="text-center w-1/2 border-r border-blue-200">
                    <div className="text-xs text-gray-500">通勤1ヶ月</div>
                    <div className="font-bold text-blue-700 text-lg">{cand.price_1m.toLocaleString()}円</div>
                  </div>
                  <div className="text-center w-1/2">
                    <div className="text-xs text-gray-500">通勤6ヶ月</div>
                    <div className="font-bold text-blue-700 text-lg">{cand.price_6m.toLocaleString()}円</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}