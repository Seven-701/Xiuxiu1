// ============================================================
// 玩家数据模块：存放游戏的"数据"和"规则"，不碰画面
// 游戏世界的一切状态都在这里：天赋、属性、境界、背包、装备、功法、技能
// 以后做联机时，这份数据会放到服务器上（每个玩家一份）
// ============================================================

// ============ 品级体系（取材道教器物传统，游戏化改编） ============
// 从低到高，七级。
export const GRADES = ['凡品', '法器', '法宝', '灵器', '灵宝', '仙器', '神器'];

// 每个品级的显示颜色（低→高：灰、绿、蓝、紫、橙、金、红）
export const GRADE_COLORS = {
  '凡品': '#9e9e9e',
  '法器': '#4caf50',
  '法宝': '#2196f3',
  '灵器': '#9c27b0',
  '灵宝': '#ff9800',
  '仙器': '#ffd700',
  '神器': '#ff1744',
};

// ============ 境界体系：道教内丹四阶段 ============
// 道教丹道修行的四个大阶段，游戏化对应：
//   炼精化气（起步，练气）→ 炼气化神（筑基、金丹）
//   → 炼神还虚（元婴、化神）→ 炼虚合道（炼虚、大乘、渡劫，终至飞升）
export const PHASES = [
  {
    name: '炼精化气',
    stages: ['练气一层', '练气二层', '练气三层', '练气四层', '练气五层',
      '练气六层', '练气七层', '练气八层', '练气九层'],
  },
  {
    name: '炼气化神',
    stages: ['筑基初期', '筑基中期', '筑基后期',
      '金丹初期', '金丹中期', '金丹后期'],
  },
  {
    name: '炼神还虚',
    stages: ['元婴初期', '元婴中期', '元婴后期',
      '化神初期', '化神中期', '化神后期'],
  },
  {
    name: '炼虚合道',
    stages: ['炼虚初期', '炼虚中期', '炼虚后期', '大乘', '渡劫', '飞升'],
  },
];

// 拍平后的总境界表：realmIndex 对应这里的下标
export const ALL_REALMS = PHASES.flatMap((p) => p.stages);

// 当前境界名（小境界，如"练气三层"）
export function realmName(data) {
  return ALL_REALMS[data.realmIndex];
}

// 当前大阶段名（如"炼精化气"）
export function phaseName(data) {
  let count = 0;
  for (const phase of PHASES) {
    count += phase.stages.length;
    if (data.realmIndex < count) return phase.name;
  }
  return PHASES[PHASES.length - 1].name;
}

// ============ 装备部位（8 个） ============
export const EQUIP_SLOTS = [
  { key: 'weapon', label: '武器' },
  { key: 'head', label: '头冠' },
  { key: 'body', label: '法袍' },
  { key: 'belt', label: '腰带' },
  { key: 'feet', label: '云履' },
  { key: 'jade', label: '玉佩' },
  { key: 'ring', label: '戒指' },
  { key: 'gongfa', label: '主修功法' },
];

// ============ 技能（取材道教神话与法术，游戏化改编） ============
export const SKILLS = [
  {
    id: 'suodi-chengcun', name: '缩地成寸',
    desc: '道家遁术，一步千里。6 秒内移速翻倍',
    qiCost: 10, cooldown: 10, duration: 6000,
    effect: 'speed',
  },
  {
    id: 'jinguang-shenzhou', name: '金光神咒',
    desc: '道教八大神咒之一，金光护体。8 秒内护甲 +10',
    qiCost: 15, cooldown: 15, duration: 8000,
    effect: 'shield', armor: 10,
  },
  {
    id: 'yujian-shu', name: '御剑术',
    desc: '剑仙之术，御剑向前急冲',
    qiCost: 20, cooldown: 5,
    effect: 'dash',
  },
];

// ============ 随机工具 ============
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// 加权随机：entries 是 [值, 权重] 的列表，权重越大越容易出现
function weightedPick(entries) {
  const total = entries.reduce((sum, e) => sum + e[1], 0);
  let roll = Math.random() * total;
  for (const [value, weight] of entries) {
    roll -= weight;
    if (roll < 0) return value;
  }
  return entries[0][0];
}

