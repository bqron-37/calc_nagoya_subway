from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import heapq
import itertools
import time
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

        # 普通運賃（定期区間外へ乗り越すときの運賃）。区分の距離境界は定期と同じ
        # data source: 名古屋市交通局「地下鉄普通料金・定期券料金」
        adult_fares = {"1区": 210, "2区": 240, "3区": 270, "4区": 310, "5区": 340}
        # 小児、および身体障害者等割引（大人）の普通運賃
        reduced_fares = {"1区": 100, "2区": 120, "3区": 130, "4区": 150, "5区": 170}
        self.single_fares = {
            "commuter":       adult_fares,
            "university":     adult_fares,
            "high_school":    adult_fares,
            "elementary":     reduced_fares,
            "disability":     reduced_fares,
            "disability_stu": reduced_fares,
        }

    def get_single_fare(self, distance_km: float, fare_type: str):
        dist_rounded = round(distance_km, 1)
        if fare_type not in self.single_fares:
            return None
        for rule in self.fare_rules:
            if dist_rounded <= rule.max_km:
                return self.single_fares[fare_type][rule.zone_name]
        return None

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

    def shortest_distance(self, start, goal):
        if start not in self.graph or goal not in self.graph: return None
        dist = {start: 0.0}
        queue = [(0.0, start)]
        while queue:
            d, curr = heapq.heappop(queue)
            if curr == goal:
                return d
            if d > dist[curr]: continue
            for neighbor, weight in self.graph[curr].items():
                nd = d + weight
                if nd < dist.get(neighbor, float('inf')):
                    dist[neighbor] = nd
                    heapq.heappush(queue, (nd, neighbor))
        return None

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

class SearchLimitReached(Exception):
    pass

@app.get("/api/stations")
def get_stations():
    return {"stations": LINE_STATIONS}

def build_route_result(path: List[str], target_stops: List[str], distance: float, fare_type: str):
    transfers = count_transfers(path)
    if transfers > 3:
        return None

    complex_count = calculate_complexity(path)
    fare_info = calc.get_fare(distance, fare_type)
    if not fare_info:
        return None

    transfer_stations = set()
    if len(path) >= 2:
        current_line = get_connecting_line(path[0], path[1])
        for k in range(1, len(path) - 1):
            next_line = get_connecting_line(path[k], path[k + 1])
            if current_line != next_line:
                transfer_stations.add(path[k])
                current_line = next_line

    display_parts = [path[0]]
    for station in path[1:-1]:
        is_user_selected = station in target_stops
        is_transfer = station in transfer_stations
        if is_transfer:
            display_parts.append(f"{station}（乗換）")
        elif is_user_selected:
            display_parts.append(station)
    display_parts.append(path[-1])

    return {
        "route_points": target_stops,
        "route_str": " → ".join(display_parts),
        "distance": round(distance, 2),
        "zone": fare_info["zone"],
        "price_1m": fare_info["price_1m"],
        "price_6m": fare_info["price_6m"],
        "full_path": path,
        "transfers": transfers,
        "exceeds_five_station_rule": complex_count > 5
    }

def find_routes_by_distance(target_stops: List[str], fare_type: str, max_results: int = 100):
    target_index = {station: i for i, station in enumerate(target_stops)}
    all_targets_mask = (1 << len(target_stops)) - 1
    queue = []

    for station in target_stops:
        mask = 1 << target_index[station]
        heapq.heappush(queue, (0.0, station, [station], mask))

    results = []
    seen_routes_set = set()
    expansions = 0
    max_expansions = 200000
    max_path_length = len(nw.graph)

    while queue and len(results) < max_results and expansions < max_expansions:
        distance, station, path, mask = heapq.heappop(queue)
        expansions += 1

        if mask == all_targets_mask:
            route_tuple = tuple(path)
            rev_route_tuple = tuple(path[::-1])
            if route_tuple not in seen_routes_set and rev_route_tuple not in seen_routes_set:
                result = build_route_result(path, target_stops, distance, fare_type)
                if result:
                    seen_routes_set.add(route_tuple)
                    results.append(result)
            continue

        if len(path) >= max_path_length:
            continue

        for neighbor, weight in nw.graph[station].items():
            if neighbor in path:
                continue
            next_mask = mask
            if neighbor in target_index:
                next_mask |= 1 << target_index[neighbor]
            heapq.heappush(queue, (distance + weight, neighbor, path + [neighbor], next_mask))

    return results

def find_routes_exhaustive(target_stops: List[str], fare_type: str, deadline_seconds: float = 8.0, max_results: int = 500):
    valid_candidates = []
    seen_routes_set = set()
    deadline = time.monotonic() + deadline_seconds
    timed_out = False

    try:
        for perm in itertools.permutations(target_stops):
            if time.monotonic() > deadline or len(valid_candidates) >= max_results:
                timed_out = True
                break

            current_perm_list = list(perm)
            results_for_perm = []

            initial_path = [current_perm_list[0]]
            find_routes_recursive(
                current_perm_list,
                0,
                initial_path,
                0.0,
                results_for_perm,
                fare_type,
                deadline=deadline,
                max_results=max_results,
            )

            for res in results_for_perm:
                route_tuple = tuple(res["full_path"])
                rev_route_tuple = tuple(res["full_path"][::-1])
                if route_tuple in seen_routes_set or rev_route_tuple in seen_routes_set:
                    continue
                seen_routes_set.add(route_tuple)
                valid_candidates.append(res)
                if len(valid_candidates) >= max_results:
                    timed_out = True
                    break
    except SearchLimitReached:
        timed_out = True

    return valid_candidates, timed_out

