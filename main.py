from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import heapq
import itertools # 順列作成用に追加
from dataclasses import dataclass
from typing import Optional, List, Dict
import collections

# === 1. 料金テーブル定義 ===
@dataclass
class PriceTable:
    zone_name: str
    max_km: float
    price_1m: int
    price_6m: int

class SubwayFareCalculator:
    def __init__(self):
        self.fare_rules = [
            PriceTable("1区",  3.0,  5030, 27170),
            PriceTable("2区",  7.0,  5500, 29700),
            PriceTable("3区", 11.0,  5880, 31760),
            PriceTable("4区", 15.0,  6200, 33480),
            PriceTable("5区", float('inf'), 6440, 34780)
        ]

    def get_fare(self, distance_km: float):
        dist_rounded = round(distance_km, 1)
        for rule in self.fare_rules:
            if dist_rounded <= rule.max_km:
                return rule
        return None

# === 2. ネットワーク定義と経路探索 ===
class SubwayNetwork:
    def __init__(self):
        self.graph = {}

    def add_edge(self, station1, station2, dist):
        if station1 not in self.graph: self.graph[station1] = {}
        if station2 not in self.graph: self.graph[station2] = {}
        self.graph[station1][station2] = dist
        self.graph[station2][station1] = dist

    def build_nagoya_subway(self):
        # データは以前と同じ（省略せずに貼り付けてください）
        # --- 東山線 ---
        self.add_edge("高畑", "八田", 0.9)
        self.add_edge("八田", "岩塚", 1.1)
        self.add_edge("岩塚", "中村公園", 1.1)
        self.add_edge("中村公園", "中村日赤", 0.8)
        self.add_edge("中村日赤", "本陣", 0.7)
        self.add_edge("本陣", "亀島", 0.9)
        self.add_edge("亀島", "名古屋", 1.1)
        self.add_edge("名古屋", "伏見", 1.4)
        self.add_edge("伏見", "栄", 1.0)
        self.add_edge("栄", "新栄町", 1.1)
        self.add_edge("新栄町", "千種", 0.9)
        self.add_edge("千種", "今池", 0.7)
        self.add_edge("今池", "池下", 0.9)
        self.add_edge("池下", "覚王山", 0.6)
        self.add_edge("覚王山", "本山", 1.0)
        self.add_edge("本山", "東山公園", 0.9)
        self.add_edge("東山公園", "星ヶ丘", 1.1)
        self.add_edge("星ヶ丘", "一社", 1.3)
        self.add_edge("一社", "上社", 1.1)
        self.add_edge("上社", "本郷", 0.7)
        self.add_edge("本郷", "藤が丘", 1.3)
        # --- 桜通線 ---
        self.add_edge("中村区役所", "名古屋", 0.9)
        self.add_edge("名古屋", "国際センター", 0.7)
        self.add_edge("国際センター", "丸の内", 0.8)
        self.add_edge("丸の内", "久屋大通", 0.9)
        self.add_edge("久屋大通", "高岳", 0.7)
        self.add_edge("高岳", "車道", 1.3)
        self.add_edge("車道", "今池", 1.0)
        self.add_edge("今池", "吹上", 1.1)
        self.add_edge("吹上", "御器所", 1.0)
        self.add_edge("御器所", "桜山", 1.1)
        self.add_edge("桜山", "瑞穂区役所", 0.9)
        self.add_edge("瑞穂区役所", "瑞穂運動場西", 0.7)
        self.add_edge("瑞穂運動場西", "新瑞橋", 0.7)
        self.add_edge("新瑞橋", "桜本町", 1.1)
        self.add_edge("桜本町", "鶴里", 0.9)
        self.add_edge("鶴里", "野並", 1.1)
        self.add_edge("野並", "鳴子北", 1.1)
        self.add_edge("鳴子北", "相生山", 0.9)
        self.add_edge("相生山", "神沢", 1.4)
        self.add_edge("神沢", "徳重", 0.8)
        # --- 名城線 ---
        self.add_edge("金山", "東別院", 0.7)
        self.add_edge("東別院", "上前津", 0.9)
        self.add_edge("上前津", "矢場町", 0.7)
        self.add_edge("矢場町", "栄", 0.7)
        self.add_edge("栄", "久屋大通", 0.4)
        self.add_edge("久屋大通", "市役所", 0.9)
        self.add_edge("市役所", "名城公園", 1.1)
        self.add_edge("名城公園", "黒川", 1.0)
        self.add_edge("黒川", "志賀本通", 1.0)
        self.add_edge("志賀本通", "平安通", 0.8)
        self.add_edge("平安通", "大曽根", 0.7)
        self.add_edge("大曽根", "ナゴヤドーム前矢田", 0.8)
        self.add_edge("ナゴヤドーム前矢田", "砂田橋", 0.9)
        self.add_edge("砂田橋", "茶屋ヶ坂", 0.9)
        self.add_edge("茶屋ヶ坂", "自由ヶ丘", 1.2)
        self.add_edge("自由ヶ丘", "本山", 1.4)
        self.add_edge("本山", "名古屋大学", 1.0)
        self.add_edge("名古屋大学", "八事日赤", 1.1)
        self.add_edge("八事日赤", "八事", 1.0)
        self.add_edge("八事", "総合リハビリセンター", 1.3)
        self.add_edge("総合リハビリセンター", "瑞穂運動場東", 1.0)
        self.add_edge("瑞穂運動場東", "新瑞橋", 1.2)
        self.add_edge("新瑞橋", "妙音通", 0.7)
        self.add_edge("妙音通", "堀田", 0.8)
        self.add_edge("堀田", "伝馬町", 1.2)
        self.add_edge("伝馬町", "神宮西", 1.0)
        self.add_edge("神宮西", "西高蔵", 0.9)
        self.add_edge("西高蔵", "金山", 1.1)
        # --- 名港線 ---
        self.add_edge("金山", "日比野", 1.5)
        self.add_edge("日比野", "六番町", 1.1)
        self.add_edge("六番町", "東海通", 1.2)
        self.add_edge("東海通", "港区役所", 0.8)
        self.add_edge("港区役所", "築地口", 0.8)
        self.add_edge("築地口", "名古屋港", 0.6)
        # --- 鶴舞線 ---
        self.add_edge("上小田井", "庄内緑地公園", 1.4)
        self.add_edge("庄内緑地公園", "庄内通", 1.3)
        self.add_edge("庄内通", "浄心", 1.4)
        self.add_edge("浄心", "浅間町", 0.8)
        self.add_edge("浅間町", "丸の内", 1.4)
        self.add_edge("丸の内", "伏見", 0.7)
        self.add_edge("伏見", "大須観音", 0.8)
        self.add_edge("大須観音", "上前津", 1.0)
        self.add_edge("上前津", "鶴舞", 0.9)
        self.add_edge("鶴舞", "荒畑", 1.3)
        self.add_edge("荒畑", "御器所", 0.9)
        self.add_edge("御器所", "川名", 1.2)
        self.add_edge("川名", "いりなか", 1.0)
        self.add_edge("いりなか", "八事", 0.9)
        self.add_edge("八事", "塩釜口", 1.4)
        self.add_edge("塩釜口", "植田", 1.2)
        self.add_edge("植田", "原", 0.8)
        self.add_edge("原", "平針", 0.9)
        self.add_edge("平針", "赤池", 1.1)
        # --- 上飯田線 ---
        self.add_edge("上飯田", "平安通", 0.8)

    def find_route(self, start, goal):
        if start not in self.graph or goal not in self.graph:
            return None, None, f"駅名が見つかりません"
        
        queue = [(0.0, start)]
        distances = {node: float('inf') for node in self.graph}
        distances[start] = 0.0
        predecessors = {node: None for node in self.graph}
        
        while queue:
            current_dist, current_node = heapq.heappop(queue)
            
            if current_node == goal:
                path = []
                step = goal
                while step is not None:
                    path.append(step)
                    step = predecessors[step]
                path.reverse()
                return current_dist, path, None
            
            if current_dist > distances[current_node]:
                continue
            
            for neighbor, weight in self.graph[current_node].items():
                distance = round(current_dist + weight, 2)
                if distance < distances[neighbor]:
                    distances[neighbor] = distance
                    predecessors[neighbor] = current_node
                    heapq.heappush(queue, (distance, neighbor))
        
        return None, None, "経路が見つかりません"

