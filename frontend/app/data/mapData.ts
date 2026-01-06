export type StationCoordinate = {
    x: number;
    y: number;
    labelAlign?: "top" | "bottom" | "left" | "right";
};

// 座標系: 1000 x 800 (概算)
// 中心(栄)付近を (500, 400) とする

export const STATION_COORDINATES: Record<string, StationCoordinate> = {
    // === 東山線 (Yellow) === 横一文字 (y=400)
    "高畑": { x: 100, y: 400, labelAlign: "bottom" },
    "八田": { x: 140, y: 400, labelAlign: "bottom" },
    "岩塚": { x: 180, y: 400, labelAlign: "bottom" },
    "中村公園": { x: 220, y: 400, labelAlign: "bottom" },
    "中村日赤": { x: 260, y: 400, labelAlign: "bottom" },
    "本陣": { x: 300, y: 400, labelAlign: "bottom" },
    "亀島": { x: 340, y: 400, labelAlign: "bottom" },
    "名古屋": { x: 380, y: 400, labelAlign: "top" }, // Hub
    "伏見": { x: 440, y: 400, labelAlign: "top" },   // Hub
    "栄": { x: 500, y: 400, labelAlign: "top" },     // Hub Center
    "新栄町": { x: 560, y: 400, labelAlign: "bottom" },
    "千種": { x: 620, y: 400, labelAlign: "top" },
    "今池": { x: 680, y: 400, labelAlign: "top" },   // Hub
    "池下": { x: 720, y: 400, labelAlign: "bottom" },
    "覚王山": { x: 760, y: 400, labelAlign: "bottom" },
    "本山": { x: 800, y: 400, labelAlign: "top" },   // Hub
    "東山公園": { x: 840, y: 400, labelAlign: "bottom" },
    "星ヶ丘": { x: 880, y: 400, labelAlign: "bottom" },
    "一社": { x: 920, y: 400, labelAlign: "bottom" },
    "上社": { x: 950, y: 400, labelAlign: "bottom" },
    "本郷": { x: 980, y: 400, labelAlign: "bottom" },
    "藤が丘": { x: 1010, y: 400, labelAlign: "bottom" },

    // === 名城線 (Purple) === ループ
    // 金山(440, 600) -> 栄(500, 400) -> 大曽根(700, 200) -> 本山(800, 400) -> 八事(800, 550) -> 新瑞橋(680, 650) -> 金山
    // 左側 (金山〜栄〜大曽根)
    "金山": { x: 440, y: 600, labelAlign: "bottom" },  // Hub (名港線分岐)
    "東別院": { x: 480, y: 560, labelAlign: "left" },
    "上前津": { x: 500, y: 520, labelAlign: "left" },  // Hub (鶴舞線)
    "矢場町": { x: 500, y: 460, labelAlign: "left" },
    // 栄 (既出)
    "久屋大通": { x: 500, y: 340, labelAlign: "left" }, // Hub (桜通線)
    "名古屋城": { x: 500, y: 280, labelAlign: "left" }, // 市役所
    "名城公園": { x: 540, y: 240, labelAlign: "top" },
    "黒川": { x: 580, y: 240, labelAlign: "top" },
    "志賀本通": { x: 620, y: 240, labelAlign: "top" },
    "平安通": { x: 660, y: 240, labelAlign: "top" },   // Hub (上飯田線)
    "大曽根": { x: 720, y: 240, labelAlign: "top" },

    // 右側 (大曽根〜本山)
    "ナゴヤドーム前矢田": { x: 760, y: 260, labelAlign: "right" },
    "砂田橋": { x: 800, y: 290, labelAlign: "right" },
    "茶屋ヶ坂": { x: 800, y: 330, labelAlign: "right" },
    "自由ヶ丘": { x: 800, y: 370, labelAlign: "right" },
    // 本山 (既出) 800, 400

    // 右下 (本山〜新瑞橋)
    "名古屋大学": { x: 800, y: 450, labelAlign: "right" },
    "八事日赤": { x: 800, y: 500, labelAlign: "right" },
    "八事": { x: 800, y: 550, labelAlign: "right" },       // Hub (鶴舞線)
    "総合リハビリセンター": { x: 770, y: 600, labelAlign: "right" },
    "瑞穂運動場東": { x: 730, y: 630, labelAlign: "right" },
    "新瑞橋": { x: 680, y: 650, labelAlign: "bottom" },    // Hub (桜通線)

    // 下部 (新瑞橋〜金山)
    "妙音通": { x: 640, y: 650, labelAlign: "bottom" },
    "堀田": { x: 600, y: 650, labelAlign: "bottom" },
    "熱田神宮伝馬町": { x: 560, y: 650, labelAlign: "bottom" },
    "熱田神宮西": { x: 520, y: 650, labelAlign: "bottom" },
    "西高蔵": { x: 480, y: 640, labelAlign: "bottom" },

    // === 名港線 (Purple/Stripe) === 金山から下へ
    "日比野": { x: 400, y: 640, labelAlign: "left" },
    "六番町": { x: 380, y: 680, labelAlign: "left" },
    "東海通": { x: 380, y: 720, labelAlign: "left" },
    "港区役所": { x: 380, y: 760, labelAlign: "left" },
    "築地口": { x: 360, y: 790, labelAlign: "left" },
    "名古屋港": { x: 340, y: 820, labelAlign: "left" },

    // === 鶴舞線 (Blue) === 北西から南東へ
    // 上小田井(200, 100) -> 伏見(440, 400) -> 上前津(500, 520) -> 八事(800, 550) -> 赤池(950, 700)
    "上小田井": { x: 280, y: 150, labelAlign: "top" },
    "庄内緑地公園": { x: 320, y: 190, labelAlign: "top" },
    "庄内通": { x: 350, y: 230, labelAlign: "right" },
    "浄心": { x: 380, y: 270, labelAlign: "right" },
    "浅間町": { x: 400, y: 310, labelAlign: "right" },
    "丸の内": { x: 440, y: 340, labelAlign: "right" },  // Hub (桜通線)
    // 伏見 (既出) 
    "大須観音": { x: 460, y: 460, labelAlign: "right" },
    // 上前津 (既出) 500, 520
    "鶴舞": { x: 560, y: 520, labelAlign: "bottom" },
    "荒畑": { x: 600, y: 520, labelAlign: "bottom" },
    "御器所": { x: 680, y: 520, labelAlign: "top" },   // Hub (桜通線) 680, 520にしたいが名城線と被らないか確認。今池が680,400なのでOK
    "川名": { x: 720, y: 530, labelAlign: "bottom" },
    "いりなか": { x: 760, y: 540, labelAlign: "bottom" },
    // 八事 (既出) 800, 550
    "塩釜口": { x: 840, y: 590, labelAlign: "bottom" },
    "植田": { x: 880, y: 620, labelAlign: "bottom" },
    "原": { x: 920, y: 650, labelAlign: "bottom" },
    "平針": { x: 960, y: 680, labelAlign: "bottom" },
    "赤池": { x: 1000, y: 710, labelAlign: "bottom" },

    // === 桜通線 (Red) ===
    // 太閤通 -> 名古屋 -> 丸の内 -> 久屋大通 -> 今池 -> 御器所 -> 新瑞橋 -> 徳重
    "太閤通": { x: 340, y: 460, labelAlign: "bottom" }, // 旧中村区役所
    // 名古屋 (既出: 380, 400) -> 迂回させる
    "国際センター": { x: 420, y: 360, labelAlign: "top" }, // 名古屋と丸の内の間
    // 丸の内 (既出) 440, 340
    // 久屋大通 (既出) 500, 340
    "高岳": { x: 560, y: 340, labelAlign: "top" },
    "車道": { x: 620, y: 340, labelAlign: "top" },
    // 今池 (既出) 680, 400
    "吹上": { x: 680, y: 460, labelAlign: "right" },
    // 御器所 (既出) 680, 520
    "桜山": { x: 680, y: 580, labelAlign: "right" },
    "瑞穂区役所": { x: 680, y: 620, labelAlign: "left" },
    "瑞穂運動場西": { x: 680, y: 680, labelAlign: "left" },
    // 新瑞橋 (既出: 680, 650) -> 少し位置調整必要かもだが繋ぐ
    "桜本町": { x: 720, y: 680, labelAlign: "bottom" },
    "鶴里": { x: 760, y: 680, labelAlign: "bottom" },
    "野並": { x: 800, y: 680, labelAlign: "bottom" },
    "鳴子北": { x: 840, y: 680, labelAlign: "bottom" },
    "相生山": { x: 880, y: 680, labelAlign: "bottom" },
    "神沢": { x: 920, y: 680, labelAlign: "bottom" },
    "徳重": { x: 960, y: 680, labelAlign: "bottom" },

    // === 上飯田線 (Pink) ===
    "上飯田": { x: 660, y: 180, labelAlign: "top" },
    // 平安通 (既出) 660, 240
}