// ============ 天赋系统 ============
// 每个新玩家随机生成天赋——这就是"每个人不同"的根基
export function rollTalents() {
  return {
    linggen: weightedPick([
      ['金', 20], ['木', 20], ['水', 20], ['火', 20], ['土', 20], // 五行灵根，最常见
      ['雷', 8], ['冰', 8], ['风', 4],                            // 变异灵根，稀有
    ]),
    quality: weightedPick([
      ['下品', 40], ['中品', 30], ['上品', 20], ['极品', 9], ['天品', 1], // 品级越高越稀有
    ]),
    wuxing: randInt(1, 100), // 悟性：影响经验获取
    gengu: randInt(1, 100),  // 根骨：待开发
    fuyuan: randInt(1, 100), // 福缘：待开发
  };
}

// ============ 材料（怪物掉落，以后炼丹/炼器/制符用） ============
export const MATERIALS = [
  { id: 'tu-rou', name: '兔肉', desc: '野兔肉，炼丹入药的材料' },
  { id: 'zhi-yu', name: '雉羽', desc: '野鸡尾羽，可制符笔' },
  { id: 'lu-rong', name: '鹿茸', desc: '白鹿之茸，滋补入药' },
  { id: 'feifei-weihao', name: '朏朏尾毫', desc: '灵猫尾毫，柔可制笔' },
  { id: 'xingxing-zhua', name: '狌狌爪', desc: '白耳猿利爪，炼器材料' },
  { id: 'dangkang-liaoya', name: '当康獠牙', desc: '瑞兽之牙，炼器材料' },
  { id: 'mu-cai', name: '木材', desc: '修缮道观的木料，砍树获得' },
  { id: 'shi-cai', name: '石材', desc: '修缮道观的石料，采石获得' },
  { id: 'mao-cao', name: '茅草', desc: '修缮道观的草料，割草获得' },
];

// ============ 序章：修缮道观与点化 ============
// 道观有四处需要修缮，每处凑齐材料一次修好
export const REPAIRS = [
  { key: 'shanmen', name: '山门', need: [{ id: 'mu-cai', count: 5 }, { id: 'shi-cai', count: 3 }] },
  { key: 'xianglu', name: '香炉', need: [{ id: 'shi-cai', count: 5 }] },
  { key: 'sandian', name: '三清殿', need: [{ id: 'mu-cai', count: 10 }, { id: 'mao-cao', count: 8 }] },
  { key: 'xiangfang', name: '厢房', need: [{ id: 'mu-cai', count: 5 }, { id: 'mao-cao', count: 5 }] },
];

// 把"需求材料"拼成给人看的话（如"木材×5 石材×3"）
export function repairNeedText(spot) {
  return spot.need.map((n) => {
    const m = MATERIALS.find((x) => x.id === n.id);
    return (m ? m.name : n.id) + '×' + n.count;
  }).join(' ');
}

// 消耗背包里的材料：数量足够返回 true 并扣掉；不够返回 false（不会白扣）
export function consumeItem(data, id, amount) {
  const item = data.inventory.find((i) => i.id === id);
  if (!item || item.count < amount) return false;
  item.count -= amount;
  return true;
}

// 修缮一处：材料齐 → 扣材料、记进度；不齐 → 返回缺什么
export function submitRepair(data, key) {
  const spot = REPAIRS.find((r) => r.key === key);
  if (!spot) return { ok: false, msg: '没有这处地方' };
  if (data.repair[key]) return { ok: false, msg: spot.name + '已经修好了' };
  for (const n of spot.need) { // 先全部检查一遍，够了一次性扣
    const item = data.inventory.find((i) => i.id === n.id);
    if (!item || item.count < n.count) {
      return { ok: false, msg: '材料不足：修' + spot.name + '还需 ' + repairNeedText(spot) };
    }
  }
  for (const n of spot.need) consumeItem(data, n.id, n.count);
  data.repair[key] = 1;
  return { ok: true, msg: spot.name + '修缮完成！' };
}

