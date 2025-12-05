// app/data.ts

export type Station = {
  id: string;
  name: string;
  lines: string[];
  isSpecial: boolean; // 判別駅（計算用）
};

export type Connection = {
  from: string;
  to: string;
  line: string;
  distance: number;
};

// ==========================================
// 1. 全駅の定義 (IDと名前)
// ==========================================
// 判別駅: 大曽根, 金山, 西高蔵, 国際センター, 吹上
const SPECIAL_STATIONS = ['ozone', 'kanayama', 'nishitakakura', 'kokusai', 'fukiage'];

export const stations: Record<string, Station> = {
  // --- 東山線 (H) ---
  "takabata": { id: "takabata", name: "高畑", lines: ["higashiyama"], isSpecial: false },
  "hatta": { id: "hatta", name: "八田", lines: ["higashiyama"], isSpecial: false }, // JR/近鉄
  "iwatsuka": { id: "iwatsuka", name: "岩塚", lines: ["higashiyama"], isSpecial: false },
  "nakamurakoen": { id: "nakamurakoen", name: "中村公園", lines: ["higashiyama"], isSpecial: false },
  "nakamuranisseki": { id: "nakamuranisseki", name: "中村日赤", lines: ["higashiyama"], isSpecial: false },
  "honjin": { id: "honjin", name: "本陣", lines: ["higashiyama"], isSpecial: false },
  "kamejima": { id: "kamejima", name: "亀島", lines: ["higashiyama"], isSpecial: false },
  "nagoya": { id: "nagoya", name: "名古屋", lines: ["higashiyama", "sakura"], isSpecial: false },
  "fushimi": { id: "fushimi", name: "伏見", lines: ["higashiyama", "tsurumai"], isSpecial: false },
  "sakae": { id: "sakae", name: "栄", lines: ["higashiyama", "meijo"], isSpecial: false },
  "shinsakaemachi": { id: "shinsakaemachi", name: "新栄町", lines: ["higashiyama"], isSpecial: false },
  "chikusa": { id: "chikusa", name: "千種", lines: ["higashiyama"], isSpecial: false }, // JR
  "imaike": { id: "imaike", name: "今池", lines: ["higashiyama", "sakura"], isSpecial: false },
  "ikeshita": { id: "ikeshita", name: "池下", lines: ["higashiyama"], isSpecial: false },
  "kakuozan": { id: "kakuozan", name: "覚王山", lines: ["higashiyama"], isSpecial: false },
  "motoyama": { id: "motoyama", name: "本山", lines: ["higashiyama", "meijo"], isSpecial: false },
  "higashiyamakoen": { id: "higashiyamakoen", name: "東山公園", lines: ["higashiyama"], isSpecial: false },
  "hoshigaoka": { id: "hoshigaoka", name: "星ヶ丘", lines: ["higashiyama"], isSpecial: false },
  "issha": { id: "issha", name: "一社", lines: ["higashiyama"], isSpecial: false },
  "kamiyashiro": { id: "kamiyashiro", name: "上社", lines: ["higashiyama"], isSpecial: false },
  "hongo": { id: "hongo", name: "本郷", lines: ["higashiyama"], isSpecial: false },
  "fujigaoka": { id: "fujigaoka", name: "藤が丘", lines: ["higashiyama"], isSpecial: false },

  // --- 名城線 (M) / 名港線 (E) ---
  // 金山〜栄〜大曽根〜本山〜八事〜新瑞橋〜金山 (右回り順)
  "kanayama": { id: "kanayama", name: "金山", lines: ["meijo", "meiko"], isSpecial: true },
  "higashibetsuin": { id: "higashibetsuin", name: "東別院", lines: ["meijo"], isSpecial: false },
  "kamimaezu": { id: "kamimaezu", name: "上前津", lines: ["meijo", "tsurumai"], isSpecial: false },
  "yabacho": { id: "yabacho", name: "矢場町", lines: ["meijo"], isSpecial: false },
  "hisayaodori": { id: "hisayaodori", name: "久屋大通", lines: ["meijo", "sakura"], isSpecial: false },
  "nagoyajo": { id: "nagoyajo", name: "名古屋城", lines: ["meijo"], isSpecial: false }, // 旧市役所
  "meijokoen": { id: "meijokoen", name: "名城公園", lines: ["meijo"], isSpecial: false },
  "kurokawa": { id: "kurokawa", name: "黒川", lines: ["meijo"], isSpecial: false },
  "shigahondori": { id: "shigahondori", name: "志賀本通", lines: ["meijo"], isSpecial: false },
  "heian-dori": { id: "heian-dori", name: "平安通", lines: ["meijo", "kamiiida"], isSpecial: false },
  "ozone": { id: "ozone", name: "大曽根", lines: ["meijo"], isSpecial: true },
  "nagoyadomemaeyada": { id: "nagoyadomemaeyada", name: "ナゴヤドーム前矢田", lines: ["meijo"], isSpecial: false }, // 長いので注意
  "sunadabashi": { id: "sunadabashi", name: "砂田橋", lines: ["meijo"], isSpecial: false },
  "chayagasaka": { id: "chayagasaka", name: "茶屋ヶ坂", lines: ["meijo"], isSpecial: false },
  "jiyugaoka": { id: "jiyugaoka", name: "自由ヶ丘", lines: ["meijo"], isSpecial: false },
  // 本山(motoyama)は定義済み
  "nagoyadaigaku": { id: "nagoyadaigaku", name: "名古屋大学", lines: ["meijo"], isSpecial: false },
  "yagotonisseki": { id: "yagotonisseki", name: "八事日赤", lines: ["meijo"], isSpecial: false },
  "yagoto": { id: "yagoto", name: "八事", lines: ["meijo", "tsurumai"], isSpecial: false },
  "sogo-rihabiri-center": { id: "sogo-rihabiri-center", name: "総合リハビリセンター", lines: ["meijo"], isSpecial: false },
  "mizuho-undojo-higashi": { id: "mizuho-undojo-higashi", name: "瑞穂運動場東", lines: ["meijo"], isSpecial: false },
  "aratamabashi": { id: "aratamabashi", name: "新瑞橋", lines: ["meijo", "sakura"], isSpecial: false },
  "myoondori": { id: "myoondori", name: "妙音通", lines: ["meijo"], isSpecial: false },
  "horita": { id: "horita", name: "堀田", lines: ["meijo"], isSpecial: false },
  "atsutajingu-temma-cho": { id: "atsutajingu-temma-cho", name: "熱田神宮伝馬町", lines: ["meijo"], isSpecial: false },
  "atsutajingu-nishi": { id: "atsutajingu-nishi", name: "熱田神宮西", lines: ["meijo"], isSpecial: false },
  "nishitakakura": { id: "nishitakakura", name: "西高蔵", lines: ["meijo"], isSpecial: true },

  // 名港線 (金山から分岐)
  "hibino": { id: "hibino", name: "日比野", lines: ["meiko"], isSpecial: false },
  "rokubancho": { id: "rokubancho", name: "六番町", lines: ["meiko"], isSpecial: false },
  "tokaidori": { id: "tokaidori", name: "東海通", lines: ["meiko"], isSpecial: false },
  "minatokuyakusho": { id: "minatokuyakusho", name: "港区役所", lines: ["meiko"], isSpecial: false },
  "tsukijiguchi": { id: "tsukijiguchi", name: "築地口", lines: ["meiko"], isSpecial: false },
  "nagoyako": { id: "nagoyako", name: "名古屋港", lines: ["meiko"], isSpecial: false },

  // --- 鶴舞線 (T) ---
  "kamiotai": { id: "kamiotai", name: "上小田井", lines: ["tsurumai"], isSpecial: false },
  "shonairyokuchikoen": { id: "shonairyokuchikoen", name: "庄内緑地公園", lines: ["tsurumai"], isSpecial: false },
  "shonaidori": { id: "shonaidori", name: "庄内通", lines: ["tsurumai"], isSpecial: false },
  "joshin": { id: "joshin", name: "浄心", lines: ["tsurumai"], isSpecial: false },
  "sengencho": { id: "sengencho", name: "浅間町", lines: ["tsurumai"], isSpecial: false },
  "marunouchi": { id: "marunouchi", name: "丸の内", lines: ["tsurumai", "sakura"], isSpecial: false },
  // 伏見(fushimi)は定義済み
  "osukannon": { id: "osukannon", name: "大須観音", lines: ["tsurumai"], isSpecial: false },
  // 上前津(kamimaezu)は定義済み
  "tsurumai": { id: "tsurumai", name: "鶴舞", lines: ["tsurumai"], isSpecial: false },
  "arahata": { id: "arahata", name: "荒畑", lines: ["tsurumai"], isSpecial: false },
  "gokiso": { id: "gokiso", name: "御器所", lines: ["tsurumai", "sakura"], isSpecial: false },
  "kawana": { id: "kawana", name: "川名", lines: ["tsurumai"], isSpecial: false },
  "irinaka": { id: "irinaka", name: "いりなか", lines: ["tsurumai"], isSpecial: false },
  // 八事(yagoto)は定義済み
  "shiogamaguchi": { id: "shiogamaguchi", name: "塩釜口", lines: ["tsurumai"], isSpecial: false },
  "ueda": { id: "ueda", name: "植田", lines: ["tsurumai"], isSpecial: false },
  "hara": { id: "hara", name: "原", lines: ["tsurumai"], isSpecial: false },
  "hirabari": { id: "hirabari", name: "平針", lines: ["tsurumai"], isSpecial: false },
  "akaike": { id: "akaike", name: "赤池", lines: ["tsurumai"], isSpecial: false },

  // --- 桜通線 (S) ---
  "taiko-dori": { id: "taiko-dori", name: "太閤通", lines: ["sakura"], isSpecial: false }, // 旧中村区役所
  // 名古屋(nagoya)は定義済み
  "kokusai": { id: "kokusai", name: "国際センター", lines: ["sakura"], isSpecial: true },
  // 丸の内(marunouchi), 久屋大通(hisayaodori)は定義済み
  "takaoka": { id: "takaoka", name: "高岳", lines: ["sakura"], isSpecial: false },
  "kurumamichi": { id: "kurumamichi", name: "車道", lines: ["sakura"], isSpecial: false },
  // 今池(imaike)は定義済み
  "fukiage": { id: "fukiage", name: "吹上", lines: ["sakura"], isSpecial: true },
  // 御器所(gokiso)は定義済み
  "sakurayama": { id: "sakurayama", name: "桜山", lines: ["sakura"], isSpecial: false },
  "mizuho-kuyakusho": { id: "mizuho-kuyakusho", name: "瑞穂区役所", lines: ["sakura"], isSpecial: false },
  "mizuho-undojo-nishi": { id: "mizuho-undojo-nishi", name: "瑞穂運動場西", lines: ["sakura"], isSpecial: false },
  // 新瑞橋(aratamabashi)は定義済み
  "sakurahommachi": { id: "sakurahommachi", name: "桜本町", lines: ["sakura"], isSpecial: false },
  "tsurusato": { id: "tsurusato", name: "鶴里", lines: ["sakura"], isSpecial: false },
  "nonami": { id: "nonami", name: "野並", lines: ["sakura"], isSpecial: false },
  "narukokita": { id: "narukokita", name: "鳴子北", lines: ["sakura"], isSpecial: false },
  "aioiyama": { id: "aioiyama", name: "相生山", lines: ["sakura"], isSpecial: false },
  "kamisawa": { id: "kamisawa", name: "神沢", lines: ["sakura"], isSpecial: false },
  "tokushige": { id: "tokushige", name: "徳重", lines: ["sakura"], isSpecial: false },

  // --- 上飯田線 (K) ---
  "kamiiida": { id: "kamiiida", name: "上飯田", lines: ["kamiiida"], isSpecial: false },
  // 平安通(heian-dori)は定義済み
};


