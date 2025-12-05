// app/logic.ts
import { stations, connections, Station, Connection } from './data';

// 探索結果の型
export type RouteResult = {
  path: string[];       // 駅IDのリスト
  totalDistance: number;
  transferCount: number;
  isValid: boolean;     // ルール適合か
  reason?: string;      // エラー理由
};

export function findRoutes(startId: string, goalId: string): RouteResult[] {
  const results: RouteResult[] = [];

  // 再帰関数（今いる駅、通ってきた経路、現在の距離、前回の路線、乗換回数）
  function dfs(
    currentId: string,
    path: string[],
    currentDist: number,
    lastLine: string | null,
    transfers: number
  ) {
    // 1. ゴールに到達したら記録して終了
    if (currentId === goalId) {
      // 最後のチェック：判別駅数ルールなど
      if (checkComplexRule(path, transfers)) {
        results.push({ path: [...path], totalDistance: currentDist, transferCount: transfers, isValid: true });
      }
      return;
    }

    // 2. 次に行ける駅を探す
    const nextSteps = connections.filter(c => c.from === currentId);

    for (const step of nextSteps) {
      // 【一筆書きルール】既に来た道（pathに含まれている駅）には戻らない
      if (path.includes(step.to)) continue;

      // 【乗換判定】路線が変わるならカウントアップ
      const isTransfer = lastLine !== null && lastLine !== step.line;
      const newTransfers = isTransfer ? transfers + 1 : transfers;

      // 【乗換回数ルール】3回を超えたらその先は探さない
      if (newTransfers > 3) continue;

      // 次の駅へ進む（再帰呼び出し）
      dfs(step.to, [...path, step.to], currentDist + step.distance, step.line, newTransfers);
    }
  }

  // 探索開始
  dfs(startId, [startId], 0, null, 0);
  return results;
}

// 複雑なルール判定（乗換駅 + 判別駅 > 5 のチェック）
function checkComplexRule(path: string[], transferCount: number): boolean {
  // 経路に含まれる「判別駅（isSpecial）」の数を数える
  let specialCount = 0;
  path.forEach(id => {
    if (stations[id].isSpecial) specialCount++;
  });

  // ルール：乗換回数 + 判別駅数 > 5 の場合はNG（今回は仮にNGとせずログだけ出すなど調整可）
  const totalComplexity = transferCount + specialCount;
  
  // 厳密なルール適用ならここで false を返す
  return totalComplexity <= 5; 
}