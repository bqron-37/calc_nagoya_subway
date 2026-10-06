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
  detour_comparison?: DetourComparison;
};

type DetourStation = {
  station: string;
  on_base_route: boolean;
  from_station?: string;
  round_trip_cost?: number;
  visits_1m?: number;
  visits_6m?: number;
};

type DetourComparison = {
  diff_1m: number;
  diff_6m: number;
  stations: DetourStation[];
};

type StationRole = "base" | "detour";

type StationData = {
  [lineName: string]: string[];
};

type WizardStep = "fare" | "stations" | "mode" | "results";

// 路線ごとのテーマカラー
const LINE_COLORS: { [key: string]: string } = {
  "東山線": "border-amber-300 bg-amber-50 text-amber-950",
  "名城線": "border-violet-300 bg-violet-50 text-violet-950",
  "名港線": "border-indigo-200 bg-indigo-50 text-indigo-950",
  "鶴舞線": "border-sky-300 bg-sky-50 text-sky-950",
  "桜通線": "border-rose-300 bg-rose-50 text-rose-950",
  "上飯田線": "border-fuchsia-300 bg-fuchsia-50 text-fuchsia-950",
};

const LINE_ROUTE_COLORS: { [key: string]: string } = {
  "東山線": "#f2c94c",
  "名城線": "#9b6bd3",
  "名港線": "#7c83db",
  "鶴舞線": "#4aa3df",
  "桜通線": "#e65f6f",
  "上飯田線": "#d965b5",
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

const SEARCH_MODES = [
  { id: "fast", label: "高速", description: "短い候補を優先して素早く検索します。" },
  { id: "exhaustive", label: "網羅", description: "漏れを抑えて探します。駅が多いと時間がかかります。" },
] as const;

const STEP_LABELS: { id: WizardStep; label: string }[] = [
  { id: "fare", label: "種類" },
  { id: "stations", label: "駅" },
  { id: "mode", label: "方式" },
  { id: "results", label: "結果" },
];

const getConnectingLine = (stationData: StationData, station1: string, station2: string) => {
  for (const [lineName, stations] of Object.entries(stationData)) {
    if (stations.includes(station1) && stations.includes(station2)) {
      return lineName;
    }
  }
  return "";
};

export default function Home() {
  const [stationData, setStationData] = useState<StationData>({});
  const [selectedStops, setSelectedStops] = useState<string[]>([]);
  const [candidates, setCandidates] = useState<RouteCandidate[]>([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [warningMsg, setWarningMsg] = useState("");
  const [sortMode, setSortMode] = useState<"price" | "transfers">("price");
  const [isLoading, setIsLoading] = useState(false); // 計算中のローディング
  const [fareType, setFareType] = useState("commuter");
  const [searchMode, setSearchMode] = useState<"fast" | "exhaustive">("fast");
  const [currentStep, setCurrentStep] = useState<WizardStep>("fare");
  const [detourStops, setDetourStops] = useState<string[]>([]); // 寄り道駅（バイト先・店など）
  const [stationRole, setStationRole] = useState<StationRole>("base"); // 次に選ぶ駅の役割
  const [baseRoute, setBaseRoute] = useState<RouteCandidate | null>(null); // 遠回りしないルート
  const [expandedDiagramIndex, setExpandedDiagramIndex] = useState<number | null>(null); // プルダウン展開状態

  // 最初の駅データ取得用のローディング状態
  const [isStationLoading, setIsStationLoading] = useState(true);
  const [bootTime, setBootTime] = useState(0.0); // 起動待ち時間計測用
  const bootTimerRef = useRef<NodeJS.Timeout | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "/api";

  // 駅データ取得時の処理
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
  }, [apiUrl]);

  const toggleStation = (stationName: string) => {
    if (selectedStops.includes(stationName)) {
      setSelectedStops(selectedStops.filter((s) => s !== stationName));
      setDetourStops(detourStops.filter((s) => s !== stationName));
    } else {
      setSelectedStops([...selectedStops, stationName]);
      if (stationRole === "detour") setDetourStops([...detourStops, stationName]);
    }
  };

  const toggleStationRole = (stationName: string) => {
    if (detourStops.includes(stationName)) {
      setDetourStops(detourStops.filter((s) => s !== stationName));
    } else {
      setDetourStops([...detourStops, stationName]);
    }
  };

  const baseStopCount = selectedStops.filter((s) => !detourStops.includes(s)).length;

  const handleCalculate = async () => {
    setErrorMsg("");
    setWarningMsg("");
    setCandidates([]);
    setBaseRoute(null);
    
    const uniqueStops = Array.from(new Set(selectedStops));
    if (uniqueStops.length < 2) {
      setErrorMsg("異なる駅を2つ以上選んでください");
      return;
    }
    if (baseStopCount < 2) {
      setErrorMsg("家・大学などの必須駅を2つ以上選んでください");
      return;
    }

    setIsLoading(true);

    try {
      const params = new URLSearchParams();
      uniqueStops.forEach((st) => params.append("stops", st));
      params.append("type", fareType);
      params.append("mode", searchMode);
      detourStops.forEach((st) => params.append("detour", st));
      
      const res = await fetch(`${apiUrl}/calculate?${params.toString()}`);
      const responseText = await res.text();
      let data: {
        detail?: string;
        candidates?: RouteCandidate[];
        warning?: string | null;
        base_route?: RouteCandidate | null;
      } = {};
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch {
        throw new Error(res.ok ? "レスポンスの解析に失敗しました。" : "サーバーでエラーが発生しました。");
      }
      
      if (!res.ok) throw new Error(data.detail || "計算エラー");
      
      setCandidates(data.candidates || []);
      setWarningMsg(data.warning || "");
      setBaseRoute(data.base_route || null);
      setCurrentStep("results");
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "計算エラー");
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

  const currentStepIndex = STEP_LABELS.findIndex((step) => step.id === currentStep);
  const selectedFareLabel = FARE_TYPES.find((type) => type.id === fareType)?.label || "";
  const selectedSearchMode = SEARCH_MODES.find((mode) => mode.id === searchMode);

  const formatDiff = (diff: number) => `${diff > 0 ? "+" : ""}${diff.toLocaleString()}円`;

  const renderDetourComparison = (comparison: DetourComparison) => {
    const isFree = comparison.diff_1m <= 0 && comparison.diff_6m <= 0;
    // 乗り越しが必要な寄り道駅のうち、お得になるまでの回数が最大の駅（＝一番控えめな目安）
    const worstStation = comparison.stations
      .filter((st) => !st.on_base_route)
      .reduce<DetourStation | null>(
        (worst, st) =>
          !worst || (st.visits_1m ?? 0) > (worst.visits_1m ?? 0) || (st.visits_6m ?? 0) > (worst.visits_6m ?? 0)
            ? st
            : worst,
        null
      );

    return (
      <div className="mb-3 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-950">
        <div className="text-xs font-bold text-emerald-800">遠回りしないルートとの比較</div>
        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 font-bold">
          <span>1ヶ月: {formatDiff(comparison.diff_1m)}</span>
          <span>6ヶ月: {formatDiff(comparison.diff_6m)}</span>
        </div>
        {isFree ? (
          <p className="mt-2 font-bold">定期代が増えないので、寄り道駅を通すほうがお得です。</p>
        ) : !worstStation ? (
          <p className="mt-2 font-bold">寄り道駅はすべて遠回りしないルート上にあるため、遠回りする必要はありません。</p>
        ) : (
          <div className="mt-2 rounded-md bg-white/80 px-3 py-2">
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {[
                { label: "1ヶ月定期", visits: worstStation.visits_1m },
                { label: "6ヶ月定期", visits: worstStation.visits_6m },
              ].map((row) => (
                <span key={row.label}>
                  {row.label}なら
                  {row.visits ? (
                    <>
                      <span className="text-lg font-bold">月{row.visits}回</span>以上追加した駅で降りればお得
                    </>
                  ) : (
                    <span className="font-bold">差額なしで常にお得</span>
                  )}
                </span>
              ))}
            </div>
            <div className="mt-1 text-xs text-slate-600">
              回数が一番多くなる{worstStation.station}で計算（遠回りしない定期だと{worstStation.from_station}から乗り越し 往復
              {worstStation.round_trip_cost?.toLocaleString()}円）
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderRouteDiagram = (candidate: RouteCandidate) => (
    <div className="mb-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="grid gap-0">
        {candidate.full_path.map((station, index) => {
          const nextStation = candidate.full_path[index + 1];
          const lineName = nextStation ? getConnectingLine(stationData, station, nextStation) : "";
          const lineColor = LINE_ROUTE_COLORS[lineName] || "#94a3b8";
          const isSelectedStop = selectedStops.includes(station);
          const prevLine = index > 0 ? getConnectingLine(stationData, candidate.full_path[index - 1], station) : "";
          const isTransfer = index > 0 && lineName && prevLine && lineName !== prevLine;

          return (
            <div key={`${station}-${index}`} className="grid grid-cols-[32px_1fr] gap-x-3">
              <div className="relative flex flex-col items-center">
                <div
                  className={`z-10 grid h-7 w-7 place-items-center rounded-full border-2 bg-white text-[10px] font-bold ${
                    isSelectedStop ? "border-slate-800 text-slate-900" : "border-slate-300 text-slate-500"
                  }`}
                  style={{ boxShadow: `0 0 0 4px ${lineColor}22` }}
                >
                  {index + 1}
                </div>
                {nextStation && (
                  <div className="min-h-8 w-1.5 flex-1 rounded-full" style={{ backgroundColor: lineColor }}></div>
                )}
              </div>

              <div className={`pb-4 ${nextStation ? "" : "pb-0"}`}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-sm leading-6 ${isSelectedStop ? "font-bold text-slate-900" : "font-medium text-slate-600"}`}>
                    {station}
                  </span>
                  {isSelectedStop && (
                    <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-800">
                      選択駅
                    </span>
                  )}
                  {isTransfer && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                      乗換
                    </span>
                  )}
                </div>
                {nextStation && (
                  <div className="mt-1 flex items-center gap-2 text-[11px] font-bold text-slate-500">
                    <span className="h-1.5 w-6 rounded-full" style={{ backgroundColor: lineColor }}></span>
                    {lineName || "接続"}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // サーバー起動待ち画面（駅データ取得中だけ表示）
  if (isStationLoading) {
    return (
      <main className="min-h-screen bg-[#f7f8fb] flex flex-col items-center justify-center p-4 text-center">
        {bootTime > 3 ? (
          // 3秒以上かかっている場合（スリープ中）
          <div className="bg-white p-8 rounded-lg shadow-lg shadow-slate-200/70 max-w-md animate-fade-in flex flex-col items-center text-center mx-auto border border-slate-200">
            
            <h2 className="text-xl font-bold text-slate-900 mb-2">サーバーを起動しています</h2>
            
            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              <span className="font-bold text-rose-600 text-lg">1分程度</span><br/>
              お時間がかかる場合があります。<br/>
              そのままお待ちください...<br/>
              すごくすごくかかります...
            </p>
            {/* スピナー */}
            <div className="animate-spin h-10 w-10 border-4 border-sky-100 border-t-sky-600 rounded-full"></div>

          </div>
        ) : (
          // 3秒以内の場合（通常の読み込み）
          <div className="flex flex-col items-center">
            <div className="animate-spin h-10 w-10 border-4 border-sky-100 border-t-sky-600 rounded-full mb-4"></div>
            <p className="text-slate-600 font-bold">データを読み込んでいます...</p>
          </div>
        )}
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f6f7fb] font-sans text-slate-900">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-5 md:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-700">Nagoya Subway Pass</p>
            <h1 className="mt-2 text-2xl font-bold text-slate-950 md:text-3xl">地下鉄定期ルート検索</h1>
            <p className="mt-2 text-sm text-slate-600">質問に答えて、定期券ルートと料金候補を比較できます。</p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl space-y-6 px-4 py-5 md:px-8 md:py-8">
        <nav className="grid grid-cols-4 gap-2">
          {STEP_LABELS.map((step, index) => {
            const isActive = step.id === currentStep;
            const isPast = index < currentStepIndex;
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => setCurrentStep(step.id)}
                className={`rounded-lg border px-2 py-3 text-center text-xs font-bold transition ${
                  isActive
                    ? "border-sky-300 bg-sky-100 text-sky-900"
                    : isPast
                      ? "border-teal-200 bg-teal-50 text-teal-800"
                      : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                }`}
              >
                <span className="block text-[11px]">STEP {index + 1}</span>
                {step.label}
              </button>
            );
          })}
        </nav>

        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm shadow-slate-200/70">
          {currentStep === "fare" && (
            <div className="grid gap-6 p-5 md:p-7">
              <div>
                <p className="text-sm font-bold text-sky-700">STEP 1</p>
                <h2 className="mt-2 text-2xl font-bold text-slate-950">定期券の種類を選んでください</h2>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {FARE_TYPES.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setFareType(type.id)}
                    className={`rounded-lg border p-4 text-left text-sm font-bold transition ${
                      fareType === type.id
                        ? "border-sky-300 bg-sky-100 text-sky-900 shadow-sm"
                        : "border-slate-200 bg-white text-slate-700 hover:border-sky-200 hover:bg-sky-50"
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setCurrentStep("stations")}
                  className="rounded-md border border-sky-300 bg-sky-100 px-5 py-2.5 text-sm font-bold text-sky-900 transition hover:bg-sky-200"
                >
                  次へ
                </button>
              </div>
            </div>
          )}

          {currentStep === "stations" && (
            <div className="grid gap-5 p-5 md:p-7">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-sm font-bold text-sky-700">STEP 2</p>
                  <h2 className="mt-2 text-2xl font-bold text-slate-950">定期券に通したい駅を選択してください</h2>
                  <p className="mt-2 text-sm text-slate-500">家・大学などの必須駅を2つ以上選ぶと次へ進めます。</p>
                </div>
                {selectedStops.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedStops([]);
                      setDetourStops([]);
                    }}
                    className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-600 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700"
                  >
                    全て解除
                  </button>
                )}
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="text-sm font-bold text-slate-800">これから選ぶ駅の役割</div>
                <div className="mt-2 grid gap-2 md:grid-cols-2">
                  {([
                    { id: "base", label: "家・大学（必須）", description: "遠回りしないルートにも入れる駅" },
                    { id: "detour", label: "寄り道駅", description: "バイト先・店が多い駅など、遠回りして通したい駅" },
                  ] as const).map((role) => (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => setStationRole(role.id)}
                      className={`rounded-md border p-3 text-left transition ${
                        stationRole === role.id
                          ? role.id === "base"
                            ? "border-sky-300 bg-sky-100 text-sky-900 shadow-sm"
                            : "border-amber-300 bg-amber-100 text-amber-900 shadow-sm"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <span className="block text-sm font-bold">{role.label}</span>
                      <span className="mt-1 block text-xs font-medium opacity-80">{role.description}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex min-h-12 flex-wrap items-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3">
                {selectedStops.length === 0 && <span className="text-sm font-medium text-slate-400">駅を選択してください</span>}
                {selectedStops.map((stop) => (
                  <span key={stop} className="flex items-center gap-2 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm font-bold text-slate-800 shadow-sm">
                    <button
                      type="button"
                      onClick={() => toggleStationRole(stop)}
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        detourStops.includes(stop) ? "bg-amber-100 text-amber-800" : "bg-sky-100 text-sky-800"
                      }`}
                      title="クリックで役割を切り替え"
                    >
                      {detourStops.includes(stop) ? "寄り道" : "必須"}
                    </button>
                    {stop}
                    <button onClick={() => toggleStation(stop)} className="grid h-5 w-5 place-items-center rounded-full text-slate-400 transition hover:bg-rose-50 hover:text-rose-600" aria-label={`${stop}を解除`}>×</button>
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {Object.keys(stationData).map((lineName) => (
                  <div key={lineName} className={`rounded-lg border p-3 ${LINE_COLORS[lineName] || "bg-slate-50 border-slate-200"}`}>
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <h3 className="text-sm font-bold">{lineName}</h3>
                      <span className="rounded-full bg-white/80 px-2 py-0.5 text-[11px] font-bold text-slate-500">{stationData[lineName].length}駅</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {stationData[lineName].map((station) => {
                        const isSelected = selectedStops.includes(station);
                        const isDetour = detourStops.includes(station);
                        return (
                          <button
                            key={`${lineName}-${station}`}
                            onClick={() => toggleStation(station)}
                            className={`min-h-8 rounded-md border px-2.5 py-1 text-xs font-bold transition ${
                              isSelected
                                ? isDetour
                                  ? "border-amber-300 bg-amber-100 text-amber-900 shadow-sm"
                                  : "border-sky-300 bg-sky-100 text-sky-900 shadow-sm"
                                : "bg-white/90 text-slate-700 border-white/80 hover:border-sky-300 hover:bg-sky-50"
                            }`}
                          >
                            {station}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep("fare")}
                  className="rounded-md border border-slate-300 bg-white px-5 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
                >
                  戻る
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep("mode")}
                  disabled={baseStopCount < 2}
                  className={`rounded-md px-5 py-2.5 text-sm font-bold transition ${
                    baseStopCount < 2
                      ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                      : "border border-sky-300 bg-sky-100 text-sky-900 hover:bg-sky-200"
                  }`}
                >
                  次へ
                </button>
              </div>
            </div>
          )}

          {currentStep === "mode" && (
            <div className="grid gap-6 p-5 md:p-7">
              <div>
                <p className="text-sm font-bold text-sky-700">STEP 3</p>
                <h2 className="mt-2 text-2xl font-bold text-slate-950">検索方式を選んでください</h2>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {SEARCH_MODES.map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setSearchMode(mode.id)}
                    className={`rounded-lg border p-4 text-left transition ${
                      searchMode === mode.id
                        ? mode.id === "fast"
                          ? "border-sky-300 bg-sky-100 text-sky-900 shadow-sm"
                          : "border-amber-300 bg-amber-100 text-amber-900 shadow-sm"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span className="block text-base font-bold">{mode.label}</span>
                    <span className="mt-2 block text-sm font-medium opacity-80">{mode.description}</span>
                  </button>
                ))}
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                <div className="font-bold text-slate-800">選択内容</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="rounded-full bg-white px-2.5 py-1 font-bold">{selectedFareLabel}</span>
                  <span className="rounded-full bg-white px-2.5 py-1 font-bold">必須 {baseStopCount}駅</span>
                  {detourStops.length > 0 && (
                    <span className="rounded-full bg-white px-2.5 py-1 font-bold">寄り道 {detourStops.length}駅</span>
                  )}
                  <span className="rounded-full bg-white px-2.5 py-1 font-bold">{selectedSearchMode?.label}</span>
                </div>
              </div>

              {errorMsg && <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-center text-sm font-bold text-rose-700">{errorMsg}</div>}
              {warningMsg && <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-center text-sm font-bold text-amber-800">{warningMsg}</div>}

              <div className="flex justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep("stations")}
                  className="rounded-md border border-slate-300 bg-white px-5 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
                >
                  戻る
                </button>
                <button
                  type="button"
                  onClick={handleCalculate}
                  disabled={isLoading || baseStopCount < 2}
                  className={`flex min-w-36 items-center justify-center gap-2 rounded-md px-5 py-2.5 text-sm font-bold transition ${
                    isLoading || baseStopCount < 2
                      ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                      : "border border-sky-300 bg-sky-100 text-sky-900 hover:bg-sky-200"
                  }`}
                >
                  {isLoading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-sky-300 border-t-sky-800"></div>
                      検索中...
                    </>
                  ) : "検索する"}
                </button>
              </div>
            </div>
          )}

          {currentStep === "results" && (
            <div className="grid gap-5 p-5 md:p-7">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-bold text-sky-700">STEP 4</p>
                  <h2 className="mt-2 text-2xl font-bold text-slate-950">検索結果</h2>
                  <p className="mt-2 text-sm text-slate-500">料金・距離・乗換回数を比較できます。</p>
                </div>
                <div className="flex text-sm">
                  <button
                    onClick={() => setSortMode("price")}
                    className={`rounded-l-md border px-3 py-2 font-bold transition ${sortMode === "price" ? "border-sky-300 bg-sky-100 text-sky-900" : "border-slate-300 bg-white text-slate-600 hover:bg-sky-50"}`}
                  >
                    安い順
                  </button>
                  <button
                    onClick={() => setSortMode("transfers")}
                    className={`rounded-r-md border-y border-r px-3 py-2 font-bold transition ${sortMode === "transfers" ? "border-sky-300 bg-sky-100 text-sky-900" : "border-slate-300 bg-white text-slate-600 hover:bg-sky-50"}`}
                  >
                    乗換少ない順
                  </button>
                </div>
              </div>

              {warningMsg && <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-center text-sm font-bold text-amber-800">{warningMsg}</div>}
              {errorMsg && <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-center text-sm font-bold text-rose-700">{errorMsg}</div>}

              {baseRoute && (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs font-bold text-slate-500">遠回りしないルート（必須駅のみ・最短）</div>
                  <div className="mt-1 flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                    <div className="text-sm font-bold text-slate-800">{baseRoute.route_str}</div>
                    <div className="text-sm font-bold text-slate-800">
                      1ヶ月 {baseRoute.price_1m.toLocaleString()}円 / 6ヶ月 {baseRoute.price_6m.toLocaleString()}円
                    </div>
                  </div>
                  <div className="mt-1 text-xs font-bold text-slate-500">{baseRoute.distance}km / {baseRoute.zone}</div>
                </div>
              )}

              {sortedCandidates.length === 0 && !errorMsg && (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-center text-sm font-bold text-slate-500">
                  まだ検索結果がありません。
                </div>
              )}

              {sortedCandidates.map((cand, i) => (
                <article key={i} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/70 md:p-5">
                  {cand.exceeds_five_station_rule && (
                    <div className="mb-3 rounded-md border border-amber-200 bg-amber-50 p-2 text-xs font-bold text-amber-800">
                      [注意] 乗換駅・特定駅の合計が5駅を超えています（窓口確認推奨）
                    </div>
                  )}

                  <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <span className="mr-2 inline-block rounded-full bg-sky-100 px-2.5 py-1 text-xs font-bold text-sky-800">候補 {i + 1}</span>
                      <span className="text-sm font-bold text-slate-500">{cand.distance}km / {cand.zone} / 乗換 {cand.transfers}回</span>
                    </div>
                    <div className="text-left md:text-right">
                      <div className="text-2xl font-bold text-slate-950">{cand.price_1m.toLocaleString()}円<span className="ml-1 text-xs font-bold text-slate-500">1ヶ月</span></div>
                      <div className="text-xs font-bold text-slate-500">6ヶ月: {cand.price_6m.toLocaleString()}円</div>
                    </div>
                  </div>

                  <div className="mb-3 rounded-md border border-teal-200 bg-teal-50 px-3 py-2 text-sm font-bold leading-6 text-teal-950 md:text-base">{cand.route_str}</div>

                  {cand.detour_comparison && renderDetourComparison(cand.detour_comparison)}

                  <button
                    type="button"
                    onClick={() => setExpandedDiagramIndex(expandedDiagramIndex === i ? null : i)}
                    className="mb-3 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-left text-sm font-bold text-slate-700 transition hover:bg-slate-50 flex items-center justify-between"
                  >
                    <span>ルート図を表示</span>
                    <span className={`transition-transform ${expandedDiagramIndex === i ? "rotate-180" : ""}`}>▼</span>
                  </button>

                  {expandedDiagramIndex === i && renderRouteDiagram(cand)}

                  <div className="flex flex-wrap gap-2 text-xs font-bold text-slate-600">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1">乗換回数: {cand.transfers}回</span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1">距離: {cand.distance}km</span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1">区分: {cand.zone}</span>
                  </div>
                </article>
              ))}

              <div className="flex flex-wrap justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep("mode")}
                  className="rounded-md border border-slate-300 bg-white px-5 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
                >
                  条件を変更
                </button>
                <button
                  type="button"
                  onClick={handleCalculate}
                  disabled={isLoading}
                  className="rounded-md border border-sky-300 bg-sky-100 px-5 py-2.5 text-sm font-bold text-sky-900 transition hover:bg-sky-200 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
                >
                  再検索
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
