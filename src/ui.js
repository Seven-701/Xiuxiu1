// ============================================================
// 界面模块：把游戏数据"画"成网页元素
// 为什么界面用网页（HTML/CSS）而不是 Phaser 画？
// 因为血条、按钮、列表用网页写最方便、最好看，还能顺便学网页开发。
// 分工：Phaser 管"世界"（地图/移动/碰撞/技能效果），网页管"界面"。
// ============================================================
import {
  useItem, castSkill, realmName, phaseName, shieldArmorBonus,
  EQUIP_SLOTS, GRADE_COLORS, SKILLS,
} from './playerData.js';

const data = () => window.gameData; // 全游戏共享的玩家数据
const el = (id) => document.getElementById(id);
const gradeColor = (g) => GRADE_COLORS[g] || '#fff'; // 品级对应的颜色

let inventoryOpen = false;

// ============ 搭好物品栏 5 个格子的框架 ============
const hotbar = el('hotbar');
for (let i = 0; i < 5; i++) {
  const slot = document.createElement('div');
  slot.className = 'hotbar-slot';
  slot.dataset.index = i;
  slot.innerHTML = '<span class="key">' + (i + 1) + '</span><br>空';
  hotbar.appendChild(slot);
}

// ============ 搭好技能栏框架（只搭一次，以后只更新冷却文字） ============
const KEY_LABELS = ['Q', 'E', 'R'];
const skillSlots = [];
for (let i = 0; i < SKILLS.length; i++) {
  const slot = el('skills').children[i];
  slot.innerHTML = '<span class="key">' + KEY_LABELS[i] + '</span>' + SKILLS[i].name +
    '<br><span class="skill-info">耗气 ' + SKILLS[i].qiCost + ' · <span class="cd"></span></span>';
  skillSlots.push(slot);
}

// ============ 键盘操作 ============
document.addEventListener('keydown', (e) => {
  if (e.repeat) return; // 按住不放只算一次

  const key = e.key.toLowerCase();

  if (key === 'b') {
    toggleInventory(); // B：开关背包
  } else if (key === 'escape') {
    if (inventoryOpen) toggleInventory(); // ESC：关掉背包（开着才关，没开不做事）
  } else if (key >= '1' && key <= '5') {
    useHotbarItem(Number(key) - 1); // 1~5：使用物品栏对应格子
  } else if (key === 'q' || key === 'e' || key === 'r') {
    const index = { q: 0, e: 1, r: 2 }[key]; // Q/E/R：放技能
    castByIndex(index);
  }
});

// ============ 点击事件（事件委托） ============
hotbar.addEventListener('click', (e) => {
  const slot = e.target.closest('.hotbar-slot');
  if (slot) useHotbarItem(Number(slot.dataset.index));
});

el('item-list').addEventListener('click', (e) => {
  const row = e.target.closest('.inv-row');
  if (!row) return;
  const msg = useItem(data(), Number(row.dataset.index));
  if (msg) toast(msg);
  renderInventory();
});

el('skills').addEventListener('click', (e) => {
  const slot = e.target.closest('.skill-slot');
  if (slot) castByIndex(Number(slot.dataset.index));
});

// ============ 放技能 ============
function castByIndex(index) {
  const result = castSkill(data(), index);
  toast(result.msg);
}

// ============ 开关背包 ============
function toggleInventory() {
  inventoryOpen = !inventoryOpen;
  el('inventory').classList.toggle('open', inventoryOpen);
  if (inventoryOpen) renderInventory();
}

// ============ 物品栏显示哪些物品 ============
// 规则：丹药排在前面（方便快捷键使用），其余按背包顺序。
// 返回前 5 个物品在背包里的真实下标（这样按 3 就能吃到对应的丹药）
function hotbarIndexes(d) {
  const consumables = d.inventory.filter((i) => i.type === 'consumable');
  const rest = d.inventory.filter((i) => i.type !== 'consumable');
  return [...consumables, ...rest].slice(0, 5).map((i) => d.inventory.indexOf(i));
}

// ============ 使用物品栏第 index 格的物品 ============
function useHotbarItem(index) {
  const indexes = hotbarIndexes(data());
  const realIndex = indexes[index];
  if (realIndex === undefined) return;
  const msg = useItem(data(), realIndex);
  if (msg) toast(msg);
}

// ============ 防打断机制 ============
// 界面每 0.1 秒刷新一次。如果每次都重建 HTML，鼠标点击会被打断：
// 你按下鼠标的瞬间，旧按钮被销毁、新按钮补上，
// 浏览器就会认为"按下的按钮"和"松开的按钮"不是同一个，点击不生效。
// 所以：只在内容真正变化时才重建，其余时候只更新文字。
let lastHotbarSig = '';
let lastInvSig = '';

// 物品栏的"内容指纹"：内容不变则指纹不变，不用重建
function hotbarSignature(d) {
  return hotbarIndexes(d).map((i) => {
    const item = d.inventory[i];
    return item ? item.id + ':' + item.count : '-';
  }).join('|');
}

