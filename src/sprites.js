// ============================================================
// 角色像素画模块：用"代码"画像素小人
// 每个字符 = 一个像素的颜色。以后有专业美术了，可以把这套
// 换成真正的美术图片素材，逻辑不用改。
// ============================================================
import { GRADE_COLORS } from './playerData.js';

// 字符 → 颜色
const CHAR_COLORS = {
  H: '#2b211c', // 头发
  K: '#3a2c24', // 发髻
  S: '#f2c9a0', // 皮肤
  E: '#2b211c', // 眼睛
};

// 把十六进制颜色调暗一点（用来画袍子的暗部/褶皱）
function darken(hex, factor = 0.85) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.floor(((n >> 16) & 255) * factor);
  const g = Math.floor(((n >> 8) & 255) * factor);
  const b = Math.floor((n & 255) * factor);
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

// ============ 白衣少年：12×16 像素，四个朝向 ============
// . 透明  H 头发  K 发髻  S 皮肤  E 眼睛
// W 袍子亮部  w 袍子暗部  B 腰带（颜色随装备品级变）  F 鞋子
const PLAYER_DOWN = [
  '....HHHH....',
  '...HHHHHH...',
  '...HKKHHH...',
  '..HHHHHHHH..',
  '..HHSSSSHH..',
  '..HESSSSSEH..',
  '...SSSSSS...',
  '.WWWSSSSWWW.',
  '.WWWWWWWWWW.',
  '.WSWWWWWWWS.',
  '.WWWWBBWWWW.',
  '.WWWWBBWWWW.',
  '.WWWWWWWWWW.',
  '.WWWWWWWWWW.',
  '..FFFFFFFF..',
  '..FFFFFFFF..',
];

const PLAYER_UP = [
  '....HHHH....',
  '...HHHHHH...',
  '...HKKHHH...',
  '..HHHHHHHH..',
  '..HHHHHHHH..',
  '..HHHHHHHH..',
  '...HHHHHH...',
  '.WWWHHHWWW..',
  '.WWWWWWWWWW.',
  '.WSWWWWWWWS.',
  '.WWWWBBWWWW.',
  '.WWWWBBWWWW.',
  '.WWWWWWWWWW.',
  '.WWWWWWWWWW.',
  '..FFFFFFFF..',
  '..FFFFFFFF..',
];

const PLAYER_LEFT = [
  '....HHHH....',
  '...HHHHHH...',
  '...HKKHHH...',
  '..HHHHHHHH..',
  '..HSSSSHHH..',
  '..ESSSSSHH..',
  '..SSSSSHH...',
  '.WWWSSWWWW..',
  '.WWWWWWWWWW.',
  '.WSWWWWWWWS.',
  '.WWWWBBWWWW.',
  '.WWWWBBWWWW.',
  '.WWWWWWWWWW.',
  '.WWWWWWWWWW.',
  '..FFFFFFFF..',
  '..FFFFFFFF..',
];

// 朝右 = 朝左的镜像
const PLAYER_RIGHT = PLAYER_LEFT.map((s) => [...s].reverse().join(''));

const PLAYER_MAPS = { down: PLAYER_DOWN, up: PLAYER_UP, left: PLAYER_LEFT, right: PLAYER_RIGHT };

// ============ 剑的位置：[x, y, 类型]，X=剑柄 b=剑身 ============
const SWORD_DOWN = [[8, 7, 'X'], [9, 6, 'X'], [10, 5, 'b'], [11, 4, 'b']];
const SWORD_UP = [[9, 5, 'X'], [8, 7, 'X'], [7, 8, 'b'], [6, 9, 'b'], [5, 10, 'b'], [4, 11, 'b'], [3, 12, 'b']];
const SWORD_LEFT = [[9, 5, 'X'], [10, 4, 'b'], [11, 3, 'b']];
const SWORD_RIGHT = SWORD_LEFT.map(([x, y, t]) => [11 - x, y, t]);
const SWORDS = { down: SWORD_DOWN, up: SWORD_UP, left: SWORD_LEFT, right: SWORD_RIGHT };

