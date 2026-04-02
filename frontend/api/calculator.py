import heapq
import unicodedata
from dataclasses import dataclass
from typing import List, Optional, Dict

# ---------------------------------------------------------
# 1. データ構造と設定 (Config)
# ---------------------------------------------------------

@dataclass
class PriceTable:
    zone_name: str
    max_km: float
    price_1m: int
    price_6m: int

class SubwayFareCalculator:
    def __init__(self):
        # 学生定期(甲)の料金テーブル
        self.fare_rules = [
            PriceTable("1区",  3.0,  5030, 27170),
            PriceTable("2区",  7.0,  5500, 29700),
            PriceTable("3区", 11.0,  5880, 31760),
            PriceTable("4区", 15.0,  6200, 33480),
            PriceTable("5区", float('inf'), 6440, 34780)
        ]

    def get_fare(self, distance_km: float):
        # 浮動小数点の誤差対策（小数点第2位で丸める）
        dist_rounded = round(distance_km, 1)
        
        for rule in self.fare_rules:
            if dist_rounded <= rule.max_km:
                return rule
        return None

# ---------------------------------------------------------
# 2. 路線ネットワーク構築 (Graph Data)
# ---------------------------------------------------------

class SubwayNetwork:
    def __init__(self):
        self.graph = {}

    def add_edge(self, station1, station2, dist):
        """駅間の接続を追加する（双方向）"""
        if station1 not in self.graph: self.graph[station1] = {}
        if station2 not in self.graph: self.graph[station2] = {}
        
        self.graph[station1][station2] = dist
        self.graph[station2][station1] = dist

    def build_nagoya_subway(self):
        # --- 東山線 (高畑 - 藤が丘) ---
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

        # --- 桜通線 (中村区役所 - 徳重) ---
        # ※駅名はデータ作成当時のもの
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

        # --- 名城線 (環状) ---
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

        # --- 鶴舞線 (上小田井 - 赤池) ---
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
        """ダイクストラ法で最短距離を計算"""
        if start not in self.graph or goal not in self.graph:
            return None, "駅名が見つかりません"

        queue = [(0.0, start)]
        distances = {node: float('inf') for node in self.graph}
        distances[start] = 0.0
        
        while queue:
            current_dist, current_node = heapq.heappop(queue)

            if current_node == goal:
                return current_dist, None

            if current_dist > distances[current_node]:
                continue

            for neighbor, weight in self.graph[current_node].items():
                distance = current_dist + weight
                # 浮動小数点の蓄積誤差を防ぐため少し丸める
                distance = round(distance, 2)
                
                if distance < distances[neighbor]:
                    distances[neighbor] = distance
                    heapq.heappush(queue, (distance, neighbor))

        return None, "経路が見つかりません（接続されていません）"

# ---------------------------------------------------------
# 3. 表示用ユーティリティ
# ---------------------------------------------------------
def get_width(text):
    """全角2、半角1で文字幅をカウント"""
    c = 0
    for ch in str(text):
        if unicodedata.east_asian_width(ch) in 'FWA': c += 2
        else: c += 1
    return c

def pad(text, width):
    """指定幅になるようにスペース埋め"""
    text = str(text)
    return text + ' ' * max(0, width - get_width(text))

# ---------------------------------------------------------
# メイン実行ブロック
# ---------------------------------------------------------
if __name__ == "__main__":
    nw = SubwayNetwork()
    nw.build_nagoya_subway()
    calc = SubwayFareCalculator()

    print("=== 地下鉄定期代計算システム (qで終了) ===")
    
    # 全駅名のリストを作成（入力ミスチェック用）
    all_stations = list(nw.graph.keys())

    while True:
        print("\n-----------------------------")
        start = input("出発駅を入力: ").strip()
        if start == "q": break
        
        # 駅名が存在するかチェック
        if start not in all_stations:
            print(f"エラー: '{start}' は登録されていません。")
            continue

        goal = input("到着駅を入力: ").strip()
        if goal == "q": break

        if goal not in all_stations:
            print(f"エラー: '{goal}' は登録されていません。")
            continue

        dist, error = nw.find_route(start, goal)

        if error:
            print(f"エラー: {error}")
        else:
            fare = calc.get_fare(dist)
            if fare:
                print(f"\n>> {start} ⇔ {goal}")
                print(f"   距離: {dist} km ({fare.zone_name})")
                print(f"   1ヶ月: {fare.price_1m:,}円")
                print(f"   6ヶ月: {fare.price_6m:,}円")