// 背包的"内容指纹"
function inventorySignature(d) {
  return d.inventory.map((i) => i.id + ':' + i.count + ':' + (i.equipped ? 'e' : 'n')).join('|');
}

// ============ 每 0.1 秒刷新一次界面 ============
// 简单粗暴的定时刷新。以后数据多了可以改成"变了才刷新"（事件驱动）
function refresh() {
  const d = data();
  const now = Date.now();

  // --- 状态栏 ---
  el('name').textContent = d.name;
  el('phase').textContent = phaseName(d);   // 大阶段：炼精化气
  el('realm').textContent = realmName(d);   // 小境界：练气三层
  el('hp-fill').style.width = (d.hp / d.maxHp) * 100 + '%';
  el('hp-text').textContent = d.hp + '/' + d.maxHp;
  el('qi-fill').style.width = (d.qi / d.maxQi) * 100 + '%';
  el('qi-text').textContent = d.qi + '/' + d.maxQi;
  el('armor').textContent = d.armor + shieldArmorBonus(d); // 护甲 + 金光神咒加成
  el('attack').textContent = d.attack;
  el('exp').textContent = d.exp + '/' + d.expToNext;
  el('linggen').textContent = d.talents.linggen + '灵根（' + d.talents.quality + '）';
  el('wuxing').textContent = d.talents.wuxing;
  el('gengu').textContent = d.talents.gengu;
  el('fuyuan').textContent = d.talents.fuyuan;

  // --- 物品栏：内容变了才重建 ---
  const hotbarSig = hotbarSignature(d);
  if (hotbarSig !== lastHotbarSig) {
    lastHotbarSig = hotbarSig;
    const indexes = hotbarIndexes(d);
    const slots = hotbar.children;
    for (let i = 0; i < 5; i++) {
      const item = d.inventory[indexes[i]];
      slots[i].innerHTML = item
        ? '<span class="key">' + (i + 1) + '</span><br>' + item.name + '<br>×' + item.count
        : '<span class="key">' + (i + 1) + '</span><br>空';
    }
  }

  // --- 技能栏：只更新状态和冷却文字，不重建（点击就不会被打断） ---
  for (let i = 0; i < SKILLS.length; i++) {
    const skill = SKILLS[i];
    const cdLeft = Math.max(0, Math.ceil((d.skillCooldowns[i] - now) / 1000));
    const ready = cdLeft === 0 && d.qi >= skill.qiCost;
    const slot = skillSlots[i];
    slot.className = 'skill-slot' + (ready ? '' : ' not-ready');
    slot.querySelector('.cd').textContent = cdLeft > 0 ? '冷却 ' + cdLeft + 's' : '';
  }

  // --- 背包开着且内容变了才重新渲染 ---
  if (inventoryOpen) {
    const invSig = inventorySignature(d);
    if (invSig !== lastInvSig) {
      lastInvSig = invSig;
      renderInventory();
    }
  }
}

// ============ 渲染背包内容 ============
function renderInventory() {
  const d = data();

  // 装备栏：8 个部位
  const equipBox = el('equip-slots');
  equipBox.innerHTML = '';
  for (const slot of EQUIP_SLOTS) {
    const equipped = d.inventory.find((i) => i.slot === slot.key && i.equipped);
    const div = document.createElement('div');
    div.className = 'equip-slot' + (equipped ? '' : ' empty');
    div.innerHTML = '<div class="equip-label">' + slot.label + '</div>' +
      '<div' + (equipped ? ' style="color:' + gradeColor(equipped.grade) + '"' : '') + '>' +
        (equipped ? equipped.name : '未装备') + '</div>';
    equipBox.appendChild(div);
  }

  // 物品列表（名字带品级颜色）
  const list = el('item-list');
  list.innerHTML = '';
  d.inventory.forEach((item, index) => {
    let action = '';
    if (item.type === 'weapon' || item.type === 'armor' || item.type === 'gongfa') {
      action = item.equipped ? '卸下' : '装备';
    } else if (item.type === 'consumable') {
      action = '使用';
    }

    const row = document.createElement('div');
    row.className = 'inv-row';
    row.dataset.index = index;
    row.innerHTML =
      '<span class="inv-name" style="color:' + gradeColor(item.grade) + '">' +
        '【' + item.grade + '】' + item.name +
        (item.count > 1 ? ' ×' + item.count : '') +
        (item.equipped ? '（已装备）' : '') + '</span>' +
      '<span class="inv-desc">' + item.desc + '</span>' +
      '<span class="inv-action">' + action + '</span>';
    list.appendChild(row);
  });
}

// ============ 提示条 ============
let toastTimer = null;
function toast(msg) {
  el('toast').textContent = msg;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el('toast').textContent = ''; }, 2000); // 2 秒后消失
}

// 开始定时刷新
setInterval(refresh, 100);
