// app/page.tsx
'use client';

import { useState } from 'react';
import { findRoutes, RouteResult } from './logic';
import { stations, connections } from './data';

// 路線の色と名前の定義（名古屋市営地下鉄カラー）
const LINE_STYLES: Record<string, { name: string; color: string; textColor: string }> = {
  higashiyama: { name: '東山線', color: 'bg-yellow-400', textColor: 'text-black' },
  meijo:       { name: '名城線', color: 'bg-purple-600', textColor: 'text-white' },
  meiko:       { name: '名港線', color: 'bg-purple-400', textColor: 'text-white' },
  tsurumai:    { name: '鶴舞線', color: 'bg-blue-500',   textColor: 'text-white' },
  sakura:      { name: '桜通線', color: 'bg-red-600',    textColor: 'text-white' },
  kamiiida:    { name: '上飯田線', color: 'bg-pink-400', textColor: 'text-white' },
};

export default function Home() {
  const [startId, setStartId] = useState('nagoya');
  const [goalId, setGoalId] = useState('kamimaezu'); // デフォルトを少し遠くに
  const [routes, setRoutes] = useState<RouteResult[]>([]);

  const stationList = Object.values(stations);

  const handleSearch = () => {
    if (startId === goalId) {
      alert("出発駅と到着駅には異なる駅を選んでください");
      return;
    }
    const results = findRoutes(startId, goalId);
    setRoutes(results);
  };

  // 2つの駅をつなぐ路線を探すヘルパー関数
  const getLineBetween = (fromId: string, toId: string) => {
    const conn = connections.find(
      c => c.from === fromId && c.to === toId
    );
    return conn ? conn.line : null;
  };

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-4 font-sans text-gray-800">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden">
        
        {/* ヘッダー部分 */}
        <div className="bg-blue-700 p-6 text-white text-center">
          <h1 className="text-3xl font-bold tracking-wider">Nagoya Subway Route</h1>
          <p className="opacity-80 text-sm mt-1">定期券ルートシミュレーター</p>
        </div>

        {/* 検索フォーム */}
        <div className="p-8 border-b">
          <div className="flex flex-col md:flex-row items-center justify-center gap-6">
            <div className="flex flex-col w-full">
              <label className="font-bold text-sm text-gray-500 mb-1 pl-1">出発 (Start)</label>
              <select 
                value={startId} 
                onChange={(e) => setStartId(e.target.value)}
                className="w-full p-3 bg-gray-100 rounded-lg font-bold text-lg border-2 border-transparent focus:border-blue-500 outline-none"
              >
                {stationList.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            <div className="text-gray-300 text-3xl transform rotate-90 md:rotate-0">⬇</div>

            <div className="flex flex-col w-full">
              <label className="font-bold text-sm text-gray-500 mb-1 pl-1">到着 (Goal)</label>
              <select 
                value={goalId} 
                onChange={(e) => setGoalId(e.target.value)}
                className="w-full p-3 bg-gray-100 rounded-lg font-bold text-lg border-2 border-transparent focus:border-blue-500 outline-none"
              >
                {stationList.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>

          <button 
            onClick={handleSearch}
            className="w-full mt-8 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg transition-transform transform active:scale-95 text-lg"
          >
            ルートを検索
          </button>
        </div>

        {/* 結果リスト */}
        <div className="p-8 bg-gray-50 min-h-[300px]">
          {routes.length > 0 ? (
            <>
              <h2 className="text-xl font-bold text-gray-700 mb-4 flex items-center">
                検索結果
                <span className="ml-3 bg-blue-100 text-blue-800 text-sm py-1 px-3 rounded-full">
                  {routes.length} パターン
                </span>
              </h2>
              <ul className="space-y-6">
                {routes.map((route, idx) => (
                  <li key={idx} className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition p-5">
                    
                    {/* ルート概要ヘッダー */}
                    <div className="flex justify-between items-end border-b pb-3 mb-4">
                      <div className="text-blue-900 font-bold text-lg">Route {idx + 1}</div>
                      <div className="text-right text-sm">
                        <span className="inline-block mr-4">
                          総距離: <strong className="text-lg">{route.totalDistance.toFixed(1)}</strong> km
                        </span>
                        <span className="inline-block">
                          乗換: <strong className="text-lg">{route.transferCount}</strong> 回
                        </span>
                      </div>
                    </div>

                    {/* 詳細経路のビジュアル表示 */}
                    <div className="flex flex-col gap-1">
                      {route.path.map((stationId, i) => {
                        // 最後の駅でなければ、次の駅との間の路線を表示する
                        if (i === route.path.length - 1) {
                          return (
                            <div key={i} className="flex items-center">
                              <div className="w-4 h-4 rounded-full bg-gray-800 border-2 border-white shadow-sm z-10"></div>
                              <span className="ml-3 font-bold text-lg">{stations[stationId].name}</span>
                              <span className="ml-2 text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">到着</span>
                            </div>
                          );
                        }

                        const nextStationId = route.path[i + 1];
                        const lineKey = getLineBetween(stationId, nextStationId);
                        const style = lineKey ? LINE_STYLES[lineKey] : { name: '徒歩', color: 'bg-gray-300', textColor: 'text-gray-700' };

                        return (
                          <div key={i} className="relative pl-1.5 pb-6 border-l-2 border-gray-200 last:border-0">
                            {/* 駅名 */}
                            <div className="flex items-center absolute -top-1 -left-[7px]">
                              <div className="w-3 h-3 rounded-full bg-white border-2 border-gray-400"></div>
                              <span className="ml-4 font-bold text-gray-800">{stations[stationId].name}</span>
                            </div>

                            {/* 路線のバッジ (駅と駅の間) */}
                            <div className="mt-6 ml-6">
                              <span className={`text-xs px-2 py-1 rounded-md font-bold shadow-sm ${style.color} ${style.textColor}`}>
                                ▼ {style.name}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                  </li>
                ))}
              </ul>
            </>
          ) : (
            <div className="text-center text-gray-400 py-10">
              <div className="text-6xl mb-4">🚇</div>
              <p>ルートを検索してください</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}