// 四处都修好了吗？（都修好才能上香点化）
export function allRepaired(data) {
  return REPAIRS.every((r) => data.repair[r.key]);
}

// 点化神仙：五方五老按五行对应（东青木、南赤火、中黄土、西白金、北黑水）
// 变异灵根由"本行之主"点化：雷=火之变→赤帝，冰=水之变→黑帝，风=木之变→青帝
export function pointDeity(linggen) {
  const MAP = {
    '木': { name: '东方青帝', color: '#4caf50' },
    '火': { name: '南方赤帝', color: '#ff7043' },
    '土': { name: '中央黄帝', color: '#ffd54f' },
    '金': { name: '西方白帝', color: '#eeeeee' },
    '水': { name: '北方黑帝', color: '#4fc3f7' },
    '雷': { name: '南方赤帝', color: '#ff7043' },
    '冰': { name: '北方黑帝', color: '#4fc3f7' },
    '风': { name: '东方青帝', color: '#4caf50' },
  };
  return MAP[linggen] || MAP['土'];
}

// 点化：揭晓天赋 + 神仙赐下馈赠（《吐纳心法》和 10 颗灵石）
export function performDianHua(data) {
  data.talentsRevealed = true;
  addItem(data, 'tuna-xinfa');
  addLingShi(data, 10);
}

// ============ 创建一名新玩家 ============
export function createPlayerData() {
  const talents = rollTalents();

  return {
    name: '无名散修',
    talents,
    expBonus: 0.5 + talents.wuxing / 100, // 悟性越高，经验获得越多（0.5~1.5 倍）

    // ---- 属性 ----
    baseMaxHp: 100, baseMaxQi: 50, // 基础上限（不穿装备时的值）
    hp: 100, maxHp: 100,     // 气血（血量）
    qi: 50, maxQi: 50,       // 内力：放技能要消耗
    armor: 0,                // 护甲：由装备提供
    attack: 0,               // 攻击力：由武器提供
    exp: 0, expToNext: 100,  // 经验值 / 当前境界升级所需经验
    realmIndex: 0,           // 当前境界在 ALL_REALMS 里的下标

    // ---- 序章状态 ----
    talentsRevealed: false,  // 点化前天赋保密（界面显示？？？），点化时揭晓
    repair: { shanmen: 0, xianglu: 0, sandian: 0, xiangfang: 0 }, // 道观四处修缮进度：0 未修 / 1 已修
    story: null,             // 剧情面板内容（GameScene 写入，界面显示）
    interactHint: '',        // "按 F"交互提示（GameScene 每帧写入，界面显示）

    // ---- 技能状态 ----
    skillCooldowns: [0, 0, 0], // 每个技能的冷却结束时间（Date.now() 时间戳）
    buffs: {                    // 各种增益的结束时间
      speedUntil: 0,            // 缩地成寸：移速翻倍
      shieldUntil: 0,           // 金光神咒：护甲 +10
      dashUntil: 0,             // 御剑术：冲刺
    },
    pendingDash: false,         // 御剑术待执行标志，GameScene 读到后执行

    inventory: [
      {
        id: 'mu-jian', name: '木剑', type: 'weapon', slot: 'weapon',
        grade: '凡品', equipped: true, count: 1,
        desc: '寻常桃木剑，攻击 +5（道观里捡到的遗物）',
        stats: { attack: 5 },
        appearance: { blade: '#b08d57' }, // 剑身颜色（背在身上的剑）
      },
      {
        id: 'cu-bu-yi', name: '粗布衣', type: 'armor', slot: 'body',
        grade: '凡品', equipped: true, count: 1,
        desc: '粗麻织成的衣裳，护甲 +5（道观里捡到的遗物）',
        stats: { armor: 5 },
        appearance: { robe: '#f2efe6' }, // 袍子颜色（以后换别的法袍就会变色）
      },
      {
        id: 'cao-xie', name: '草鞋', type: 'armor', slot: 'feet',
        grade: '凡品', equipped: true, count: 1,
        desc: '草编云履，行走轻便，护甲 +1（道观里捡到的遗物）',
        stats: { armor: 1 },
        appearance: { shoes: '#c9a05a' }, // 鞋子颜色
      },
      {
        id: 'huangting-canjuan', name: '《黄庭经·残卷》', type: 'gongfa', slot: 'gongfa',
        grade: '法器', equipped: false, count: 1,
        desc: '上清派修真经典残卷，内力上限 +50',
        stats: { maxQi: 50 },
      },
      {
        id: 'xiao-huan-dan', name: '小还丹', type: 'consumable',
        grade: '凡品', count: 2,
        desc: '服用后恢复 30 点气血',
        effects: { hp: 30 },
      },
      {
        id: 'hui-qi-dan', name: '回气丹', type: 'consumable',
        grade: '凡品', count: 1,
        desc: '服用后恢复 20 点内力',
        effects: { qi: 20 },
      },
      {
        id: 'ling-shi', name: '灵石', type: 'material',
        grade: '凡品', count: 0,
        desc: '修仙界通用货币，蕴含一丝灵气',
      },
      // 怪物掉落的材料（数量 0 = 还没打到过，打到了数量才 +1）
      ...MATERIALS.map((m) => ({ ...m, type: 'material', grade: '凡品', count: 0 })),
    ],
  };
}

