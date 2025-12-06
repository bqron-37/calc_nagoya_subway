from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import heapq
import itertools
from dataclasses import dataclass
from typing import Optional, List, Dict, Set
import collections

# === 1. 料金テーブル定義 ===
@dataclass
class FareSet:
    price_1m: int
    price_6m: int

@dataclass
class PriceTable:
    zone_name: str
    max_km: float
    prices: Dict[str, FareSet] # 種類ごとの料金セット

class SubwayFareCalculator:
    def __init__(self):
        # 距離区分ごとの料金定義（ここに全種類の料金を登録します）
        # data source: ユーザー提供データ
        self.fare_rules = [
            PriceTable("1区", 3.0, {
                "commuter":       FareSet(8540, 46120), # 通勤
                "university":     FareSet(5030, 27170), # 大学生
                "high_school":    FareSet(4440, 23980), # 高校・中学
                "elementary":     FareSet(2400, 12960), # 小学生以下
                "disability":     FareSet(4080, 22040), # 割引通勤
                "disability_stu": FareSet(2400, 12960), # 割引学生
            }),
            PriceTable("2区", 7.0, {
                "commuter":       FareSet(9540, 51520),
                "university":     FareSet(5500, 29700),
                "high_school":    FareSet(4830, 26090),
                "elementary":     FareSet(2630, 14180),
                "disability":     FareSet(4560, 24600),
                "disability_stu": FareSet(2630, 14180),
            }),
            PriceTable("3区", 11.0, {
                "commuter":       FareSet(10470, 56540),
                "university":     FareSet(5880, 31760),
                "high_school":    FareSet(5140, 27760),
                "elementary":     FareSet(2810, 15180),
                "disability":     FareSet(5000, 26980),
                "disability_stu": FareSet(2810, 15180),
            }),
            PriceTable("4区", 15.0, {
                "commuter":       FareSet(11300, 61020),
                "university":     FareSet(6200, 33480),
                "high_school":    FareSet(5370, 29000),
                "elementary":     FareSet(2960, 15990),
                "disability":     FareSet(5400, 29140),
                "disability_stu": FareSet(2960, 15990),
            }),
            PriceTable("5区", float('inf'), {
                "commuter":       FareSet(12060, 65130),
                "university":     FareSet(6440, 34780),
                "high_school":    FareSet(5530, 29870),
                "elementary":     FareSet(3080, 16610),
                "disability":     FareSet(5760, 31110),
                "disability_stu": FareSet(3080, 16610),
            }),
        ]

    def get_fare(self, distance_km: float, fare_type: str):
        dist_rounded = round(distance_km, 1)
        for rule in self.fare_rules:
            if dist_rounded <= rule.max_km:
                if fare_type in rule.prices:
                    price_data = rule.prices[fare_type]
                    return {
                        "zone": rule.zone_name,
                        "price_1m": price_data.price_1m,
                        "price_6m": price_data.price_6m
                    }
                else:
                    return None # 不正なタイプ
        return None

# === 2. 路線データ ===
LINE_STATIONS = {
    "東山線": [
        "高畑", "八田", "岩塚", "中村公園", "中村日赤", "本陣", "亀島", "名古屋",
        "伏見", "栄", "新栄町", "千種", "今池", "池下", "覚王山", "本山", 
        "東山公園", "星ヶ丘", "一社", "上社", "本郷", "藤が丘"
    ],
    "名城線": [
        "金山", "東別院", "上前津", "矢場町", "栄", "久屋大通", "名古屋城", "名城公園",
        "黒川", "志賀本通", "平安通", "大曽根", "ナゴヤドーム前矢田", "砂田橋",
        "茶屋ヶ坂", "自由ヶ丘", "本山", "名古屋大学", "八事日赤", "八事",
        "総合リハビリセンター", "瑞穂運動場東", "新瑞橋", "妙音通", "堀田", "熱田神宮伝馬町",
        "熱田神宮西", "西高蔵"
    ],
    "名港線": [
        "金山", "日比野", "六番町", "東海通", "港区役所", "築地口", "名古屋港"
    ],
    "鶴舞線": [
        "上小田井", "庄内緑地公園", "庄内通", "浄心", "浅間町", "丸の内", "伏見",
        "大須観音", "上前津", "鶴舞", "荒畑", "御器所", "川名", "いりなか", "八事",
        "塩釜口", "植田", "原", "平針", "赤池"
    ],
    "桜通線": [
        "太閤通", "名古屋", "国際センター", "丸の内", "久屋大通", "高岳", "車道",
        "今池", "吹上", "御器所", "桜山", "瑞穂区役所", "瑞穂運動場西", "新瑞橋",
        "桜本町", "鶴里", "野並", "鳴子北", "相生山", "神沢", "徳重"
    ],
    "上飯田線": [
        "上飯田", "平安通"
    ]
}