# === 3. Web API設定 ===
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

nw = SubwayNetwork()
nw.build_nagoya_subway()
calc = SubwayFareCalculator()

@app.get("/stations")
def get_stations():
    return {"stations": list(nw.graph.keys())}

@app.get("/calculate")
def calculate_fare(stops: List[str] = Query(...)):
    # 2個未満なら計算できない
    if len(stops) < 2:
        raise HTTPException(status_code=400, detail="駅を2つ以上指定してください。")
    
    # 重複して同じ駅が選ばれていたら削除してユニークにする
    unique_stops = list(set(stops))
    if len(unique_stops) < 2:
        raise HTTPException(status_code=400, detail="異なる駅を2つ以上指定してください。")

    # 結果を格納するリスト
    valid_candidates = []

    # itertools.permutations で「全ての並び順」を生成して試す
    # 例: [A, B] -> (A, B), (B, A)
    # 例: [A, B, C] -> (A, B, C), (A, C, B), (B, A, C)...
    for perm in itertools.permutations(unique_stops):
        
        # この並び順でのルート計算を試みる
        current_perm_list = list(perm)
        total_dist = 0.0
        full_path_stations = []
        is_possible = True
        error_msg = ""

        # 各区間をつなげる
        for i in range(len(current_perm_list) - 1):
            s_start = current_perm_list[i]
            s_end = current_perm_list[i+1]
            
            dist, path, error = nw.find_route(s_start, s_end)
            if error:
                is_possible = False
                error_msg = error
                break
            
            total_dist += dist
            
            # パスの結合処理
            if i == 0:
                full_path_stations.extend(path)
            else:
                full_path_stations.extend(path[1:])

        if not is_possible:
            continue

        # 一筆書きチェック（全駅リストに重複がないか）
        if len(full_path_stations) != len(set(full_path_stations)):
            # 重複があるルートは無効
            continue

        # 料金計算
        fare = calc.get_fare(total_dist)
        if not fare:
            continue

        # 重複チェック2: 同じルート（逆順などではなく、全く同じ経路）が既に候補にあるか確認
        # (A->B->C と A->B->C が重複しないように。順列なので基本大丈夫だが念のため)
        
        route_str = " → ".join(current_perm_list)
        
        valid_candidates.append({
            "route_points": current_perm_list,
            "route_str": route_str,
            "distance": round(total_dist, 2),
            "zone": fare.zone_name,
            "price_1m": fare.price_1m,
            "price_6m": fare.price_6m,
            # 詳細表示したい場合のために全パスも入れておく
            "full_path": full_path_stations 
        })

    # 結果が一つも見つからなかった場合
    if not valid_candidates:
        raise HTTPException(status_code=400, detail="指定された駅を通る有効な一筆書きルートが見つかりませんでした。")

    # 距離が短い順（≒安い順）にソートして返す
    valid_candidates.sort(key=lambda x: x["distance"])

    return {"candidates": valid_candidates}