// ============ 重新计算属性 ============
export function recomputeStats(data) {
  let armor = 0;
  let attack = 0;
  let bonusMaxHp = 0;
  let bonusMaxQi = 0;
  for (const item of data.inventory) {
    if (item.equipped && item.stats) {
      armor += item.stats.armor || 0;
      attack += item.stats.attack || 0;
      bonusMaxHp += item.stats.maxHp || 0;
      bonusMaxQi += item.stats.maxQi || 0;
    }
  }
  data.armor = armor;
  data.attack = attack;
  data.maxHp = data.baseMaxHp + bonusMaxHp;
  data.maxQi = data.baseMaxQi + bonusMaxQi;
  data.hp = Math.min(data.hp, data.maxHp);
  data.qi = Math.min(data.qi, data.maxQi);
}

// ============ 使用物品（丹药服用 / 装备穿戴 / 功法修习） ============
export function useItem(data, index) {
  const item = data.inventory[index];
  if (!item || item.count <= 0) return null;

  if (item.type === 'consumable') {
    data.hp = Math.min(data.maxHp, data.hp + (item.effects.hp || 0));
    data.qi = Math.min(data.maxQi, data.qi + (item.effects.qi || 0));
    item.count -= 1;
    if (item.count <= 0) data.inventory.splice(index, 1);
    return item.name + ' 已服用';
  }

  if (item.type === 'weapon' || item.type === 'armor' || item.type === 'gongfa') {
    toggleEquip(data, index);
    return item.name + (item.equipped ? ' 已装备' : ' 已卸下');
  }

  return item.name + ' 不能直接使用';
}

// ============ 穿戴/卸下装备（功法同理） ============
export function toggleEquip(data, index) {
  const item = data.inventory[index];
  if (!item || !item.slot) return;

  if (!item.equipped) {
    for (const other of data.inventory) {
      if (other !== item && other.slot === item.slot) other.equipped = false;
    }
  }
  item.equipped = !item.equipped;
  recomputeStats(data);
}

// ============ 经验和境界突破 ============
// 返回实际获得的经验（悟性加成后），界面飘字用
export function addExp(data, amount) {
  const gained = Math.round(amount * data.expBonus); // 悟性加成
  data.exp += gained;

  // ⏳ 占位规则：经验满自动突破。真正的突破条件你正在设计中
  //（方向已定：参照道教修行，如闭关、丹药、心魔等）
  while (data.exp >= data.expToNext) {
    data.exp -= data.expToNext;
    data.realmIndex = Math.min(data.realmIndex + 1, ALL_REALMS.length - 1);
    data.expToNext *= 2;
    data.baseMaxHp += 20;
    data.baseMaxQi += 10;
  }
  recomputeStats(data);
  data.hp = data.maxHp;
  data.qi = data.maxQi;
  return gained;
}