DISCRIMINATOR_STATIONS = {"大曽根", "金山", "西高蔵", "国際センター", "吹上"}

def get_connecting_line(station1, station2):
    for line, stations in LINE_STATIONS.items():
        if station1 in stations and station2 in stations:
            return line
    return None

def count_transfers(path):
    if len(path) < 2: return 0
    transfers = 0
    current_line = get_connecting_line(path[0], path[1])
    for i in range(1, len(path) - 1):
        next_line = get_connecting_line(path[i], path[i+1])
        if current_line != next_line:
            transfers += 1
            current_line = next_line
    return transfers

def calculate_complexity(path):
    if len(path) < 2: return 0
    transfer_stations = set()
    current_line = get_connecting_line(path[0], path[1])
    for i in range(1, len(path) - 1):
        next_line = get_connecting_line(path[i], path[i+1])
        if current_line != next_line:
            transfer_stations.add(path[i]) 
            current_line = next_line
    found_discriminators = set()
    for st in path:
        if st in DISCRIMINATOR_STATIONS:
            found_discriminators.add(st)
    return len(transfer_stations.union(found_discriminators))

# === 3. ネットワーク ===
class SubwayNetwork:
    def __init__(self):
        self.graph = {}

    def add_edge(self, station1, station2, dist):
        if station1 not in self.graph: self.graph[station1] = {}
        if station2 not in self.graph: self.graph[station2] = {}
        self.graph[station1][station2] = dist
        self.graph[station2][station1] = dist

    def build_nagoya_subway(self):
        # 東山線
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
        # 桜通線
        self.add_edge("太閤通", "名古屋", 0.9)
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
        # 名城線
        self.add_edge("金山", "東別院", 0.7)
        self.add_edge("東別院", "上前津", 0.9)
        self.add_edge("上前津", "矢場町", 0.7)
        self.add_edge("矢場町", "栄", 0.7)
        self.add_edge("栄", "久屋大通", 0.4)
        self.add_edge("久屋大通", "名古屋城", 0.9)
        self.add_edge("名古屋城", "名城公園", 1.1)
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
        self.add_edge("堀田", "熱田神宮伝馬町", 1.2)
        self.add_edge("熱田神宮伝馬町", "熱田神宮西", 1.0)
        self.add_edge("熱田神宮西", "西高蔵", 0.9)
        self.add_edge("西高蔵", "金山", 1.1)
        # 名港線
        self.add_edge("金山", "日比野", 1.5)
        self.add_edge("日比野", "六番町", 1.1)
        self.add_edge("六番町", "東海通", 1.2)
        self.add_edge("東海通", "港区役所", 0.8)
        self.add_edge("港区役所", "築地口", 0.8)
        self.add_edge("築地口", "名古屋港", 0.6)
        # 鶴舞線
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
        # 上飯田線
        self.add_edge("上飯田", "平安通", 0.8)

    def find_all_simple_paths(self, start, goal, exclude_stations: Set[str], max_paths=1000):
        if start not in self.graph or goal not in self.graph: return []
        queue = [(0.0, start, [start])]
        found_paths = []
        while queue:
            dist, curr, path = heapq.heappop(queue)
            if curr == goal:
                found_paths.append((dist, path))
                if len(found_paths) >= max_paths:
                    break
                continue
            if len(path) > 100: continue
            for neighbor, weight in self.graph[curr].items():
                if neighbor in path: continue 
                if neighbor in exclude_stations: continue 
                heapq.heappush(queue, (dist + weight, neighbor, path + [neighbor]))
        return found_paths