// ==========================================
// 2. 路線の定義 (駅IDの並び順)
// ==========================================
const lines: Record<string, string[]> = {
  higashiyama: [
    "takabata", "hatta", "iwatsuka", "nakamurakoen", "nakamuranisseki", "honjin", "kamejima",
    "nagoya", "fushimi", "sakae", "shinsakaemachi", "chikusa", "imaike", "ikeshita", "kakuozan",
    "motoyama", "higashiyamakoen", "hoshigaoka", "issha", "kamiyashiro", "hongo", "fujigaoka"
  ],
  meijo: [
    // 環状線：金山から右回り
    "kanayama", "higashibetsuin", "kamimaezu", "yabacho", "hisayaodori", "nagoyajo", "meijokoen",
    "kurokawa", "shigahondori", "heian-dori", "ozone", "nagoyadomemaeyada", "sunadabashi",
    "chayagasaka", "jiyugaoka", "motoyama", "nagoyadaigaku", "yagotonisseki", "yagoto",
    "sogo-rihabiri-center", "mizuho-undojo-higashi", "aratamabashi", "myoondori", "horita",
    "atsutajingu-temma-cho", "atsutajingu-nishi", "nishitakakura", "kanayama" // 最後にもう一度金山をつなぐ
  ],
  meiko: [
    "kanayama", "hibino", "rokubancho", "tokaidori", "minatokuyakusho", "tsukijiguchi", "nagoyako"
  ],
  tsurumai: [
    "kamiotai", "shonairyokuchikoen", "shonaidori", "joshin", "sengencho", "marunouchi", "fushimi",
    "osukannon", "kamimaezu", "tsurumai", "arahata", "gokiso", "kawana", "irinaka", "yagoto",
    "shiogamaguchi", "ueda", "hara", "hirabari", "akaike"
  ],
  sakura: [
    "taiko-dori", "nagoya", "kokusai", "marunouchi", "hisayaodori", "takaoka", "kurumamichi",
    "imaike", "fukiage", "gokiso", "sakurayama", "mizuho-kuyakusho", "mizuho-undojo-nishi",
    "aratamabashi", "sakurahommachi", "tsurusato", "nonami", "narukokita", "aioiyama", "kamisawa",
    "tokushige"
  ],
  kamiiida: [
    "kamiiida", "heian-dori"
  ]
};

// ==========================================
// 3. 接続情報の自動生成
// ==========================================
export const connections: Connection[] = [];

// 全路線をループして接続を作成
Object.entries(lines).forEach(([lineKey, stationIds]) => {
  for (let i = 0; i < stationIds.length - 1; i++) {
    const fromId = stationIds[i];
    const toId = stationIds[i + 1];

    // ※距離はとりあえず1.0kmとしています（正確な運賃計算には将来的に修正が必要）
    const defaultDistance = 1.0; 

    // 行きの接続
    connections.push({
      from: fromId,
      to: toId,
      line: lineKey,
      distance: defaultDistance
    });

    // 帰りの接続
    connections.push({
      from: toId,
      to: fromId,
      line: lineKey,
      distance: defaultDistance
    });
  }
});