// ============ 技能 ============
// 施放第 skillIndex 个技能。返回 { ok, msg } 给界面显示
export function castSkill(data, skillIndex) {
  const skill = SKILLS[skillIndex];
  if (!skill) return { ok: false, msg: '技能不存在' };

  const now = Date.now();

  // 序章：点化前是凡人之躯，施展不了道法
  if (!data.talentsRevealed) {
    return { ok: false, msg: '尚未点化，凡人之躯施展不了道法' };
  }

  // 检查冷却
  if (now < data.skillCooldowns[skillIndex]) {
    const left = Math.ceil((data.skillCooldowns[skillIndex] - now) / 1000);
    return { ok: false, msg: skill.name + ' 冷却中（剩 ' + left + ' 秒）' };
  }
  // 检查内力
  if (data.qi < skill.qiCost) {
    return { ok: false, msg: '内力不足（' + skill.name + ' 需要 ' + skill.qiCost + ' 点）' };
  }

  // 扣内力，进冷却
  data.qi -= skill.qiCost;
  data.skillCooldowns[skillIndex] = now + skill.cooldown * 1000;

  if (skill.effect === 'speed') {
    data.buffs.speedUntil = now + skill.duration;
    return { ok: true, msg: '施展「' + skill.name + '」！移速翻倍 ' + skill.duration / 1000 + ' 秒' };
  }
  if (skill.effect === 'shield') {
    data.buffs.shieldUntil = now + skill.duration;
    return { ok: true, msg: '施展「' + skill.name + '」！护甲 +' + skill.armor + '，持续 ' + skill.duration / 1000 + ' 秒' };
  }
  if (skill.effect === 'dash') {
    data.pendingDash = true; // 由 GameScene 读到后执行前冲
    return { ok: true, msg: '施展「' + skill.name + '」！御剑前冲' };
  }
  return { ok: false, msg: '技能效果还没实现' };
}

// ============ 内力回复 ============
// 缓慢自动回气（每秒 1 点）。以后做"打坐"玩法时，打坐期间回气快很多
export function regenQi(data, dtMs) {
  data.qi = Math.min(data.maxQi, data.qi + (dtMs / 1000) * 1);
}

// ============ 金光神咒的护甲加成（buff 生效期间） ============
export function shieldArmorBonus(data) {
  const skill = SKILLS.find((s) => s.id === 'jinguang-shenzhou');
  return Date.now() < data.buffs.shieldUntil ? skill.armor : 0;
}

// ============ 捡到灵石 ============
export function addLingShi(data, amount) {
  const lingShi = data.inventory.find((i) => i.id === 'ling-shi');
  if (lingShi) lingShi.count += amount;
}

// ============ 物品模板 ============
// 不是材料的可获取物品（任务奖励、仙人馈赠）放这里
export const ITEM_TEMPLATES = [
  {
    id: 'tuna-xinfa', name: '《吐纳心法》', type: 'gongfa', slot: 'gongfa',
    grade: '凡品', count: 1,
    desc: '道家基础吐纳之术，内力上限 +20',
    stats: { maxQi: 20 },
  },
];

// ============ 往背包加物品 ============
// 背包里已经有这个物品 → 数量 +1；没有 → 先查材料表，再查物品模板
export function addItem(data, id, amount = 1) {
  const item = data.inventory.find((i) => i.id === id);
  if (item) {
    item.count += amount;
  } else {
    const m = MATERIALS.find((x) => x.id === id);
    if (m) data.inventory.push({ ...m, type: 'material', grade: '凡品', count: amount });
    else {
      const t = ITEM_TEMPLATES.find((x) => x.id === id);
      if (t) data.inventory.push({ ...t });
    }
  }
}
