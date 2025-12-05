"use client";
import { useState, useEffect } from "react";

// 結果データの型定義
type RouteCandidate = {
  route_str: string;
  distance: number;
  zone: string;
  price_1m: number;
  price_6m: number;
};

export default function Home() {
  const [allStations, setAllStations] = useState<string[]>([]);
  // 選択された駅（順不同）
  const [selectedStops, setSelectedStops] = useState<string[]>(["", ""]);
  // 計算結果（候補のリスト）
  const [candidates, setCandidates] = useState<RouteCandidate[]>([]);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    fetch("http://127.0.0.1:8000/stations")
      .then((res) => res.json())
      .then((data) => {
        setAllStations(data.stations);
        if (data.stations.length >= 2) {
          // 初期値設定
          setSelectedStops([data.stations[0], data.stations[1]]);
        }
      })
      .catch((err) => console.error(err));
  }, []);

  const addStop = () => {
    const lastStop = selectedStops[selectedStops.length - 1] || allStations[0];
    setSelectedStops([...selectedStops, lastStop]);
  };

  const removeStop = (index: number) => {
    if (selectedStops.length <= 2) return;
    const newList = [...selectedStops];
    newList.splice(index, 1);
    setSelectedStops(newList);
  };

  const updateStop = (index: number, value: string) => {
    const newList = [...selectedStops];
    newList[index] = value;
    setSelectedStops(newList);
  };

  const handleCalculate = async () => {
    setErrorMsg("");
    setCandidates([]);

    // 重複を除去して空文字チェック
    const uniqueStops = Array.from(new Set(selectedStops.filter(s => s !== "")));

    if (uniqueStops.length < 2) {
      setErrorMsg("異なる駅を2つ以上選んでください");
      return;
    }

    try {
      const params = new URLSearchParams();
      uniqueStops.forEach((st) => params.append("stops", st));

      const res = await fetch(
        `http://127.0.0.1:8000/calculate?${params.toString()}`
      );
      
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "計算エラー");
      }
      
      setCandidates(data.candidates);
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* 入力エリア */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold mb-4 text-center text-blue-600">
            🚇 定期ルート提案
          </h1>
          <p className="text-sm text-gray-500 mb-6 text-center">
            定期券に含めたい駅を選んでください。<br/>
            一筆書き可能な全ルートを探索します。
          </p>

          <div className="space-y-3">
            {selectedStops.map((stop, index) => (
              <div key={index} className="flex gap-2 items-center">
                <span className="text-gray-400 font-bold w-6 text-center">{index + 1}</span>
                <select
                  className="flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                  value={stop}
                  onChange={(e) => updateStop(index, e.target.value)}
                >
                  {allStations.map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
                {selectedStops.length > 2 && (
                  <button
                    onClick={() => removeStop(index)}
                    className="text-red-400 hover:text-red-600 p-2"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-col gap-3">
            <button
              onClick={addStop}
              className="text-blue-600 border border-blue-600 py-2 rounded-lg hover:bg-blue-50 transition text-sm font-bold"
            >
              + 駅を追加
            </button>
            <button
              onClick={handleCalculate}
              className="bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition shadow-md"
            >
              ルート候補を探す
            </button>
          </div>
          
          {errorMsg && (
            <div className="mt-4 p-3 bg-red-100 text-red-700 rounded text-sm text-center">
              {errorMsg}
            </div>
          )}
        </div>

        {/* 結果エリア */}
        {candidates.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-700 ml-2">提案されたルート ({candidates.length}件)</h2>
            {candidates.map((cand, i) => (
              <div key={i} className="bg-white p-5 rounded-lg shadow-md border-l-4 border-blue-500 animate-fade-in">
                <div className="mb-3">
                  <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded mr-2">
                    候補 {i + 1}
                  </span>
                  <span className="text-gray-500 text-sm">距離: {cand.distance} km ({cand.zone})</span>
                </div>
                
                <div className="text-lg font-bold text-gray-800 mb-4 break-words">
                  {cand.route_str}
                </div>

                <div className="flex justify-between items-center bg-gray-50 p-3 rounded">
                  <div className="text-center">
                    <div className="text-xs text-gray-500">通勤1ヶ月</div>
                    <div className="font-bold text-blue-700">{cand.price_1m.toLocaleString()}円</div>
                  </div>
                  <div className="text-gray-300">|</div>
                  <div className="text-center">
                    <div className="text-xs text-gray-500">通勤6ヶ月</div>
                    <div className="font-bold text-blue-700">{cand.price_6m.toLocaleString()}円</div>
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