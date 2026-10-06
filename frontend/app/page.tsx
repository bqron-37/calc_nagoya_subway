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

// 路線カラー（駅の案内表示に合わせた色）
const LINE_COLORS: { [key: string]: string } = {
  "東山線": "#e8a200",
  "名城線": "#7e57a3",
  "名港線": "#7e57a3",
  "鶴舞線": "#0094d4",
  "桜通線": "#e5413a",
  "上飯田線": "#e2609b",
};

// 定期券の種類の定義
const FARE_TYPES = [
  { id: "commuter", label: "通勤" },
  { id: "university", label: "通学（大学生）" },
  { id: "high_school", label: "通学（高校・中学）" },
  { id: "elementary", label: "通学（小学生以下）" },
  { id: "disability", label: "割引通勤（身体障害者等）" },
  { id: "disability_stu", label: "割引通学（身体障害者等）" },
];

const SEARCH_MODES = [
  { id: "fast", label: "高速", description: "短い候補から順に探します。" },
  { id: "exhaustive", label: "網羅", description: "駅の並び順をすべて試します。駅が多いと時間がかかります。" },
] as const;

const PAGE_SIZE = 20;

const getConnectingLine = (stationData: StationData, station1: string, station2: string) => {
  for (const [lineName, stations] of Object.entries(stationData)) {
    if (stations.includes(station1) && stations.includes(station2)) {
      return lineName;
    }
  }
  return "";
};

const formatYen = (price: number) => `${price.toLocaleString()}円`;
const formatDiff = (diff: number) => `${diff > 0 ? "+" : ""}${diff.toLocaleString()}円`;