// 接続定義 (描画用)
export const SUBWAY_LINES = [
    {
        id: "higashiyama",
        color: "#fbbf24", // yellow-400
        stations: [
            "高畑", "八田", "岩塚", "中村公園", "中村日赤", "本陣", "亀島", "名古屋",
            "伏見", "栄", "新栄町", "千種", "今池", "池下", "覚王山", "本山",
            "東山公園", "星ヶ丘", "一社", "上社", "本郷", "藤が丘"
        ]
    },
    {
        id: "meijo",
        color: "#c084fc", // purple-400
        loop: true,
        stations: [
            "金山", "東別院", "上前津", "矢場町", "栄", "久屋大通", "名古屋城", "名城公園",
            "黒川", "志賀本通", "平安通", "大曽根", "ナゴヤドーム前矢田", "砂田橋",
            "茶屋ヶ坂", "自由ヶ丘", "本山", "名古屋大学", "八事日赤", "八事",
            "総合リハビリセンター", "瑞穂運動場東", "新瑞橋", "妙音通", "堀田", "熱田神宮伝馬町",
            "熱田神宮西", "西高蔵", "金山"
        ]
    },
    {
        id: "meiko",
        color: "#d8b4fe", // purple-300 (Striped in real, but solid here for simplicity)
        stations: ["金山", "日比野", "六番町", "東海通", "港区役所", "築地口", "名古屋港"]
    },
    {
        id: "tsurumai",
        color: "#3b82f6", // blue-500
        stations: [
            "上小田井", "庄内緑地公園", "庄内通", "浄心", "浅間町", "丸の内", "伏見",
            "大須観音", "上前津", "鶴舞", "荒畑", "御器所", "川名", "いりなか", "八事",
            "塩釜口", "植田", "原", "平針", "赤池"
        ]
    },
    {
        id: "sakuradori",
        color: "#ef4444", // red-500
        stations: [
            "太閤通", "名古屋", "国際センター", "丸の内", "久屋大通", "高岳", "車道",
            "今池", "吹上", "御器所", "桜山", "瑞穂区役所", "新瑞橋", "瑞穂運動場西",
            // Note: 瑞穂運動場西 -> 新瑞橋 の順序修正が必要かも。
            // Map check: 桜山 -> 瑞穂区役所 -> 瑞穂運動場西 -> 新瑞橋 -> 桜本町...
            // 座標定義見直し: 瑞穂運動場西(680, 680) -> 新瑞橋(680, 650)
        ]
    },
    // 桜通線を分割して定義（Y字や複雑な交差を避けるためパスを分けることも検討）
    // ここでは単純なpolylineとして描画するため、座標順に並べる必要がある
    {
        id: "sakuradori_fixed",
        color: "#ef4444",
        stations: [
            "太閤通", "名古屋", "国際センター", "丸の内", "久屋大通", "高岳", "車道",
            "今池", "吹上", "御器所", "桜山", "瑞穂区役所", "瑞穂運動場西", "新瑞橋",
            "桜本町", "鶴里", "野並", "鳴子北", "相生山", "神沢", "徳重"
        ]
    },
    {
        id: "kamiiida",
        color: "#f472b6", // pink-400
        stations: ["上飯田", "平安通"]
    }
];