# === API ===
app = FastAPI()
app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"]
)

nw = SubwayNetwork()
nw.build_nagoya_subway()
calc = SubwayFareCalculator()

@app.get("/stations")
def get_stations():
    return {"stations": LINE_STATIONS}

def find_routes_recursive(target_stops: List[str], current_index: int, current_path_stations: List[str], current_dist: float, results: List[Dict], fare_type: str):
    if current_index == len(target_stops) - 1:
        if len(current_path_stations) != len(set(current_path_stations)):
            return
        transfers = count_transfers(current_path_stations)
        if transfers > 3:
            return
        
        complex_count = calculate_complexity(current_path_stations)
        exceeds = (complex_count > 5)

        # 料金計算時に種類（fare_type）を渡す
        fare_info = calc.get_fare(current_dist, fare_type)
        if not fare_info: return

        transfer_stations = set()
        if len(current_path_stations) >= 2:
            current_line = get_connecting_line(current_path_stations[0], current_path_stations[1])
            for k in range(1, len(current_path_stations) - 1):
                next_line = get_connecting_line(current_path_stations[k], current_path_stations[k+1])
                if current_line != next_line:
                    transfer_stations.add(current_path_stations[k])
                    current_line = next_line
        
        display_parts = []
        display_parts.append(current_path_stations[0])
        for station in current_path_stations[1:-1]:
            is_user_selected = station in target_stops
            is_transfer = station in transfer_stations
            if is_transfer:
                display_parts.append(f"{station}（乗換）")
            elif is_user_selected:
                display_parts.append(station)
        display_parts.append(current_path_stations[-1])
        route_str = " → ".join(display_parts)

        results.append({
            "route_points": target_stops,
            "route_str": route_str,
            "distance": round(current_dist, 2),
            "zone": fare_info["zone"],
            "price_1m": fare_info["price_1m"],
            "price_6m": fare_info["price_6m"],
            "full_path": current_path_stations,
            "transfers": transfers,
            "exceeds_five_station_rule": exceeds
        })
        return

    start_s = target_stops[current_index]
    next_s = target_stops[current_index + 1]
    
    exclude = set(current_path_stations)
    if start_s in exclude: exclude.remove(start_s)
    if next_s in exclude: exclude.remove(next_s)

    candidates = nw.find_all_simple_paths(start_s, next_s, exclude_stations=exclude, max_paths=1000)

    for dist, path in candidates:
        if len(current_path_stations) == 0:
            new_full_path = path
        else:
            new_full_path = current_path_stations + path[1:]
        
        find_routes_recursive(target_stops, current_index + 1, new_full_path, current_dist + dist, results, fare_type)

@app.get("/calculate")
def calculate_fare(
    stops: List[str] = Query(...),
    type: str = Query("commuter") # デフォルトは通勤
):
    if len(stops) < 2:
        raise HTTPException(status_code=400, detail="駅を2つ以上指定してください。")
    
    unique_stops = list(set(stops))
    if len(unique_stops) < 2:
        raise HTTPException(status_code=400, detail="異なる駅を2つ以上指定してください。")

    valid_candidates = []
    seen_routes_set = set()

    for perm in itertools.permutations(unique_stops):
        current_perm_list = list(perm)
        results_for_perm = []
        
        initial_path = [current_perm_list[0]]
        find_routes_recursive(current_perm_list, 0, initial_path, 0.0, results_for_perm, type)

        for res in results_for_perm:
            route_tuple = tuple(res["full_path"])
            rev_route_tuple = tuple(res["full_path"][::-1])
            if route_tuple in seen_routes_set or rev_route_tuple in seen_routes_set:
                continue
            seen_routes_set.add(route_tuple)
            valid_candidates.append(res)

    if not valid_candidates:
        raise HTTPException(status_code=400, detail="有効な一筆書きルートが見つかりませんでした。")

    valid_candidates.sort(key=lambda x: x["distance"])
    return {"candidates": valid_candidates}