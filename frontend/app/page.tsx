"use client";
import { useState, useEffect, useRef } from "react";

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

// 路線ごとのテーマカラー
const LINE_COLORS: { [key: string]: string } = {
  "東山線": "bg-yellow-100 border-yellow-300 text-yellow-900",
  "名城線": "bg-purple-100 border-purple-300 text-purple-900",
  "名港線": "bg-purple-50 border-purple-200 text-purple-800",
  "鶴舞線": "bg-blue-100 border-blue-300 text-blue-900",
  "桜通線": "bg-red-100 border-red-300 text-red-900",
  "上飯田線": "bg-pink-100 border-pink-300 text-pink-900",
};

// 定期券の種類の定義
const FARE_TYPES = [
  { id: "commuter", label: "通勤定期（一般）" },
  { id: "university", label: "学生定期（大学生）" },
  { id: "high_school", label: "学生定期（高校・中学）" },
  { id: "elementary", label: "学生定期（小学生以下）" },
  { id: "disability", label: "割引通勤（身体障害者等）" },
  { id: "disability_stu", label: "割引学生（身体障害者等）" },
];

export default function Home() {
  const [stationData, setStationData] = useState<StationData>({});
  const [selectedStops, setSelectedStops] = useState<string[]>([]);
  const [candidates, setCandidates] = useState<RouteCandidate[]>([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [sortMode, setSortMode] = useState<"price" | "transfers">("price");
  const [isLoading, setIsLoading] = useState(false); // 計算中のローディング
  const [fareType, setFareType] = useState("commuter");

  // ★追加: 最初の駅データ取得用のローディング状態
  const [isStationLoading, setIsStationLoading] = useState(true);
  const [bootTime, setBootTime] = useState(0.0); // 起動待ち時間計測用
  const bootTimerRef = useRef<NodeJS.Timeout | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

  // ★修正: 駅データ取得時の処理
  useEffect(() => {
    // タイマースタート
    const startTime = Date.now();
    bootTimerRef.current = setInterval(() => {
      setBootTime((Date.now() - startTime) / 1000);
    }, 100);

    fetch(`${apiUrl}/stations`)
      .then((res) => res.json())
      .then((data) => {
        setStationData(data.stations);
        setIsStationLoading(false); // 読み込み完了
      })
      .catch((err) => {
        console.error(err);
        setErrorMsg("サーバーに接続できませんでした。再読み込みしてください。");
        setIsStationLoading(false);
      })
      .finally(() => {
        // タイマーストップ
        if (bootTimerRef.current) clearInterval(bootTimerRef.current);
      });

    return () => {
      if (bootTimerRef.current) clearInterval(bootTimerRef.current);
    };
  }, []);

  const toggleStation = (stationName: string) => {
    if (selectedStops.includes(stationName)) {
      setSelectedStops(selectedStops.filter((s) => s !== stationName));
    } else {
      setSelectedStops([...selectedStops, stationName]);
    }
  };

  const handleCalculate = async () => {
    setErrorMsg("");
    setCandidates([]);
    
    const uniqueStops = Array.from(new Set(selectedStops));
    if (uniqueStops.length < 2) {
      setErrorMsg("異なる駅を2つ以上選んでください");
      return;
    }

    setIsLoading(true);

    try {
      const params = new URLSearchParams();
      uniqueStops.forEach((st) => params.append("stops", st));
      params.append("type", fareType);
      
      const res = await fetch(`${apiUrl}/calculate?${params.toString()}`);
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

  // ★追加: サーバー起動待ち画面（駅データ取得中だけ表示）
  if (isStationLoading) {
    return (
      <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 text-center">
        {bootTime > 3 ? (
          // 3秒以上かかっている場合（スリープ中）
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-md animate-fade-in">
            <div className="text-5xl mb-4 animate-bounce">😴 ➡ 😲</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">サーバーを起動しています...</h2>
            <p className="text-sm text-gray-600 mb-4 leading-relaxed">
              無料サーバーを使用しているため、スリープ状態からの復帰に<br/>
              <span className="font-bold text-red-500 text-lg">30秒〜1分程度</span><br/>
              お時間がかかる場合があります。
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2 overflow-hidden">
              <div className="bg-blue-500 h-2 rounded-full animate-pulse w-full"></div>
            </div>
            <p className="text-xs text-gray-400 font-mono">経過時間: {bootTime.toFixed(1)}秒</p>
          </div>
        ) : (
          // 3秒以内の場合（通常の読み込み）
          <div className="flex flex-col items-center">
            <div className="animate-spin h-10 w-10 border-4 border-blue-200 border-t-blue-600 rounded-full mb-4"></div>
            <p className="text-gray-600 font-bold">データを読み込んでいます...</p>
          </div>
        )}
      </main>
    );
  }

  // === ここから下は通常のメイン画面 ===
  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans text-gray-800">
      <div className="max-w-5xl mx-auto space-y-6">
        
        <div className="bg-white p-6 rounded shadow border border-gray-200">
          <h1 className="text-xl font-bold mb-4 text-gray-700">🚇 地下鉄定期ルート検索</h1>
          
          {/* 選択状況 */}
          <div className="mb-6 p-4 bg-gray-100 rounded border border-gray-300">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-sm font-bold text-gray-600">選択中の駅 ({selectedStops.length})</h2>
              {selectedStops.length > 0 && (
                <button onClick={() => setSelectedStops([])} className="text-xs text-blue-600 hover:underline">
                  全て解除
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2 min-h-[30px]">
              {selectedStops.length === 0 && <span className="text-gray-400 text-sm">駅を選択してください</span>}
              {selectedStops.map((stop) => (
                <span key={stop} className="bg-white border border-gray-300 text-gray-800 px-2 py-1 rounded text-sm flex items-center gap-2">
                  {stop}
                  <button onClick={() => toggleStation(stop)} className="text-gray-400 hover:text-red-500 font-bold">×</button>
                </span>
              ))}
            </div>
          </div>

          {/* 計算エリア */}
          <div className="mb-8 flex flex-col md:flex-row justify-center items-center gap-4">
            
            <select
              value={fareType}
              onChange={(e) => setFareType(e.target.value)}
              className="w-full md:w-auto p-2 border border-gray-300 rounded font-medium bg-white focus:ring-2 focus:ring-blue-500 outline-none"
            >
              {FARE_TYPES.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.label}
                </option>
              ))}
            </select>

            <button 
              onClick={handleCalculate} 
              disabled={isLoading || selectedStops.length < 2}
              className={`w-full md:w-1/3 py-2 rounded font-bold shadow-sm transition flex justify-center items-center gap-2
                ${(isLoading || selectedStops.length < 2) 
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed" 
                  : "bg-blue-600 text-white hover:bg-blue-700"
                }
              `}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  検索中...
                </>
              ) : "ルートを検索"}
            </button>
          </div>
          {errorMsg && <div className="mt-2 text-center text-red-600 font-bold text-sm">{errorMsg}</div>}

          {/* 駅一覧 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.keys(stationData).map((lineName) => (
              <div key={lineName} className={`p-3 rounded border ${LINE_COLORS[lineName] || "bg-gray-50 border-gray-200"}`}>
                <h3 className="font-bold text-sm mb-2">{lineName}</h3>
                <div className="flex flex-wrap gap-1">
                  {stationData[lineName].map((station) => {
                    const isSelected = selectedStops.includes(station);
                    return (
                      <button
                        key={`${lineName}-${station}`}
                        onClick={() => toggleStation(station)}
                        className={`
                          px-2 py-1 rounded text-xs border transition
                          ${isSelected 
                            ? "bg-blue-600 text-white border-blue-600 font-bold" 
                            : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
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

        {/* 結果表示 */}
        {candidates.length > 0 && (
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h2 className="text-lg font-bold text-gray-700">検索結果: {candidates.length}件</h2>
              <div className="text-sm">
                <button
                  onClick={() => setSortMode("price")}
                  className={`px-3 py-1 border rounded-l ${sortMode === "price" ? "bg-gray-200 font-bold" : "bg-white hover:bg-gray-50"}`}
                >
                  安い順
                </button>
                <button
                  onClick={() => setSortMode("transfers")}
                  className={`px-3 py-1 border-t border-b border-r rounded-r ${sortMode === "transfers" ? "bg-gray-200 font-bold" : "bg-white hover:bg-gray-50"}`}
                >
                  乗換少ない順
                </button>
              </div>
            </div>

            {sortedCandidates.map((cand, i) => (
              <div key={i} className="bg-white p-4 rounded shadow-sm border border-gray-200">
                {cand.exceeds_five_station_rule && (
                  <div className="mb-2 bg-yellow-50 text-yellow-800 p-2 rounded text-xs border border-yellow-200">
                    ⚠️ <strong>注意:</strong> 乗換駅・特定駅の合計が5駅を超えています（窓口確認推奨）
                  </div>
                )}

                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded font-bold mr-2">候補 {i + 1}</span>
                    <span className="text-sm text-gray-500">{cand.distance}km / {cand.zone}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-blue-700">{cand.price_1m.toLocaleString()}円<span className="text-xs text-gray-500 font-normal"> (1ヶ月)</span></div>
                    <div className="text-xs text-gray-500">6ヶ月: {cand.price_6m.toLocaleString()}円</div>
                  </div>
                </div>
                
                <div className="text-base font-bold text-gray-800 mb-2">{cand.route_str}</div>

                <div className="bg-gray-50 p-2 rounded border border-gray-100 text-xs text-gray-600 mb-2">
                  <span className="font-bold">詳細ルート: </span>
                  {cand.full_path.join(" → ")}
                </div>

                <div className="text-xs font-bold text-gray-600">
                  乗換回数: {cand.transfers}回
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}