// ============ 画像素小人 ============
// g：Phaser 的 Graphics 画笔
// facing：朝向（down/up/left/right）
// weapon/armor/feet：当前穿着的装备（没穿就是 undefined）
export function drawPlayer(g, facing, { weapon, armor, feet } = {}) {
  const map = PLAYER_MAPS[facing] || PLAYER_DOWN;

  // 袍子颜色：默认白衣；穿了别的法袍就换色
  const robe = (armor && armor.appearance && armor.appearance.robe) || '#f2efe6';
  const robeDark = darken(robe);
  // 腰带颜色 = 法袍的品级颜色（一眼看出装备品级）
  const belt = (armor && armor.grade) ? GRADE_COLORS[armor.grade] : '#7d8fb5';
  // 鞋子颜色
  const shoes = (feet && feet.appearance && feet.appearance.shoes) || '#4a4a4a';

  g.clear();
  const s = 2; // 每个像素放大 2 倍 → 24×32 的角色

  for (let row = 0; row < 16; row++) {
    for (let col = 0; col < 12; col++) {
      const ch = map[row][col];
      if (ch === '.') continue; // 透明

      let color;
      if (ch === 'W') color = robe;
      else if (ch === 'w') color = robeDark;
      else if (ch === 'B') color = belt;
      else if (ch === 'F') color = shoes;
      else color = CHAR_COLORS[ch];

      g.fillStyle(color, 1);
      g.fillRect(col * s, row * s, s, s);
    }
  }

  // 武器：背上的剑（剑身颜色由武器决定）
  if (weapon) {
    const blade = (weapon.appearance && weapon.appearance.blade) || '#b08d57';
    for (const [x, y, t] of SWORDS[facing] || SWORDS.down) {
      g.fillStyle(t === 'X' ? '#6b4a2f' : blade, 1);
      g.fillRect(x * s, y * s, s, s);
    }
  }
}