// 名港線は紫に白線の路線マーク
const LineMark = ({ lineName, className = "" }: { lineName: string; className?: string }) => (
  <span
    className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${className}`}
    style={{
      backgroundColor: LINE_COLORS[lineName] || "#a3a3a3",
      boxShadow: lineName === "名港線" ? "inset 0 0 0 2px #fff, 0 0 0 1px #7e57a3" : undefined,
    }}
    aria-hidden
  />
);

export default function Home() {
  const [stationData, setStationData] = useState<StationData>({});
  const [selectedStops, setSelectedStops] = useState<string[]>([]);
  const [candidates, setCandidates] = useState<RouteCandidate[]>([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [warningMsg, setWarningMsg] = useState("");
  const [sortMode, setSortMode] = useState<"price" | "transfers">("price");
  const [isLoading, setIsLoading] = useState(false); // 計算中のローディング
  const [hasSearched, setHasSearched] = useState(false);
  const [fareType, setFareType] = useState("commuter");
  const [searchMode, setSearchMode] = useState<"fast" | "exhaustive">("fast");
  const [detourStops, setDetourStops] = useState<string[]>([]); // 寄り道駅（バイト先・店など）
  const [stationRole, setStationRole] = useState<StationRole>("base"); // 次に選ぶ駅の役割
  const [baseRoute, setBaseRoute] = useState<RouteCandidate | null>(null); // 遠回りしないルート
  const [stationQuery, setStationQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [expandedDiagramIndex, setExpandedDiagramIndex] = useState<number | null>(null); // 全駅表示の展開状態
  const resultsRef = useRef<HTMLElement | null>(null);

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

  const clearStations = () => {
    setSelectedStops([]);
    setDetourStops([]);
  };

  const baseStops = selectedStops.filter((s) => !detourStops.includes(s));
  const baseStopCount = baseStops.length;

  // 駅 → 乗り入れている路線
  const stationLines: { [station: string]: string[] } = {};
  Object.entries(stationData).forEach(([lineName, stations]) => {
    stations.forEach((station) => {
      stationLines[station] = [...(stationLines[station] || []), lineName];
    });
  });

  const handleCalculate = async () => {
    setErrorMsg("");
    setWarningMsg("");
    setCandidates([]);
    setBaseRoute(null);
    setExpandedDiagramIndex(null);
    setVisibleCount(PAGE_SIZE);

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
    setHasSearched(true);
    // スマホでは条件の下に結果が来るので、結果の位置まで移動する
    if (window.innerWidth < 1024) {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }

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

  const selectedSearchMode = SEARCH_MODES.find((mode) => mode.id === searchMode);

  // 横向きの簡易ルート図：始点・終点・選択駅・乗換駅だけを並べ、間を路線カラーの線でつなぐ
  const renderRouteStrip = (path: string[]) => {
    const nodeIndexes = path
      .map((station, index) => {
        if (index === 0 || index === path.length - 1 || selectedStops.includes(station)) return index;
        const prevLine = getConnectingLine(stationData, path[index - 1], station);
        const nextLine = getConnectingLine(stationData, station, path[index + 1]);
        return prevLine !== nextLine ? index : -1;
      })
      .filter((index) => index >= 0);

    return (
      <ol className="flex flex-wrap items-center gap-y-2 text-sm">
        {nodeIndexes.map((pathIndex, i) => {
          const station = path[pathIndex];
          const nextIndex = nodeIndexes[i + 1];
          const lineName = nextIndex !== undefined ? getConnectingLine(stationData, station, path[pathIndex + 1]) : "";
          const between = nextIndex !== undefined ? nextIndex - pathIndex - 1 : 0;
          const isSelected = selectedStops.includes(station);
          return (
            <li key={`${station}-${pathIndex}`} className="flex items-center">
              <span className={isSelected ? "font-bold text-neutral-900" : "text-neutral-500"}>
                {station}
              </span>
              {nextIndex !== undefined && (
                <span className="mx-2 flex flex-col items-center" title={lineName}>
                  <span className="block h-1 w-10 rounded-full" style={{ backgroundColor: LINE_COLORS[lineName] || "#a3a3a3" }} />
                  <span className="mt-0.5 text-[10px] leading-none text-neutral-400">{between > 0 ? `${between}駅` : " "}</span>
                </span>
              )}
            </li>
          );
        })}
      </ol>
    );
  };

  const renderRouteDiagram = (path: string[]) => (
    <ol className="mt-3 border-l border-neutral-200 pl-4">
      {path.map((station, index) => {
        const nextStation = path[index + 1];
        const lineName = nextStation ? getConnectingLine(stationData, station, nextStation) : "";
        const prevLine = index > 0 ? getConnectingLine(stationData, path[index - 1], station) : "";
        const isTransfer = index > 0 && lineName && prevLine && lineName !== prevLine;
        const isSelected = selectedStops.includes(station);

        return (
          <li key={`${station}-${index}`} className="grid grid-cols-[12px_1fr] gap-x-3">
            <div className="flex flex-col items-center">
              <span className={`mt-1.5 h-3 w-3 rounded-full border-2 bg-white ${isSelected ? "border-neutral-900" : "border-neutral-300"}`} />
              {nextStation && <span className="w-1 flex-1" style={{ backgroundColor: LINE_COLORS[lineName] || "#a3a3a3" }} />}
            </div>
            <div className={nextStation ? "pb-3" : ""}>
              <span className={`text-sm ${isSelected ? "font-bold text-neutral-900" : "text-neutral-600"}`}>{station}</span>
              {isTransfer && <span className="ml-2 text-[11px] text-neutral-500">乗換</span>}
              {nextStation && <div className="text-[11px] text-neutral-400">{lineName}</div>}
            </div>
          </li>
        );
      })}
    </ol>
  );

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
      <div className="mt-3 border-l-2 border-neutral-900 pl-3 text-sm text-neutral-800">
        <div className="text-neutral-500">
          遠回りしないルートとの差額　1ヶ月 <span className="tabular-nums text-neutral-900">{formatDiff(comparison.diff_1m)}</span>
          　6ヶ月 <span className="tabular-nums text-neutral-900">{formatDiff(comparison.diff_6m)}</span>
        </div>
        {isFree ? (
          <p className="mt-1 font-bold">定期代が増えないので、寄り道駅を通すほうがお得です。</p>
        ) : !worstStation ? (
          <p className="mt-1 font-bold">寄り道駅はすべて遠回りしないルート上にあるため、遠回りする必要はありません。</p>
        ) : (
          <>
            {[
              { label: "1ヶ月定期", visits: worstStation.visits_1m },
              { label: "6ヶ月定期", visits: worstStation.visits_6m },
            ].map((row) => (
              <p key={row.label} className="mt-1">
                {row.label}なら
                {row.visits ? (
                  <>
                    <span className="mx-0.5 font-bold tabular-nums">月{row.visits}回</span>以上追加した駅で降りればお得
                  </>
                ) : (
                  <span className="font-bold">差額なしで常にお得</span>
                )}
              </p>
            ))}
            <p className="mt-1 text-xs text-neutral-500">
              回数が一番多くなる{worstStation.station}で計算（遠回りしない定期だと{worstStation.from_station}から乗り越し 往復
              {worstStation.round_trip_cost?.toLocaleString()}円）
            </p>
          </>
        )}
      </div>
    );
  };

  const renderStopChip = (stop: string) => (
    <li key={stop} className="flex items-center gap-1.5 rounded border border-neutral-300 bg-white py-1 pl-2 pr-1 text-sm">
      {(stationLines[stop] || []).map((lineName) => (
        <LineMark key={lineName} lineName={lineName} />
      ))}
      <span className="ml-0.5 font-bold">{stop}</span>
      <button
        type="button"
        onClick={() => toggleStationRole(stop)}
        className="ml-1 rounded px-1 text-[11px] text-neutral-500 underline-offset-2 hover:text-neutral-900 hover:underline"
        title={detourStops.includes(stop) ? "必須駅にする" : "寄り道駅にする"}
      >
        {detourStops.includes(stop) ? "必須へ" : "寄り道へ"}
      </button>
      <button
        type="button"
        onClick={() => toggleStation(stop)}
        className="grid h-6 w-6 place-items-center rounded text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900"
        aria-label={`${stop}を解除`}
      >
        ×
      </button>
    </li>
  );

  // サーバー起動待ち画面（駅データ取得中だけ表示）
  if (isStationLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white p-4 text-center text-neutral-900">
        <div className="max-w-sm">
          <div className="mx-auto mb-6 flex w-48 overflow-hidden rounded-full">
            {Object.values(LINE_COLORS).map((color, i) => (
              <span key={i} className="h-1 flex-1 animate-pulse" style={{ backgroundColor: color, animationDelay: `${i * 150}ms` }} />
            ))}
          </div>
          {bootTime > 3 ? (
            // 3秒以上かかっている場合（スリープ中）
            <>
              <h2 className="text-lg font-bold">サーバーを起動しています</h2>
              <p className="mt-3 text-sm leading-relaxed text-neutral-600">
                <span className="font-bold text-neutral-900">1分程度</span>お時間がかかる場合があります。<br />
                そのままお待ちください...<br />
                すごくすごくかかります...
              </p>
            </>
          ) : (
            // 3秒以内の場合（通常の読み込み）
            <p className="text-sm text-neutral-600">データを読み込んでいます...</p>
          )}
        </div>
      </main>
    );
  }

  const query = stationQuery.trim();
  const sectionLabel = "text-xs font-bold tracking-wider text-neutral-500";

  return (
    <main className="min-h-screen bg-white text-neutral-900">
      <header className="border-b border-neutral-200">
        <div className="mx-auto max-w-6xl px-4 py-5 md:px-8">
          <h1 className="text-xl font-bold md:text-2xl">名古屋市営地下鉄 定期ルート計算</h1>
          <p className="mt-1 text-sm text-neutral-500">通したい駅を選ぶと、一筆書きで通れる定期券のルートと料金を出します。</p>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-x-10 px-4 md:px-8 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
        {/* 条件 */}
        <section className="divide-y divide-neutral-200 py-2 lg:border-r lg:border-neutral-200 lg:pr-10">
          <div className="py-5">
            <label htmlFor="fare-type" className={sectionLabel}>定期券の種類</label>
            <select
              id="fare-type"
              value={fareType}
              onChange={(e) => setFareType(e.target.value)}
              className="mt-2 block w-full rounded border border-neutral-300 bg-white px-3 py-2 text-base focus:border-neutral-900 focus:outline-none sm:text-sm"
            >
              {FARE_TYPES.map((type) => (
                <option key={type.id} value={type.id}>{type.label}</option>
              ))}
            </select>
          </div>

          <div className="py-5">
            <div className="flex items-baseline justify-between">
              <h2 className={sectionLabel}>駅</h2>
              {selectedStops.length > 0 && (
                <button type="button" onClick={clearStations} className="text-xs text-neutral-500 hover:text-neutral-900 hover:underline">
                  すべて解除
                </button>
              )}
            </div>

            <dl className="mt-3 grid grid-cols-[4.5rem_1fr] gap-y-3 text-sm">
              <dt className="pt-1.5 text-neutral-500">必須</dt>
              <dd>
                {baseStops.length > 0 ? (
                  <ul className="flex flex-wrap gap-1.5">{baseStops.map(renderStopChip)}</ul>
                ) : (
                  <p className="pt-1.5 text-neutral-400">家・大学などの駅を2つ以上</p>
                )}
              </dd>
              <dt className="pt-1.5 text-neutral-500">寄り道</dt>
              <dd>
                {detourStops.length > 0 ? (
                  <ul className="flex flex-wrap gap-1.5">{detourStops.map(renderStopChip)}</ul>
                ) : (
                  <p className="pt-1.5 text-neutral-400">バイト先など（なくても可）</p>
                )}
              </dd>
            </dl>

            <div className="mt-5 flex items-center gap-3">
              <span className="text-xs text-neutral-500">追加先</span>
              <div className="inline-flex rounded border border-neutral-300 text-sm">
                {([
                  { id: "base", label: "必須" },
                  { id: "detour", label: "寄り道" },
                ] as const).map((role) => (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => setStationRole(role.id)}
                    className={`px-3 py-1 ${stationRole === role.id ? "bg-neutral-900 text-white" : "text-neutral-600 hover:bg-neutral-100"}`}
                  >
                    {role.label}
                  </button>
                ))}
              </div>
            </div>

            <input
              type="search"
              value={stationQuery}
              onChange={(e) => setStationQuery(e.target.value)}
              placeholder="駅名で絞り込み"
              className="mt-4 block w-full rounded border border-neutral-300 px-3 py-2 text-base placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none sm:text-sm"
            />

            <div className="mt-4 space-y-5">
              {Object.keys(stationData).map((lineName) => {
                const stations = stationData[lineName].filter((station) => !query || station.includes(query));
                if (stations.length === 0) return null;
                return (
                  <div key={lineName}>
                    <h3 className="flex items-center gap-2 text-sm font-bold">
                      <LineMark lineName={lineName} className="h-3 w-3" />
                      {lineName}
                    </h3>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {stations.map((station) => {
                        const isSelected = selectedStops.includes(station);
                        const isDetour = detourStops.includes(station);
                        return (
                          <button
                            key={`${lineName}-${station}`}
                            type="button"
                            onClick={() => toggleStation(station)}
                            aria-pressed={isSelected}
                            className={`rounded border px-2.5 py-1.5 text-sm transition-colors sm:px-2 sm:py-1 sm:text-[13px] ${
                              isSelected
                                ? isDetour
                                  ? "border-dashed border-neutral-900 bg-white font-bold text-neutral-900"
                                  : "border-neutral-900 bg-neutral-900 font-bold text-white"
                                : "border-neutral-200 text-neutral-700 hover:border-neutral-400"
                            }`}
                          >
                            {station}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="py-5">
            <h2 className={sectionLabel}>検索方式</h2>
            <div className="mt-2 inline-flex rounded border border-neutral-300 text-sm">
              {SEARCH_MODES.map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setSearchMode(mode.id)}
                  className={`px-4 py-1.5 ${searchMode === mode.id ? "bg-neutral-900 text-white" : "text-neutral-600 hover:bg-neutral-100"}`}
                >
                  {mode.label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-neutral-500">{selectedSearchMode?.description}</p>
          </div>

          <div className="sticky bottom-0 bg-white py-4 lg:static">
            <button
              type="button"
              onClick={handleCalculate}
              disabled={isLoading || baseStopCount < 2}
              className="w-full rounded bg-neutral-900 py-3 text-sm font-bold text-white transition-colors hover:bg-neutral-700 disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-400"
            >
              {isLoading ? "検索中..." : baseStopCount < 2 ? "必須駅をあと" + (2 - baseStopCount) + "つ選んでください" : "検索する"}
            </button>
          </div>
        </section>

        {/* 結果 */}
        <section ref={resultsRef} className="scroll-mt-4 border-t border-neutral-200 py-7 lg:border-t-0">
          {errorMsg && <p className="mb-4 border-l-2 border-red-600 pl-3 text-sm text-red-700">{errorMsg}</p>}
          {warningMsg && <p className="mb-4 border-l-2 border-amber-500 pl-3 text-sm text-neutral-700">{warningMsg}</p>}

          {isLoading && <p className="text-sm text-neutral-500">ルートを探しています...</p>}

          {!isLoading && !hasSearched && (
            <p className="text-sm leading-relaxed text-neutral-500">
              条件を選んで検索すると、ここに候補が出ます。
              <br />
              寄り道駅を入れると、遠回りしないルートとの比較も出ます。
            </p>
          )}

          {!isLoading && sortedCandidates.length > 0 && (
            <>
              <div className="flex items-baseline justify-between gap-4">
                <h2 className="text-sm text-neutral-500">
                  候補 <span className="text-lg font-bold text-neutral-900 tabular-nums">{sortedCandidates.length}</span> 件
                </h2>
                <div className="flex gap-3 text-sm">
                  {([
                    { id: "price", label: "安い順" },
                    { id: "transfers", label: "乗換が少ない順" },
                  ] as const).map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setSortMode(mode.id)}
                      className={sortMode === mode.id ? "font-bold text-neutral-900 underline underline-offset-4" : "text-neutral-500 hover:text-neutral-900"}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
              </div>

              {baseRoute && (
                <div className="mt-4 rounded border border-neutral-200 bg-neutral-50 px-4 py-3">
                  <div className="text-xs text-neutral-500">比較の基準：遠回りしないルート</div>
                  <div className="mt-2">{renderRouteStrip(baseRoute.full_path)}</div>
                  <div className="mt-2 text-sm tabular-nums text-neutral-600">
                    1ヶ月 <span className="font-bold text-neutral-900">{formatYen(baseRoute.price_1m)}</span>　6ヶ月 {formatYen(baseRoute.price_6m)}　{baseRoute.zone}・{baseRoute.distance}km
                  </div>
                </div>
              )}

              <ol className="mt-2 divide-y divide-neutral-200">
                {sortedCandidates.slice(0, visibleCount).map((cand, i) => (
                  <li key={cand.full_path.join("-")} className="py-5">
                    <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                      <span className="w-6 text-sm tabular-nums text-neutral-400">{i + 1}</span>
                      <span className="text-2xl font-bold tabular-nums">{formatYen(cand.price_1m)}</span>
                      <span className="text-sm text-neutral-500">1ヶ月</span>
                      <span className="text-sm tabular-nums text-neutral-500">6ヶ月 {formatYen(cand.price_6m)}</span>
                      <span className="text-sm tabular-nums text-neutral-500 sm:ml-auto">
                        {cand.zone}・{cand.distance}km・乗換{cand.transfers}回
                      </span>
                    </div>

                    <div className="mt-3 sm:pl-10">
                      {cand.exceeds_five_station_rule && (
                        <p className="mb-2 text-xs text-amber-700">乗換駅・特定駅の合計が5駅を超えるため、購入前に窓口で確認してください。</p>
                      )}
                      {renderRouteStrip(cand.full_path)}
                      {cand.detour_comparison && renderDetourComparison(cand.detour_comparison)}
                      <button
                        type="button"
                        onClick={() => setExpandedDiagramIndex(expandedDiagramIndex === i ? null : i)}
                        aria-expanded={expandedDiagramIndex === i}
                        className="mt-3 text-xs text-neutral-500 hover:text-neutral-900 hover:underline"
                      >
                        {expandedDiagramIndex === i ? "全駅を閉じる" : `全${cand.full_path.length}駅を表示`}
                      </button>
                      {expandedDiagramIndex === i && renderRouteDiagram(cand.full_path)}
                    </div>
                  </li>
                ))}
              </ol>

              {visibleCount < sortedCandidates.length && (
                <button
                  type="button"
                  onClick={() => setVisibleCount(visibleCount + PAGE_SIZE)}
                  className="mt-2 w-full rounded border border-neutral-300 py-2 text-sm text-neutral-600 hover:bg-neutral-50"
                >
                  さらに表示（残り{sortedCandidates.length - visibleCount}件）
                </button>
              )}
            </>
          )}
        </section>
      </div>

      <footer className="border-t border-neutral-200">
        <p className="mx-auto max-w-6xl px-4 py-6 text-xs leading-relaxed text-neutral-500 md:px-8">
          個人が作った非公式のツールです。名古屋市交通局とは関係ありません。定期券を買う前に、購入できるかと金額を窓口で確認してください。
        </p>
      </footer>
    </main>
  );
}