def find_routes_recursive(
    target_stops: List[str],
    current_index: int,
    current_path_stations: List[str],
    current_dist: float,
    results: List[Dict],
    fare_type: str,
    deadline: Optional[float] = None,
    max_results: Optional[int] = None
):
    if deadline is not None and time.monotonic() > deadline:
        raise SearchLimitReached()
    if max_results is not None and len(results) >= max_results:
        return

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

    candidates = nw.find_all_simple_paths(start_s, next_s, exclude_stations=exclude, max_paths=300)

    for dist, path in candidates:
        if deadline is not None and time.monotonic() > deadline:
            raise SearchLimitReached()
        if max_results is not None and len(results) >= max_results:
            break

        if len(current_path_stations) == 0:
            new_full_path = path
        else:
            new_full_path = current_path_stations + path[1:]
        
        find_routes_recursive(
            target_stops,
            current_index + 1,
            new_full_path,
            current_dist + dist,
            results,
            fare_type,
            deadline=deadline,
            max_results=max_results,
        )

def detour_round_trip_cost(base_path: List[str], detour_station: str, fare_type: str):
    # 遠回りしない定期で寄り道駅へ行く場合：定期区間で一番近い駅から寄り道駅までの乗り越し運賃 × 往復
    fares = []
    for station in base_path:
        distance = nw.shortest_distance(station, detour_station)
        if distance is None:
            continue
        fare = calc.get_single_fare(distance, fare_type)
        if fare is not None:
            fares.append((fare, station))
    if not fares:
        return None, None
    fare, from_station = min(fares)
    return fare * 2, from_station

def required_visits(price_diff: int, months: int, round_trip_cost: int):
    # 遠回り定期の差額より、乗り越し運賃の合計が高くなる「月あたり」の最小回数
    if price_diff <= 0:
        return 0
    return price_diff // (months * round_trip_cost) + 1

def build_detour_comparison(candidate: Dict, base_route: Dict, detour_stops: List[str], fare_type: str):
    diff_1m = candidate["price_1m"] - base_route["price_1m"]
    diff_6m = candidate["price_6m"] - base_route["price_6m"]
    stations = []
    for station in detour_stops:
        if station in base_route["full_path"]:
            # 遠回りしない定期の区間内なので、乗り越し運賃はかからない
            stations.append({"station": station, "on_base_route": True})
            continue
        cost, from_station = detour_round_trip_cost(base_route["full_path"], station, fare_type)
        if cost is None:
            continue
        stations.append({
            "station": station,
            "on_base_route": False,
            "from_station": from_station,
            "round_trip_cost": cost,
            "visits_1m": required_visits(diff_1m, 1, cost),
            "visits_6m": required_visits(diff_6m, 6, cost),
        })
    return {"diff_1m": diff_1m, "diff_6m": diff_6m, "stations": stations}

@app.get("/api/calculate")
def calculate_fare(
    stops: List[str] = Query(...),
    type: str = Query("commuter"), # デフォルトは通勤
    mode: str = Query("fast"),
    detour: List[str] = Query([]) # 寄り道駅（バイト先・店など）。それ以外の駅は遠回りしないルートの必須駅
):
    if len(stops) < 2:
        raise HTTPException(status_code=400, detail="駅を2つ以上指定してください。")
    
    unique_stops = list(dict.fromkeys(stops))
    if len(unique_stops) < 2:
        raise HTTPException(status_code=400, detail="異なる駅を2つ以上指定してください。")

    detour_stops = [s for s in unique_stops if s in detour]
    base_stops = [s for s in unique_stops if s not in detour]
    if detour_stops and len(base_stops) < 2:
        raise HTTPException(status_code=400, detail="家・大学などの必須駅を2つ以上指定してください。")

    warning = None
    if mode == "exhaustive":
        valid_candidates, timed_out = find_routes_exhaustive(unique_stops, type)
        if timed_out:
            warning = "網羅検索が上限時間に達したため、見つかった候補のみ表示しています。駅数を減らすか高速検索も試してください。"
    elif mode == "fast":
        valid_candidates = find_routes_by_distance(unique_stops, type)
    else:
        raise HTTPException(status_code=400, detail="検索方式が不正です。")

    if not valid_candidates:
        if mode == "exhaustive" and warning:
            valid_candidates = find_routes_by_distance(unique_stops, type)
            warning = "網羅検索が上限時間に達したため、高速検索の候補を表示しています。駅数を減らすと網羅検索が完了しやすくなります。"
            if not valid_candidates:
                raise HTTPException(status_code=422, detail="網羅検索が上限時間に達しました。駅数を減らすか高速検索を使ってください。")
        else:
            raise HTTPException(status_code=400, detail="有効な一筆書きルートが見つかりませんでした。")

    valid_candidates.sort(key=lambda x: x["distance"])

    base_route = None
    if detour_stops:
        base_candidates = find_routes_by_distance(base_stops, type, max_results=1)
        if base_candidates:
            base_route = base_candidates[0]
            for candidate in valid_candidates:
                candidate["detour_comparison"] = build_detour_comparison(candidate, base_route, detour_stops, type)

    return {"candidates": valid_candidates, "warning": warning, "base_route": base_route}