// ============================================================
// 动物：用基础图形（圆/矩形）拼出来的小动物
// 每个物种 = 一个"画法"函数，坐标相对中心 (0,0)，朝左
// 画朝右 = 把画笔左右翻转（scaleX = -1）
// ============================================================
const ANIMAL_SPECS = {
  rabbit: { // 兔子
    draw(g) {
      g.fillStyle(0xf2efe6, 1); // 白毛
      g.fillRect(-6, -11, 2, 6); // 左耳
      g.fillRect(-3, -12, 2, 7); // 右耳
      g.fillStyle(0xf0a8b8, 1);  // 粉色耳心
      g.fillRect(-5, -10, 1, 3);
      g.fillRect(-2, -11, 1, 3);
      g.fillStyle(0xf2efe6, 1);
      g.fillCircle(-4, -5, 4);   // 头
      g.fillCircle(3, -4, 5);    // 身体
      g.fillStyle(0xd8d4c8, 1);
      g.fillCircle(8, -3, 2);    // 短尾巴
      g.fillStyle(0x2b211c, 1);
      g.fillCircle(-6, -6, 1);   // 眼睛
      g.fillStyle(0xf0a8b8, 1);
      g.fillCircle(-8, -4, 1);   // 鼻子
      g.fillStyle(0xf2efe6, 1);
      g.fillRect(0, 2, 3, 2);    // 脚
      g.fillRect(4, 2, 3, 2);
    },
  },
  pheasant: { // 野鸡（雉）
    draw(g) {
      g.fillStyle(0x8a5a2b, 1);
      g.fillRect(6, -3, 7, 2);   // 尾羽（长）
      g.fillRect(6, -1, 5, 2);
      g.fillStyle(0x6b4a2f, 1);
      g.fillRect(6, -4, 8, 1);   // 尾羽（深色）
      g.fillStyle(0xc07a4a, 1);
      g.fillCircle(1, -3, 5);    // 身体（棕红）
      g.fillStyle(0x8a5a2b, 1);
      g.fillCircle(1, -4, 3);    // 翅膀
      g.fillStyle(0x3a6b7a, 1);
      g.fillCircle(-6, -6, 3);   // 头（青颈）
      g.fillStyle(0xe8c86a, 1);
      g.fillRect(-10, -5, 3, 2); // 喙
      g.fillStyle(0xd96a7a, 1);
      g.fillCircle(-5, -8, 2);   // 肉冠
      g.fillStyle(0x2b211c, 1);
      g.fillCircle(-7, -7, 1);   // 眼睛
      g.fillStyle(0xc9a05a, 1);
      g.fillRect(0, 2, 1, 3);    // 腿
      g.fillRect(3, 2, 1, 3);
    },
  },
  deer: { // 白鹿
    draw(g) {
      g.fillStyle(0xf5f0e0, 1);
      g.fillRect(-4, -6, 3, 3);  // 脖子
      g.fillCircle(3, -4, 5);    // 身体
      g.fillStyle(0x6b4a2f, 1);
      g.fillRect(-7, -10, 1, 4); // 鹿角
      g.fillRect(-5, -11, 1, 4);
      g.fillRect(-7, -9, 3, 1);
      g.fillStyle(0xf5f0e0, 1);
      g.fillCircle(-6, -5, 3);   // 头
      g.fillCircle(8, -4, 2);    // 尾巴
      g.fillStyle(0x2b211c, 1);
      g.fillCircle(-7, -6, 1);   // 眼睛
      g.fillStyle(0xf5f0e0, 1);
      g.fillRect(-1, 2, 1, 4);   // 四条腿
      g.fillRect(2, 2, 1, 4);
      g.fillRect(5, 2, 1, 4);
      g.fillRect(8, 2, 1, 4);
    },
  },
  feifei: { // 朏朏：山海经·中山经——白尾之猫，养之可以已忧
    draw(g) {
      g.fillStyle(0xd8b078, 1);
      g.fillRect(-6, -10, 2, 2); // 耳朵
      g.fillRect(-3, -10, 2, 2);
      g.fillCircle(-4, -6, 3);   // 头
      g.fillCircle(1, -4, 4);    // 身体
      g.fillStyle(0xf2efe6, 1);
      g.fillCircle(6, -4, 2);    // 白尾（它的标志）
      g.fillStyle(0x2b211c, 1);
      g.fillCircle(-5, -7, 1);   // 眼睛
      g.fillStyle(0xd8b078, 1);
      g.fillRect(-1, 1, 2, 3);   // 腿
      g.fillRect(3, 1, 2, 3);
    },
  },
  xingxing: { // 狌狌：山海经·南山经——白耳之猿，能走能奔
    draw(g) {
      g.fillStyle(0xa0866a, 1);
      g.fillCircle(1, -5, 5);    // 身体
      g.fillCircle(-5, -7, 4);   // 头
      g.fillStyle(0xf2efe6, 1);
      g.fillCircle(-8, -9, 2);   // 白耳（它的标志）
      g.fillCircle(-3, -10, 2);
      g.fillStyle(0xc9b294, 1);
      g.fillCircle(-6, -7, 2);   // 脸（浅色）
      g.fillStyle(0x2b211c, 1);
      g.fillCircle(-7, -8, 1);   // 眼睛
      g.fillStyle(0xa0866a, 1);
      g.fillRect(-2, 1, 2, 3);   // 手
      g.fillRect(3, 1, 2, 3);
      g.fillRect(-1, 1, 2, 4);   // 腿
      g.fillRect(2, 1, 2, 4);
    },
  },
  dangkang: { // 当康：山海经·东山经——其状如豚而有牙，见则天下大穰
    draw(g) {
      g.fillStyle(0xe8b0a0, 1);
      g.fillCircle(1, -4, 6);    // 身体
      g.fillCircle(-7, -5, 4);   // 头
      g.fillStyle(0xd99888, 1);
      g.fillRect(-9, -11, 2, 2); // 耳朵
      g.fillStyle(0xf2c9a0, 1);
      g.fillCircle(-10, -5, 2);  // 拱鼻
      g.fillStyle(0xf2efe6, 1);
      g.fillRect(-11, -9, 1, 3); // 獠牙（它的标志）
      g.fillRect(-8, -9, 1, 3);
      g.fillStyle(0x2b211c, 1);
      g.fillCircle(-8, -6, 1);   // 眼睛
      g.fillStyle(0xe8b0a0, 1);
      g.fillRect(-2, 2, 2, 3);   // 腿
      g.fillRect(3, 2, 2, 3);
    },
  },
};

// 画一只小动物：key = 物种，facing = 'left' / 'right'
export function drawAnimal(g, key, facing) {
  const spec = ANIMAL_SPECS[key];
  if (!spec) return;
  g.clear();
  g.scaleX = facing === 'right' ? -1 : 1; // 朝左画好，朝右就整体翻转
  spec.draw(g);
}
