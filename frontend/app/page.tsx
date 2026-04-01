"use client";
import { useState, useEffect, useRef } from "react";
import { StationData, RouteCandidate } from "./types";
import Header from "./components/Header";
import StationSelector from "./components/StationSelector";
import FareTypeSelector from "./components/FareTypeSelector";
import ResultCard from "./components/ResultCard";
import LoadingScreen from "./components/LoadingScreen";
import { Search, AlertCircle } from 'lucide-react';

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
  const [isLoading, setIsLoading] = useState(false);
  const [fareType, setFareType] = useState("commuter");

  const [isStationLoading, setIsStationLoading] = useState(true);
  const [bootTime, setBootTime] = useState(0.0);
  const bootTimerRef = useRef<NodeJS.Timeout | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

  useEffect(() => {
    const startTime = Date.now();
    bootTimerRef.current = setInterval(() => {
      setBootTime((Date.now() - startTime) / 1000);
    }, 100);

    fetch(`${apiUrl}/stations`)
      .then((res) => res.json())
      .then((data) => {
        setStationData(data.stations);
        setIsStationLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setErrorMsg("サーバーに接続できませんでした。再読み込みしてください。");
        setIsStationLoading(false);
      })
      .finally(() => {
        if (bootTimerRef.current) clearInterval(bootTimerRef.current);
      });

    return () => {
      if (bootTimerRef.current) clearInterval(bootTimerRef.current);
    };
  }, [apiUrl]);

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

      // 計算完了したら自動で結果を見るためにリストモードにするか、
      // あるいはマップのままにするか。
      // ここではユーザーが自分で選べるようにそのままにする。
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

  const getLowestPrice = () => Math.min(...candidates.map(c => c.price_1m));
  const getMinTransfers = () => Math.min(...candidates.map(c => c.transfers));

  if (isStationLoading) {
    return <LoadingScreen bootTime={bootTime} errorMsg={isStationLoading ? "" : errorMsg} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-sans text-gray-800 dark:text-gray-100 pb-20 transition-colors duration-300">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">

        {/* コントロールエリア */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm dark:shadow-xl border border-gray-200 dark:border-gray-700 p-5 md:p-6 space-y-6 transition-colors duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FareTypeSelector
              fareTypes={FARE_TYPES}
              selectedType={fareType}
              onSelect={setFareType}
            />

            <div className="flex items-end">
              <button
                onClick={handleCalculate}
                disabled={isLoading || selectedStops.length < 2}
                className={`w-full py-3 rounded-xl font-bold text-white shadow-lg shadow-blue-500/30 dark:shadow-blue-500/20 transition-all flex justify-center items-center gap-2 transform active:scale-95
                  ${(isLoading || selectedStops.length < 2)
                    ? "bg-gray-300 dark:bg-gray-700 shadow-none cursor-not-allowed text-gray-500 dark:text-gray-500"
                    : "bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 dark:hover:from-blue-500 dark:hover:to-blue-400"
                  }
                `}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin h-5 w-5 border-2 border-white/30 border-t-white rounded-full"></div>
                    検索中...
                  </>
                ) : (
                  <>
                    <Search size={20} />
                    ルートを検索
                  </>
                )}
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="bg-red-50 dark:bg-red-900/50 text-red-600 dark:text-red-200 px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2 animate-in slide-in-from-top-2 border border-transparent dark:border-red-800">
              <AlertCircle size={18} />
              {errorMsg}
            </div>
          )}
        </div>


        {/* 駅選択エリア */}
        <div className="space-y-4">
          <div className="block animate-in fade-in slide-in-from-top-2">
            <StationSelector
              stationData={stationData}
              selectedStops={selectedStops}
              onToggleStation={toggleStation}
              onClearAll={() => setSelectedStops([])}
            />
          </div>
        </div>

        {/* 結果エリア */}
        {candidates.length > 0 && (
          <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-700 pb-4 transition-colors">
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                検索結果 <span className="text-blue-600 dark:text-blue-400 ml-1">{candidates.length}</span><span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-1">件</span>
              </h2>
              <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg self-start sm:self-auto border border-transparent dark:border-gray-700 transition-colors">
                <button
                  onClick={() => setSortMode("price")}
                  className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${sortMode === "price" ? "bg-white dark:bg-gray-700 text-blue-700 dark:text-blue-400 shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                    }`}
                >
                  安い順
                </button>
                <button
                  onClick={() => setSortMode("transfers")}
                  className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${sortMode === "transfers" ? "bg-white dark:bg-gray-700 text-blue-700 dark:text-blue-400 shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                    }`}
                >
                  乗換少ない順
                </button>
              </div>
            </div>

            <div className="space-y-6">
              {sortedCandidates.map((cand, i) => (
                <div key={i} className="flex flex-col">
                  {/* カード部分 */}
                  <div className="relative z-10">
                    <ResultCard
                      candidate={cand}
                      rank={i + 1}
                      isBestPrice={cand.price_1m === getLowestPrice()}
                      isLeastTransfers={cand.transfers === getMinTransfers()}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}